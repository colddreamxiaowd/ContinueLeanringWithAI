"""Read-only Feishu PPTX inventory with secret-safe, stage-specific diagnostics."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


class SafeFailure(Exception):
    pass


def request_json(stage, url, *, data=None, headers=None):
    req = urllib.request.Request(
        url,
        data=data,
        headers=headers or {},
        method="POST" if data is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            try:
                return json.load(response)
            except (ValueError, UnicodeError):
                raise SafeFailure(f"{stage}: INVALID_JSON_RESPONSE")
    except urllib.error.HTTPError as exc:
        # Do NOT log request URLs, response bodies, tokens or headers.
        raise SafeFailure(f"{stage}: HTTP_{exc.code}")
    except urllib.error.URLError:
        raise SafeFailure(f"{stage}: NETWORK_OR_TLS_ERROR")
    except TimeoutError:
        raise SafeFailure(f"{stage}: TIMEOUT")
    except OSError:
        raise SafeFailure(f"{stage}: IO_ERROR")


def main():
    keys = ("FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_FOLDER_TOKEN")
    if any(not os.environ.get(key) for key in keys):
        print("CONFIG: MISSING_SECRET")
        return 2

    try:
        body = urllib.parse.urlencode({
            "grant_type": "client_credentials",
            "client_id": os.environ["FEISHU_APP_ID"],
            "client_secret": os.environ["FEISHU_APP_SECRET"],
        }).encode("utf-8")
        auth = request_json(
            "AUTH", "https://accounts.feishu.cn/oauth/v3/token",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if not isinstance(auth, dict) or not auth.get("access_token"):
            # Do not print entire remote API payload.
            code = auth.get("code") if isinstance(auth, dict) else None
            print("AUTH: TOKEN_MISSING" + (f" (provider_code={code})" if isinstance(code, int) else ""))
            return 1
        print("AUTH: OK")
        bearer = auth["access_token"]
        folder = os.environ["FEISHU_FOLDER_TOKEN"]
        next_page = ""
        found = []
        for page in range(1, 101):
            query = {"folder_token": folder, "page_size": "100"}
            if next_page:
                query["page_token"] = next_page
            result = request_json(
                "LIST_FOLDER",
                "https://open.feishu.cn/open-apis/drive/v1/files?"
                + urllib.parse.urlencode(query),
                headers={"Authorization": "Bearer " + bearer},
            )
            if not isinstance(result, dict):
                raise SafeFailure("LIST_FOLDER: INVALID_RESPONSE")
            if result.get("code") != 0:
                code = result.get("code")
                print("LIST_FOLDER: PROVIDER_ERROR" + (f" (code={code})" if isinstance(code, int) else ""))
                return 1
            data = result.get("data") or {}
            for item in data.get("files") or []:
                name = item.get("name") or ""
                if name.lower().endswith(".pptx"):
                    found.append(name)
            if not data.get("has_more"):
                print(f"LIST_FOLDER: OK ({len(found)} PPTX files visible)")
                print("No files downloaded, no remote writes, no content generated.")
                return 0
            next_page = data.get("next_page_token") or data.get("page_token") or ""
            if not next_page:
                raise SafeFailure("LIST_FOLDER: PAGINATION_TOKEN_MISSING")
        raise SafeFailure("LIST_FOLDER: PAGINATION_LIMIT")
    except SafeFailure as exc:
        print(str(exc))
        return 1


if __name__ == "__main__":
    sys.exit(main())
