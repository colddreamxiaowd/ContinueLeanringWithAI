"""Export whitelisted synthetic PPTX content for the V4.5 website demo.

This adapter intentionally does not reimplement PPTX parsing. It drives the
existing V4.3 pipeline, reads back through the V4.3 import layer, and emits a
deterministic, versioned JSON bundle for Next.js.

Safety rules:
- only the two fixtures listed below are accepted;
- the store is checked after the run, and any unknown document aborts export;
- output never contains the original filename, absolute path, tokens, or
  private course text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.v43_import import (  # noqa: E402
    ContentImportError,
    list_documents,
    read_document,
)
from scripts.v43_pipeline import (  # noqa: E402
    DownloadedFile,
    PipelineError,
    SourceFile,
    run_incremental,
)

SCHEMA_VERSION = "v45-demo-v1"
DEFAULT_STORE = REPO_ROOT / ".local" / "v45"
DEFAULT_OUTPUT = REPO_ROOT / "web" / "src" / "data" / "v45-demo"


class ExportError(Exception):
    """A sanitized export failure code."""


@dataclass(frozen=True)
class FixtureSpec:
    path: Path
    token: str
    title: str


ALLOWED_FIXTURES = (
    FixtureSpec(
        path=REPO_ROOT / "web" / "fixtures" / "v2" / "synthetic-stack-lesson.pptx",
        token="v45:synthetic:v2-stack-lesson",
        title="合成栈课件（V2 Fixture）",
    ),
    FixtureSpec(
        path=REPO_ROOT / "web" / "fixtures" / "v45" / "synthetic-integration-deck.pptx",
        token="v45:synthetic:integration-deck",
        title="合成集成样例（表格与未支持对象）",
    ),
)

NOTICE = (
    "仅包含项目内明确标记的合成 PPTX，由现有 V4.3 流水线实际处理；"
    "不代表真实课程、真实同步或正式发布内容。"
)


class _FixtureDownloader:
    """Local-only downloader: maps an allowlisted token to its fixture bytes."""

    def __init__(self, specs: tuple[FixtureSpec, ...]):
        self._specs = {spec.token: spec for spec in specs}

    def __call__(self, file_token: str) -> DownloadedFile:
        spec = self._specs.get(file_token)
        if spec is None:
            raise ExportError("UNKNOWN_FIXTURE_TOKEN")
        data = spec.path.read_bytes()
        with tempfile.NamedTemporaryFile(
            prefix="v45-export-", suffix=".pptx", delete=False
        ) as handle:
            handle.write(data)
            temp_path = Path(handle.name)
        return DownloadedFile(
            path=temp_path,
            sha256=hashlib.sha256(data).hexdigest(),
            size=len(data),
        )


def _atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    os.replace(temporary, path)


def _check_fixtures(specs: tuple[FixtureSpec, ...]) -> None:
    # The specs parameter exists only so tests can prove that a non-allowlisted
    # deck is rejected. It must match ALLOWED_FIXTURES exactly before any file
    # is read, parsed, or written.
    if tuple(specs) != ALLOWED_FIXTURES:
        raise ExportError("NON_ALLOWLISTED_FIXTURE")
    for spec in specs:
        if not spec.path.is_file():
            raise ExportError("SYNTHETIC_FIXTURE_MISSING")
        if spec.path.suffix.lower() != ".pptx":
            raise ExportError("SYNTHETIC_FIXTURE_INVALID")


def _documents_by_id(store: Path) -> dict[str, dict]:
    return {entry["document_id"]: entry for entry in list_documents(store)}


def export_all(
    store: Path | str = DEFAULT_STORE,
    output_dir: Path | str = DEFAULT_OUTPUT,
    *,
    specs: tuple[FixtureSpec, ...] = ALLOWED_FIXTURES,
) -> dict:
    """Run the V4.3 pipeline and write the deterministic V4.5 demo bundle.

    ``specs`` is keyword-only and must equal ``ALLOWED_FIXTURES``; it is kept
    solely to test the allowlist rejection path.
    """
    store = Path(store)
    output_dir = Path(output_dir)
    _check_fixtures(specs)

    sources = [SourceFile(spec.token) for spec in specs]
    expected_ids = {source.document_id for source in sources}
    results = run_incremental(sources, _FixtureDownloader(specs), store, verbose=False)

    for result in results:
        if result.status == "FAILED":
            raise ExportError(f"PIPELINE_FAILED:{result.reason or 'UNKNOWN'}")

    entries = _documents_by_id(store)
    unknown = set(entries) - expected_ids
    if unknown:
        raise ExportError("STORE_HAS_UNEXPECTED_DOCUMENTS")
    missing = expected_ids - set(entries)
    if missing:
        raise ExportError("STORE_MISSING_EXPECTED_DOCUMENTS")

    documents = []
    for spec, source in zip(specs, sources):
        entry = entries[source.document_id]
        content = read_document(source.document_id, store)
        if content.get("source_sha256") != entry["source_sha256"]:
            raise ExportError("CONTENT_MISMATCH")

        document = {
            "schema_version": SCHEMA_VERSION,
            "document_id": source.document_id,
            "title": spec.title,
            "source_kind": "synthetic_fixture",
            "source_sha256": entry["source_sha256"],
            "current_version": entry["current_version"],
            "slide_count": entry["slide_count"],
            "synthetic": True,
            "demo": True,
            "notice": NOTICE,
            "slides": content["slides"],
        }
        content_file = f"documents/{source.document_id}.json"
        _atomic_write_json(output_dir / content_file, document)
        documents.append(
            {
                "document_id": source.document_id,
                "title": spec.title,
                "source_kind": "synthetic_fixture",
                "source_sha256": entry["source_sha256"],
                "current_version": entry["current_version"],
                "schema_version": entry["schema_version"],
                "slide_count": entry["slide_count"],
                "synthetic": True,
                "demo": True,
                "content_file": content_file,
            }
        )

    documents.sort(key=lambda item: item["document_id"])
    index = {
        "schema_version": SCHEMA_VERSION,
        "generated_by": "scripts/v45_export_synthetic.py",
        "synthetic": True,
        "notice": NOTICE,
        "documents": documents,
    }
    _atomic_write_json(output_dir / "index.json", index)
    return {
        "index": index,
        "statuses": {result.document_id: result.status for result in results},
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export synthetic V4.5 demo data")
    parser.add_argument("--store", default=str(DEFAULT_STORE))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args(argv)

    try:
        result = export_all(Path(args.store), Path(args.output))
    except (ExportError, ContentImportError, PipelineError) as exc:
        print(f"V45_EXPORT_ERROR {exc}", file=sys.stderr)
        return 1
    except OSError:
        print("V45_EXPORT_ERROR IO_ERROR", file=sys.stderr)
        return 1

    slide_total = sum(item["slide_count"] for item in result["index"]["documents"])
    print(
        "V45_EXPORT_OK "
        f"documents={len(result['index']['documents'])} "
        f"slides={slide_total} output={Path(args.output)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
