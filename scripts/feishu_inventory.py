"""Feishu read-only PPTX inventory for manually triggered GitHub Actions.

Only calls OAuth and folder listing APIs. Never downloads file contents.
Do not log credentials, bearer tokens, folder tokens, or raw provider errors.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def read_json(url, *, data=None, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def main():
    names = ("FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_FOLDER_TOKEN")
    if any(not os.environ.get(k) for k in names):
        print("CONFIG_ERROR: missing GitHub Actions Secrets (check the three FEISHU_* values).")
        return 2

    # New OAuth v3 endpoint documented by Feishu (2026).
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": os.environ["FEISHU_APP_ID"],
        "client_secret": os.environ["FEISHU_APP_SECRET"],
    }).encode()
    try:
        auth = read_json(
            "https://accounts.feishu.cn/oauth/v3/token",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if auth.get("code") != 0 or not auth.get("access_token"):
            print("AUTH_FAILED: check app credentials, approval, and enabled state.")
            return 1
        bearer = auth["access_token"]
        folder = os.environ["FEISHU_FOLDER_TOKEN"]
        next_page = ""
        found = []
        for _ in range(100):
            query = {"folder_token": folder, "page_size": "100"}
            if next_page:
                query["page_token"] = next_page
            url = "https://open.feishu.cn/open-apis/drive/v1/files?" + urllib.parse.urlencode(query)
            result = read_json(url, headers={"Authorization": "Bearer " + bearer})
            if result.get("code") != 0:
                print("ACCESS_FAILED: check Drive API scopes and the folder's app permissions.")
                return 1
            data = result.get("data") or {}
            for item in data.get("files") or []:
                name = item.get("name") or ""
                if name.lower().endswith(".pptx"):
                    found.append(name)
            if not data.get("has_more"):
                break
            next_page = data.get("next_page_token") or data.get("page_token") or ""
            if not next_page:
                print("PAGINATION_FAILED: provider indicated more items without a page token.")
                return 1
        else:
            print("PAGINATION_LIMIT: checked 100 pages; stopped safely.")
            return 1
        print("FEISHU_READ_ONLY_OK: {} PPTX files visible.".format(len(found)))
        for name in sorted(found):
            # Avoid printing file names that might contain newlines/control characters.
            print("PPTX: " + json.dumps(name, ensure_ascii=False))
        print("No downloads, no writes, no generation, no publication.")
        return 0
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError, OSError):
        print("NETWORK_OR_API_ERROR: review GitHub Actions connectivity, Feishu app status and scope.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
