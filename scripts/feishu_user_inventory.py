"""Read-only Feishu Drive listing with user OAuth token (manual test only)."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def main():
    token = os.environ.get("FEISHU_USER_ACCESS_TOKEN", "").strip()
    folder = os.environ.get("FEISHU_FOLDER_TOKEN", "").strip()
    if not token or not folder:
        print("CONFIG: MISSING_USER_TOKEN_OR_FOLDER")
        return 2
    page_token = ""
    count = 0
    for _ in range(100):
        query = {"folder_token": folder, "page_size": 100}
        if page_token:
            query["page_token"] = page_token
        request = urllib.request.Request(
            "https://open.feishu.cn/open-apis/drive/v1/files?" + urllib.parse.urlencode(query),
            headers={"Authorization": "Bearer " + token},
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                result = json.load(response)
        except urllib.error.HTTPError as exc:
            print("LIST_FOLDER: HTTP_" + str(exc.code))
            return 1
        except (urllib.error.URLError, OSError, TimeoutError, ValueError):
            print("LIST_FOLDER: NETWORK_OR_RESPONSE_ERROR")
            return 1
        if not isinstance(result, dict) or result.get("code") != 0:
            code = result.get("code") if isinstance(result, dict) else None
            print("LIST_FOLDER: PROVIDER_ERROR" + (f" (code={code})" if isinstance(code, int) else ""))
            return 1
        data = result.get("data") or {}
        count += sum((item.get("name") or "").lower().endswith(".pptx") for item in data.get("files") or [])
        if not data.get("has_more"):
            print("LIST_FOLDER: OK (PPTX count={})".format(count))
            print("No downloads, writes, generation or publication.")
            return 0
        page_token = data.get("next_page_token") or data.get("page_token") or ""
        if not page_token:
            print("LIST_FOLDER: PAGINATION_TOKEN_MISSING")
            return 1
    print("LIST_FOLDER: PAGINATION_LIMIT")
    return 1


if __name__ == "__main__":
    sys.exit(main())
