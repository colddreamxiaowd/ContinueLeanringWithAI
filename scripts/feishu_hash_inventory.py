"""Manual Feishu PPTX download + SHA-256 check. No course content retained.

User access token and folder token must be injected as environment variables.
The only durable state is hashed file identifiers and SHA-256 fingerprints.
"""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile

API = "https://open.feishu.cn/open-apis/drive/v1"
MAX_BYTES = 40 * 1024 * 1024
MANIFEST = Path(os.environ.get("FEISHU_HASH_MANIFEST", ".feishu-state/fingerprints.json"))


class InventoryError(Exception):
    pass


def file_identity(file_token):
    """Stable, token-safe identity used by the V4.1 fingerprint strategy."""
    return hashlib.sha256(file_token.encode("utf-8")).hexdigest()


def _request(url, token):
    return urllib.request.Request(url, headers={"Authorization": "Bearer " + token})


def _get_json(url, token):
    try:
        with urllib.request.urlopen(_request(url, token), timeout=30) as res:
            return json.load(res)
    except urllib.error.HTTPError as ex:
        raise InventoryError("LIST HTTP_" + str(ex.code)) from None
    except (urllib.error.URLError, OSError, TimeoutError, ValueError):
        raise InventoryError("LIST NETWORK_OR_RESPONSE_ERROR") from None


def list_pptx(token, folder):
    page_token = ""
    for _ in range(100):
        params = {"folder_token": folder, "page_size": "100"}
        if page_token:
            params["page_token"] = page_token
        data = _get_json(API + "/files?" + urllib.parse.urlencode(params), token)
        if not isinstance(data, dict) or data.get("code") != 0:
            raise InventoryError("LIST PROVIDER_ERROR")
        part = data.get("data") or {}
        for file in part.get("files") or []:
            if (file.get("name") or "").lower().endswith(".pptx"):
                if not file.get("token"):
                    raise InventoryError("LIST MISSING_FILE_TOKEN")
                yield file
        if not part.get("has_more"):
            return
        page_token = part.get("next_page_token") or part.get("page_token") or ""
        if not page_token:
            raise InventoryError("LIST PAGINATION_TOKEN_MISSING")
    raise InventoryError("LIST PAGINATION_LIMIT")


def download_to_temp(token, file_token):
    """Stream to a private temp file, validate it, and return (path, sha256, size).

    The caller owns cleanup of the returned path. On any failure the temporary
    file is removed before the InventoryError is raised.
    """
    url = API + "/files/" + urllib.parse.quote(file_token, safe="") + "/download"
    temp_name = None
    success = False
    try:
        with urllib.request.urlopen(_request(url, token), timeout=60) as res:
            if res.status != 200:
                raise InventoryError("DOWNLOAD UNEXPECTED_STATUS")
            digest = hashlib.sha256()
            count = 0
            with tempfile.NamedTemporaryFile(prefix="feishu-pptx-", suffix=".pptx", delete=False) as fp:
                temp_name = fp.name
                while True:
                    block = res.read(1024 * 1024)
                    if not block:
                        break
                    count += len(block)
                    if count > MAX_BYTES:
                        raise InventoryError("DOWNLOAD FILE_TOO_LARGE")
                    digest.update(block)
                    fp.write(block)
        if not zipfile.is_zipfile(temp_name):
            raise InventoryError("DOWNLOAD NOT_A_VALID_PPTX_ARCHIVE")
        with zipfile.ZipFile(temp_name) as archive:
            if "[Content_Types].xml" not in archive.namelist() or "ppt/presentation.xml" not in archive.namelist():
                raise InventoryError("DOWNLOAD INVALID_PPTX_STRUCTURE")
        success = True
        return Path(temp_name), digest.hexdigest(), count
    except urllib.error.HTTPError as ex:
        raise InventoryError("DOWNLOAD HTTP_" + str(ex.code)) from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise InventoryError("DOWNLOAD NETWORK_OR_IO_ERROR") from None
    except zipfile.BadZipFile:
        raise InventoryError("DOWNLOAD BAD_ARCHIVE") from None
    finally:
        if not success and temp_name:
            Path(temp_name).unlink(missing_ok=True)


def download_digest(token, file_token):
    """Preserve the V4.1 contract: return (sha256, size) and delete the temp file."""
    temp_path, digest, count = download_to_temp(token, file_token)
    try:
        return digest, count
    finally:
        temp_path.unlink(missing_ok=True)


def load_manifest(path):
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("version") != 1 or not isinstance(data.get("files"), dict):
            raise ValueError("incorrect schema")
        return data["files"]
    except (ValueError, OSError, TypeError):
        raise InventoryError("STATE INVALID_MANIFEST") from None


def classify(old, new):
    return "UNCHANGED" if old == new else ("CHANGED" if old else "NEW")


def main():
    token = os.environ.get("FEISHU_USER_ACCESS_TOKEN", "").strip()
    folder = os.environ.get("FEISHU_FOLDER_TOKEN", "").strip()
    if not token or not folder:
        print("CONFIG MISSING_SECRET")
        return 2
    try:
        prior = load_manifest(MANIFEST)
        current = {}
        counts = {"NEW": 0, "CHANGED": 0, "UNCHANGED": 0}
        for entry in list_pptx(token, folder):
            # Names and raw file tokens never enter the persisted state or the log.
            identity = file_identity(entry["token"])
            if identity in current:
                continue
            digest, size = download_digest(token, entry["token"])
            status = classify(prior.get(identity), digest)
            counts[status] += 1
            current[identity] = digest
            print(f"PPTX {status}: sha256={digest[:12]} bytes={size}")
        # State is saved only after a fully successful scan; a failure never
        # replaces a known-good manifest with partial results.
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        stage = MANIFEST.with_suffix(".tmp")
        stage.write_text(json.dumps({"version": 1, "files": current}, sort_keys=True), encoding="utf-8")
        stage.replace(MANIFEST)
        print("RESULT " + " ".join(f"{k}={v}" for k, v in counts.items()))
        print("Read-only remote access. No article generation or publication.")
        return 0
    except InventoryError as error:
        print("CHECK_FAILED " + str(error))
        return 1


if __name__ == "__main__":
    sys.exit(main())
