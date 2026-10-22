"""Read the V4.3 private content index as a website data source.

The reader is local-only. It returns safe, validated content JSON and can render
the V4.2 HTML preview without exposing the private store path to the website.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.pptx_content import SCHEMA_VERSION, render_html  # noqa: E402

DEFAULT_STORE = Path(".local/v43")
INDEX_VERSION = 1
SHA_FIELDS = ("source_sha256", "current_version")


class ContentImportError(Exception):
    """Sanitized import-layer error code."""


def _index_path(store: Path) -> Path:
    return Path(store) / "index.json"


def _safe_join(store: Path, relative: str) -> Path:
    base = Path(store).resolve()
    if not isinstance(relative, str) or not relative:
        raise ContentImportError("PATH_UNSAFE")
    candidate = (base / relative).resolve()
    if candidate != base and not candidate.is_relative_to(base):
        raise ContentImportError("PATH_UNSAFE")
    return candidate


def _load_index(store: Path | str = DEFAULT_STORE) -> dict:
    path = _index_path(Path(store))
    if not path.exists():
        return {"version": INDEX_VERSION, "documents": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise ContentImportError("INDEX_INVALID") from None
    if (
        not isinstance(data, dict)
        or data.get("version") != INDEX_VERSION
        or not isinstance(data.get("documents"), list)
    ):
        raise ContentImportError("INDEX_INVALID")
    return data


def list_documents(store: Path | str = DEFAULT_STORE) -> list[dict]:
    """List available documents; a missing index is an empty library."""
    data = _load_index(store)
    documents = []
    for entry in data["documents"]:
        if not isinstance(entry, dict) or not entry.get("document_id"):
            continue
        if not all(isinstance(entry.get(field), str) for field in SHA_FIELDS):
            continue
        if not isinstance(entry.get("content_path"), str):
            continue
        documents.append(dict(entry))
    return documents


def read_document(document_id: str, store: Path | str = DEFAULT_STORE) -> dict:
    """Return validated V4.2 content for a stable document_id."""
    for entry in list_documents(store):
        if entry.get("document_id") != document_id:
            continue
        content_path = _safe_join(Path(store), entry["content_path"])
        if not content_path.is_file():
            raise ContentImportError("DOCUMENT_UNAVAILABLE")
        try:
            content = json.loads(content_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise ContentImportError("DOCUMENT_INVALID") from None
        if (
            not isinstance(content, dict)
            or content.get("schema_version") != SCHEMA_VERSION
            or content.get("source_sha256") != entry.get("source_sha256")
        ):
            raise ContentImportError("CONTENT_MISMATCH")
        return content
    raise ContentImportError("DOCUMENT_NOT_FOUND")


def render_document(document_id: str, store: Path | str = DEFAULT_STORE) -> str:
    """Render the imported content through the V4.2 preview renderer."""
    return render_html(read_document(document_id, store))
