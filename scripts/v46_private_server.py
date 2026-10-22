"""Loopback-only authenticated browser for the V4.3 private content store.

This service is deliberately local-only. It never writes to the store and does not
provide upload, delete, Feishu, or publishing endpoints.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import mimetypes
import os
import re
import sys
import time
from http.cookies import CookieError, SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.v43_import import list_documents, read_document  # noqa: E402

PRIVATE_UI_ROOT = REPO_ROOT / "private_ui"
DEFAULT_STATIC_ROOT = REPO_ROOT / "web" / "out"
SESSION_COOKIE = "clai_private_session"
SESSION_TTL_SECONDS = 30 * 60
TOKEN_MIN_LENGTH = 32
MAX_LOGIN_BODY_BYTES = 4096
DOCUMENT_ID_RE = re.compile(r"^[a-f0-9]{64}$")
PRIVATE_CSP = (
    "default-src 'self'; base-uri 'none'; object-src 'none'; "
    "frame-ancestors 'none'; form-action 'self'; connect-src 'self'; "
    "script-src 'self'; style-src 'self'; img-src 'self' data:"
)


class GatewayConfigError(ValueError):
    """A safe configuration error code that contains no paths or secrets."""


def _token_is_valid_config(token: str) -> bool:
    return (
        isinstance(token, str)
        and token.isascii()
        and len(token) >= TOKEN_MIN_LENGTH
        and token.strip() == token
        and not any(character.isspace() for character in token)
    )


def _make_session_cookie(access_token: str, issued_at: int | None = None) -> str:
    timestamp = int(time.time()) if issued_at is None else int(issued_at)
    payload = f"v1:{timestamp}".encode("ascii")
    signature = hmac.new(
        access_token.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()
    return f"v1.{timestamp}.{signature}"


def _valid_session(cookie_value: str, access_token: str, now: int | None = None) -> bool:
    if not isinstance(cookie_value, str):
        return False
    parts = cookie_value.split(".")
    if len(parts) != 3 or parts[0] != "v1" or not parts[1].isdigit():
        return False
    try:
        issued_at = int(parts[1])
    except ValueError:
        return False
    current = int(time.time()) if now is None else int(now)
    if issued_at <= 0 or issued_at > current + 30:
        return False
    if current - issued_at > SESSION_TTL_SECONDS:
        return False
    expected = _make_session_cookie(access_token, issued_at)
    return hmac.compare_digest(cookie_value, expected)


def _is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def _safe_static_file(root: Path, relative_path: str) -> Path | None:
    root = root.resolve()
    candidate = (root / relative_path).resolve()
    if candidate != root and not candidate.is_relative_to(root):
        return None
    if candidate.is_dir():
        candidate = (candidate / "index.html").resolve()
        if candidate != root and not candidate.is_relative_to(root):
            return None
    return candidate if candidate.is_file() else None


class PrivateGatewayServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 16
    server_version = "CLAIPrivateGateway"
    sys_version = ""

    def __init__(
        self,
        address: tuple[str, int],
        handler_class: type[BaseHTTPRequestHandler],
        *,
        store: Path,
        static_root: Path,
        private_ui_root: Path,
        access_token: str,
    ) -> None:
        self.store = store
        self.static_root = static_root
        self.private_ui_root = private_ui_root
        self.access_token = access_token
        super().__init__(address, handler_class)


class PrivateGatewayHandler(BaseHTTPRequestHandler):
    server: PrivateGatewayServer
    protocol_version = "HTTP/1.1"

    def log_message(self, _format: str, *_args: object) -> None:
        # Do not log request paths, cookies, tokens, or document content.
        return

    def _send_bytes(
        self,
        status: int,
        body: bytes,
        content_type: str,
        *,
        private: bool,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store" if private else "no-cache")
        if private:
            self.send_header("Content-Security-Policy", PRIVATE_CSP)
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD" and body:
            self.wfile.write(body)

    def _json(
        self,
        status: int,
        payload: dict,
        *,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        body = (json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        self._send_bytes(
            status,
            body,
            "application/json; charset=utf-8",
            private=True,
            extra_headers=extra_headers,
        )

    def _host_allowed(self) -> bool:
        host = (self.headers.get("Host") or "").lower()
        port = self.server.server_port
        return host in {f"127.0.0.1:{port}", f"localhost:{port}"}

    def _reject_host_if_needed(self) -> bool:
        if self._host_allowed():
            return False
        self.close_connection = True
        self._json(403, {"error": "HOST_NOT_ALLOWED"})
        return True

    def _same_origin(self) -> bool:
        host = (self.headers.get("Host") or "").lower()
        return self.headers.get("Origin") == f"http://{host}"

    def _request_path(self) -> str | None:
        try:
            path = unquote(urlsplit(self.path).path, errors="strict")
        except (UnicodeDecodeError, ValueError):
            return None
        if "\x00" in path or "\\" in path:
            return None
        return path

    def _session_value(self) -> str | None:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except CookieError:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        return morsel.value if morsel is not None else None

    def _authenticated(self) -> bool:
        value = self._session_value()
        return value is not None and _valid_session(value, self.server.access_token)

    def _read_json_body(self) -> dict | None:
        raw_length = self.headers.get("Content-Length")
        if raw_length is None or not raw_length.isdigit():
            self.close_connection = True
            return None
        length = int(raw_length)
        if length < 1 or length > MAX_LOGIN_BODY_BYTES:
            self.close_connection = True
            return None
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            return None
        return payload if isinstance(payload, dict) else None

    def _serve_static(self, path: str, *, head_only: bool = False) -> None:
        if path == "/private":
            self._send_bytes(
                302,
                b"",
                "text/plain; charset=utf-8",
                private=True,
                extra_headers={"Location": "/private/"},
            )
            return
        if path == "/private/" or path.startswith("/private/"):
            relative = path[len("/private/"):] or "index.html"
            try:
                file_path = _safe_static_file(self.server.private_ui_root, relative)
                body = file_path.read_bytes() if file_path is not None else None
            except (OSError, RuntimeError):
                file_path, body = None, None
            if file_path is None or body is None:
                self._json(404, {"error": "NOT_FOUND"})
                return
            content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
            if content_type.startswith("text/") or content_type in {
                "application/javascript", "application/json"
            }:
                content_type += "; charset=utf-8"
            self._send_bytes(200, body, content_type, private=True)
            return

        relative = path.lstrip("/") or "index.html"
        try:
            file_path = _safe_static_file(self.server.static_root, relative)
            body = file_path.read_bytes() if file_path is not None else None
        except (OSError, RuntimeError):
            file_path, body = None, None
        if file_path is None or body is None:
            self._json(404, {"error": "NOT_FOUND"})
            return
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in {
            "application/javascript", "application/json"
        }:
            content_type += "; charset=utf-8"
        self._send_bytes(200, body, content_type, private=False)

    def do_GET(self) -> None:
        if self._reject_host_if_needed():
            return
        path = self._request_path()
        if path is None:
            self._json(400, {"error": "REQUEST_PATH_INVALID"})
            return

        if path == "/api/private/session":
            self._json(200, {"authenticated": self._authenticated()})
            return

        if path == "/api/private/documents":
            if not self._authenticated():
                self._json(401, {"error": "AUTH_REQUIRED"})
                return
            try:
                entries = list_documents(self.server.store)
            except Exception:
                self._json(503, {"error": "PRIVATE_STORE_UNAVAILABLE"})
                return
            documents = [
                {
                    "document_id": entry["document_id"],
                    "current_version": entry["current_version"],
                    "schema_version": entry["schema_version"],
                    "slide_count": entry["slide_count"],
                }
                for entry in entries
            ]
            self._json(200, {"documents": documents})
            return

        prefix = "/api/private/documents/"
        if path.startswith(prefix):
            if not self._authenticated():
                self._json(401, {"error": "AUTH_REQUIRED"})
                return
            document_id = path[len(prefix):]
            if not DOCUMENT_ID_RE.fullmatch(document_id):
                self._json(404, {"error": "DOCUMENT_NOT_FOUND"})
                return
            try:
                content = read_document(document_id, self.server.store)
            except Exception as exc:
                if str(exc) == "DOCUMENT_NOT_FOUND":
                    self._json(404, {"error": "DOCUMENT_NOT_FOUND"})
                else:
                    self._json(503, {"error": "PRIVATE_STORE_UNAVAILABLE"})
                return
            self._json(200, {"document_id": document_id, "content": content})
            return

        if path.startswith("/api/"):
            self._json(404, {"error": "NOT_FOUND"})
            return
        self._serve_static(path)

    def do_HEAD(self) -> None:
        if self._reject_host_if_needed():
            return
        path = self._request_path()
        if path is None:
            self._json(400, {"error": "REQUEST_PATH_INVALID"})
            return
        if path.startswith("/api/"):
            self._json(405, {"error": "METHOD_NOT_ALLOWED"})
            return
        self._serve_static(path, head_only=True)

    def do_POST(self) -> None:
        if self._reject_host_if_needed():
            return
        path = self._request_path()
        if path != "/api/private/session":
            self._json(404, {"error": "NOT_FOUND"})
            return
        if not self._same_origin():
            self._json(403, {"error": "ORIGIN_NOT_ALLOWED"})
            return
        payload = self._read_json_body()
        if payload is None or not isinstance(payload.get("token"), str):
            self._json(400, {"error": "REQUEST_INVALID"})
            return
        candidate_token = payload["token"]
        if not hmac.compare_digest(
            candidate_token.encode("utf-8"), self.server.access_token.encode("utf-8")
        ):
            self._json(401, {"error": "AUTH_FAILED"})
            return
        cookie_value = _make_session_cookie(self.server.access_token)
        self._json(
            200,
            {"authenticated": True},
            extra_headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}={cookie_value}; Path=/; "
                    f"Max-Age={SESSION_TTL_SECONDS}; HttpOnly; SameSite=Strict"
                )
            },
        )

    def do_DELETE(self) -> None:
        if self._reject_host_if_needed():
            return
        path = self._request_path()
        if path != "/api/private/session":
            self._json(404, {"error": "NOT_FOUND"})
            return
        if not self._same_origin():
            self._json(403, {"error": "ORIGIN_NOT_ALLOWED"})
            return
        self._json(
            200,
            {"authenticated": False},
            extra_headers={
                "Set-Cookie": (
                    f"{SESSION_COOKIE}=; Path=/; Max-Age=0; "
                    "HttpOnly; SameSite=Strict"
                )
            },
        )

    def _method_not_allowed(self) -> None:
        if self._reject_host_if_needed():
            return
        self._json(405, {"error": "METHOD_NOT_ALLOWED"})

    def do_PUT(self) -> None:
        self._method_not_allowed()

    def do_PATCH(self) -> None:
        self._method_not_allowed()

    def do_OPTIONS(self) -> None:
        self._method_not_allowed()


def create_server(
    store: Path | str,
    static_root: Path | str,
    access_token: str,
    *,
    port: int = 8765,
    private_ui_root: Path | str = PRIVATE_UI_ROOT,
) -> PrivateGatewayServer:
    """Create a loopback-only server after validating all required inputs."""
    if not _token_is_valid_config(access_token):
        raise GatewayConfigError("ACCESS_TOKEN_INVALID")
    if not isinstance(port, int) or not 0 <= port <= 65535:
        raise GatewayConfigError("PORT_INVALID")

    resolved_store = Path(store).expanduser().resolve()
    resolved_static = Path(static_root).expanduser().resolve()
    resolved_private_ui = Path(private_ui_root).expanduser().resolve()
    if not resolved_store.is_dir():
        raise GatewayConfigError("STORE_NOT_FOUND")
    if not (resolved_static / "index.html").is_file():
        raise GatewayConfigError("STATIC_BUILD_MISSING")
    if not (resolved_private_ui / "index.html").is_file():
        raise GatewayConfigError("PRIVATE_UI_MISSING")

    web_root = (REPO_ROOT / "web").resolve()
    if (
        _is_within(resolved_store, web_root)
        or _is_within(web_root, resolved_store)
        or _is_within(resolved_store, resolved_private_ui)
        or _is_within(resolved_private_ui, resolved_store)
        or _is_within(resolved_store, resolved_static)
        or _is_within(resolved_static, resolved_store)
    ):
        raise GatewayConfigError("STORE_MUST_BE_OUTSIDE_WEB")

    return PrivateGatewayServer(
        ("127.0.0.1", port),
        PrivateGatewayHandler,
        store=resolved_store,
        static_root=resolved_static,
        private_ui_root=resolved_private_ui,
        access_token=access_token,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run the loopback-only V4.6 private content gateway."
    )
    parser.add_argument("--store", required=True, help="Explicit private content store directory")
    parser.add_argument(
        "--static-root",
        default=str(DEFAULT_STATIC_ROOT),
        help="Existing Next.js static export directory (default: web/out)",
    )
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args(argv)

    access_token = os.environ.get("CLAI_PRIVATE_ACCESS_TOKEN", "")
    try:
        server = create_server(
            args.store,
            args.static_root,
            access_token,
            port=args.port,
        )
    except GatewayConfigError as exc:
        print(f"V46_START_ERROR {exc}", file=sys.stderr)
        return 2
    except OSError:
        print("V46_START_ERROR BIND_FAILED", file=sys.stderr)
        return 2

    print(f"V46_PRIVATE_SERVER_READY address=127.0.0.1 port={server.server_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
