from __future__ import annotations

import hashlib
import http.client
import io
import json
import tempfile
import threading
import time
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from scripts.synthetic_pptx import build_synthetic_bytes
from scripts.v43_pipeline import DownloadedFile, SourceFile, run_incremental
from scripts.v46_private_server import (
    PRIVATE_UI_ROOT,
    SESSION_TTL_SECONDS,
    GatewayConfigError,
    _make_session_cookie,
    create_server,
)


def _seed_store(store: Path, marker: str) -> str:
    payload = build_synthetic_bytes(marker=marker)
    source = SourceFile("V46_SYNTHETIC_TEST_SOURCE")

    def downloader(_file_token: str) -> DownloadedFile:
        handle = tempfile.NamedTemporaryFile(prefix="v46-test-", suffix=".pptx", delete=False)
        try:
            handle.write(payload)
            handle.close()
            return DownloadedFile(
                path=Path(handle.name),
                sha256=hashlib.sha256(payload).hexdigest(),
                size=len(payload),
            )
        except Exception:
            handle.close()
            Path(handle.name).unlink(missing_ok=True)
            raise

    results = run_incremental([source], downloader, store, verbose=False)
    if len(results) != 1 or results[0].status != "NEW":
        raise AssertionError("SYNTHETIC_STORE_SETUP_FAILED")
    return source.document_id


