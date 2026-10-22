"""Offline V4.3 end-to-end demo using synthetic PPTX bytes.

Run: python scripts/v43_demo.py

The demo writes only synthetic content under .local/v43-demo (git-ignored) and
never contacts Feishu or GitHub.
"""

from __future__ import annotations

import hashlib
import shutil
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.feishu_hash_inventory import InventoryError  # noqa: E402
from scripts.synthetic_pptx import build_synthetic_bytes  # noqa: E402
from scripts.v43_import import list_documents, read_document, render_document  # noqa: E402
from scripts.v43_pipeline import DownloadedFile, SourceFile, run_incremental  # noqa: E402

STORE = REPO_ROOT / ".local" / "v43-demo"


class FakeDownloader:
    def __init__(self, payloads: dict[str, bytes], failures=()):
        self.payloads = dict(payloads)
        self.failures = set(failures)
        self.calls: list[str] = []
        self.temp_paths: list[Path] = []

    def __call__(self, file_token: str) -> DownloadedFile:
        self.calls.append(file_token)
        if file_token in self.failures:
            raise InventoryError("SIMULATED_DOWNLOAD_FAILURE")
        data = self.payloads[file_token]
        with tempfile.NamedTemporaryFile(
            prefix="v43-demo-", suffix=".pptx", delete=False
        ) as handle:
            handle.write(data)
            path = Path(handle.name)
        self.temp_paths.append(path)
        return DownloadedFile(
            path=path, sha256=hashlib.sha256(data).hexdigest(), size=len(data)
        )


def _expect(results, status: str):
    if len(results) != 1 or results[0].status != status:
        raise AssertionError(f"expected {status}, got {[r.status for r in results]}")
    return results[0]


def main() -> int:
    shutil.rmtree(STORE, ignore_errors=True)

    payload_a1 = build_synthetic_bytes(marker="V43_DEMO_BODY_V1")
    payload_a2 = build_synthetic_bytes(marker="V43_DEMO_BODY_V2")
    downloader = FakeDownloader({"token-a": payload_a1})
    source_a = SourceFile("token-a")

    first = _expect(run_incremental([source_a], downloader, STORE), "NEW")
    if not first.parsed:
        raise AssertionError("first import should parse")

    second = _expect(run_incremental([source_a], downloader, STORE), "UNCHANGED")
    if second.parsed:
        raise AssertionError("unchanged import should not parse")

    downloader.payloads["token-a"] = payload_a2
    third = _expect(run_incremental([source_a], downloader, STORE), "CHANGED")
    if not third.parsed:
        raise AssertionError("changed import should parse")

    documents = list_documents(STORE)
    current = next(d for d in documents if d["document_id"] == source_a.document_id)
    content_path = STORE / current["content_path"]
    preview_path = STORE / current["preview_path"]
    if not content_path.is_file() or not preview_path.is_file():
        raise AssertionError("current artifacts missing before rebuild test")
    content_path.unlink()

    fourth = _expect(run_incremental([source_a], downloader, STORE), "REBUILD")
    if not fourth.parsed:
        raise AssertionError("rebuild should parse the already-downloaded temp file")

    downloader.failures.add("token-b")
    fifth = _expect(
        run_incremental([SourceFile("token-b")], downloader, STORE), "FAILED"
    )
    if fifth.sha256 is not None:
        raise AssertionError("download failure should not have a content hash")

    downloader.payloads["token-c"] = payload_a1
    sixth = _expect(run_incremental([SourceFile("token-c")], downloader, STORE), "NEW")
    if sixth.parsed:
        raise AssertionError("duplicate content should reuse existing artifacts")

    documents = list_documents(STORE)
    if len(documents) != 2:
        raise AssertionError(f"expected 2 indexed documents, got {len(documents)}")

    a_content = read_document(source_a.document_id, STORE)
    a_html = render_document(source_a.document_id, STORE)
    if a_content["source_sha256"] != hashlib.sha256(payload_a2).hexdigest():
        raise AssertionError("document A does not point at its current version")
    if "<!doctype html>" not in a_html or "V43_DEMO_BODY_V2" not in a_html:
        raise AssertionError("rendered HTML is not the current document")

    if any(path.exists() for path in downloader.temp_paths):
        raise AssertionError("temporary PPTX files were not cleaned up")

    print(
        "DEMO_OK "
        f"statuses=NEW,UNCHANGED,CHANGED,REBUILD,FAILED,NEW "
        f"documents={len(documents)} store={STORE} "
        f"preview={preview_path}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