class V46PrivateGatewayTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="clai-v46-test-")
        self.root = Path(self.temporary.name)
        self.store = self.root / "private-store"
        self.store.mkdir()
        self.static_root = self.root / "out"
        self.static_root.mkdir()
        (self.static_root / "index.html").write_text(
            "<!doctype html><title>PUBLIC_STATIC_MARKER</title>",
            encoding="utf-8",
        )
        self.marker = "V46_SYNTHETIC_PRIVATE_BODY_MARKER"
        self.document_id = _seed_store(self.store, self.marker)
        self.token = "v46-test-access-token-" + ("a" * 40)
        self.server = create_server(
            self.store,
            self.static_root,
            self.token,
            port=0,
            private_ui_root=PRIVATE_UI_ROOT,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_port
        self.origin = f"http://127.0.0.1:{self.port}"
        self.cookie: str | None = None

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def request(
        self,
        method: str,
        path: str,
        *,
        payload: dict | None = None,
        cookie: str | None = None,
        origin: str | None = None,
        host: str | None = None,
    ) -> tuple[int, dict[str, str], bytes]:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
        headers = {"Host": host or f"127.0.0.1:{self.port}"}
        if cookie:
            headers["Cookie"] = cookie
        if origin is not None:
            headers["Origin"] = origin
        body = None
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read()
        result_headers = {name.lower(): value for name, value in response.getheaders()}
        status = response.status
        connection.close()
        return status, result_headers, data

    def login(self) -> str:
        status, headers, body = self.request(
            "POST",
            "/api/private/session",
            payload={"token": self.token},
            origin=self.origin,
        )
        self.assertEqual(status, 200, body.decode("utf-8"))
        self.assertTrue(json.loads(body)["authenticated"])
        cookie_header = headers["set-cookie"]
        self.assertIn("httponly", cookie_header.lower())
        self.assertIn("samesite=strict", cookie_header.lower())
        self.assertIn("path=/", cookie_header.lower())
        self.assertIn(f"max-age={SESSION_TTL_SECONDS}", cookie_header.lower())
        self.cookie = cookie_header.split(";", 1)[0]
        return self.cookie

    def test_server_binds_loopback_only(self) -> None:
        self.assertEqual(self.server.server_address[0], "127.0.0.1")

    def test_public_static_and_private_ui_are_served(self) -> None:
        status, _headers, body = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn(b"PUBLIC_STATIC_MARKER", body)

        status, headers, body = self.request("GET", "/private/")
        self.assertEqual(status, 200)
        self.assertIn("content-security-policy", headers)
        self.assertIn(b"私有资料空间", body)

        status, _headers, body = self.request("GET", "/private/app.js")
        self.assertEqual(status, 200)
        self.assertIn(b"textContent", body)

    def test_session_status_reports_unauthenticated(self) -> None:
        status, headers, body = self.request("GET", "/api/private/session")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body), {"authenticated": False})
        self.assertEqual(headers.get("cache-control"), "no-store")

    def test_unauthenticated_document_reads_are_rejected(self) -> None:
        status, _headers, body = self.request("GET", "/api/private/documents")
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(body)["error"], "AUTH_REQUIRED")

        status, _headers, body = self.request(
            "GET", "/api/private/documents/" + self.document_id
        )
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(body)["error"], "AUTH_REQUIRED")

    def test_wrong_token_is_rejected(self) -> None:
        status, headers, body = self.request(
            "POST",
            "/api/private/session",
            payload={"token": "wrong-" + ("x" * 40)},
            origin=self.origin,
        )
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(body)["error"], "AUTH_FAILED")
        self.assertNotIn("set-cookie", headers)

    def test_valid_token_cookie_and_private_read(self) -> None:
        cookie = self.login()
        status, headers, body = self.request(
            "GET", "/api/private/documents", cookie=cookie
        )
        self.assertEqual(status, 200)
        self.assertEqual(headers.get("cache-control"), "no-store")
        listing = json.loads(body)["documents"]
        self.assertEqual(len(listing), 1)
        self.assertEqual(listing[0]["document_id"], self.document_id)
        self.assertNotIn("content_path", listing[0])
        self.assertNotIn("preview_path", listing[0])

        status, _headers, body = self.request(
            "GET", "/api/private/documents/" + self.document_id, cookie=cookie
        )
        self.assertEqual(status, 200)
        content = json.loads(body)["content"]
        self.assertEqual(content["source_sha256"], listing[0]["current_version"])
        self.assertIn(self.marker, json.dumps(content, ensure_ascii=False))

    def test_expired_and_forged_cookies_are_rejected(self) -> None:
        expired = _make_session_cookie(
            self.token, int(time.time()) - SESSION_TTL_SECONDS - 5
        )
        status, _headers, body = self.request(
            "GET", "/api/private/documents", cookie="clai_private_session=" + expired
        )
        self.assertEqual(status, 401)

        valid = _make_session_cookie(self.token)
        pieces = valid.split(".")
        forged = pieces[0] + "." + pieces[1] + "." + ("0" * 64)
        status, _headers, body = self.request(
            "GET", "/api/private/documents", cookie="clai_private_session=" + forged
        )
        self.assertEqual(status, 401)

    def test_nonlocal_host_is_rejected(self) -> None:
        status, _headers, body = self.request(
            "GET",
            "/api/private/session",
            host=f"attacker.example:{self.port}",
        )
        self.assertEqual(status, 403)
        self.assertEqual(json.loads(body)["error"], "HOST_NOT_ALLOWED")

    def test_cross_origin_login_is_rejected(self) -> None:
        status, headers, body = self.request(
            "POST",
            "/api/private/session",
            payload={"token": self.token},
            origin=f"http://attacker.example:{self.port}",
        )
        self.assertEqual(status, 403)
        self.assertEqual(json.loads(body)["error"], "ORIGIN_NOT_ALLOWED")
        self.assertNotIn("set-cookie", headers)

    def test_invalid_document_ids_and_path_traversal_are_rejected(self) -> None:
        cookie = self.login()
        for suffix in ("not-a-document-id", "%2e%2e%2fetc%2fpasswd", "../etc/passwd"):
            status, _headers, body = self.request(
                "GET", "/api/private/documents/" + suffix, cookie=cookie
            )
            self.assertEqual(status, 404)
            self.assertEqual(json.loads(body)["error"], "DOCUMENT_NOT_FOUND")

    def test_store_errors_are_sanitized_and_not_logged(self) -> None:
        cookie = self.login()
        (self.store / "state.json").write_text("{broken json", encoding="utf-8")
        logs = io.StringIO()
        with redirect_stdout(logs), redirect_stderr(logs):
            status, _headers, body = self.request(
                "GET", "/api/private/documents", cookie=cookie
            )
        self.assertEqual(status, 503)
        rendered = body.decode("utf-8")
        self.assertEqual(json.loads(body)["error"], "PRIVATE_STORE_UNAVAILABLE")
        self.assertNotIn(str(self.store), rendered)
        self.assertNotIn(self.token, rendered)
        self.assertNotIn(self.marker, rendered)
        self.assertNotIn(self.token, logs.getvalue())
        self.assertNotIn(self.marker, logs.getvalue())

    def test_private_content_never_enters_static_output(self) -> None:
        cookie = self.login()
        status, _headers, body = self.request(
            "GET", "/api/private/documents/" + self.document_id, cookie=cookie
        )
        self.assertEqual(status, 200)
        self.assertIn(self.marker.encode("utf-8"), body)
        for path in self.static_root.rglob("*"):
            if path.is_file():
                self.assertNotIn(self.marker, path.read_text(encoding="utf-8"))
        self.assertFalse(self.store.is_relative_to(self.static_root))
        self.assertFalse(self.static_root.is_relative_to(self.store))

    def test_no_document_write_or_delete_endpoint_exists(self) -> None:
        cookie = self.login()
        before = (self.store / "index.json").read_bytes()
        status, _headers, _body = self.request(
            "POST",
            "/api/private/documents",
            payload={"content": "must not write"},
            origin=self.origin,
            cookie=cookie,
        )
        self.assertEqual(status, 404)
        status, _headers, _body = self.request(
            "DELETE",
            "/api/private/documents/" + self.document_id,
            origin=self.origin,
            cookie=cookie,
        )
        self.assertEqual(status, 404)
        self.assertEqual((self.store / "index.json").read_bytes(), before)

    def test_store_must_be_an_existing_directory(self) -> None:
        with self.assertRaisesRegex(GatewayConfigError, "STORE_NOT_FOUND"):
            create_server(
                self.root / "missing-store",
                self.static_root,
                self.token,
                port=0,
                private_ui_root=PRIVATE_UI_ROOT,
            )

    def test_short_token_and_missing_static_build_are_rejected(self) -> None:
        with self.assertRaisesRegex(GatewayConfigError, "ACCESS_TOKEN_INVALID"):
            create_server(
                self.store,
                self.static_root,
                "short",
                port=0,
                private_ui_root=PRIVATE_UI_ROOT,
            )
        with self.assertRaisesRegex(GatewayConfigError, "STATIC_BUILD_MISSING"):
            create_server(
                self.store,
                self.root / "missing-out",
                self.token,
                port=0,
                private_ui_root=PRIVATE_UI_ROOT,
            )


if __name__ == "__main__":
    unittest.main()
