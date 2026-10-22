"""Read the V4.3 private content index as a website data source.

state.json is authoritative. The index is served only when it exactly matches the
persisted state; a stale index raises INDEX_STALE instead of showing a wrong
current version. The pipeline rebuilds the index from state on the next run.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.pptx_content import SCHEMA_VERSION, render_html  # noqa: E402

DEFAULT_STORE = Path(".local/v43")
INDEX_VERSION = 1
SHA_RE = re.compile(r"^[a-f0-9]{64}$")
ENTRY_FIELDS = (
    "source_sha256",
    "current_version",
    "schema_version",
    "slide_count",
    "content_path",
    "preview_path",
)
STRING_ENTRY_FIELDS = (
    "source_sha256",
    "current_version",
    "schema_version",
    "content_path",
    "preview_path",
)


class ContentImportError(Exception):
    """Sanitized import-layer error code."""


def _state_path(store: Path) -> Path:
    return Path(store) / "state.json"


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


def _validate_entry(entry: object, error_code: str) -> dict:
    if not isinstance(entry, dict):
        raise ContentImportError(error_code)
    document_id = entry.get("document_id")
    if not isinstance(document_id, str) or not SHA_RE.match(document_id):
        raise ContentImportError(error_code)
    if not all(isinstance(entry.get(field), str) for field in STRING_ENTRY_FIELDS):
        raise ContentImportError(error_code)
    if not SHA_RE.match(entry["source_sha256"]) or not SHA_RE.match(entry["current_version"]):
        raise ContentImportError(error_code)
    if entry["schema_version"] != SCHEMA_VERSION:
        raise ContentImportError(error_code)
    if not isinstance(entry.get("slide_count"), int) or entry["slide_count"] < 0:
        raise ContentImportError(error_code)
    return entry


def _load_state(store: Path) -> dict[str, dict] | None:
    path = _state_path(store)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise ContentImportError("STATE_INVALID") from None
    if (
        not isinstance(data, dict)
        or data.get("version") != INDEX_VERSION
        or not isinstance(data.get("sources"), dict)
    ):
        raise ContentImportError("STATE_INVALID")
    sources: dict[str, dict] = {}
    for document_id, entry in data["sources"].items():
        if not isinstance(document_id, str) or not SHA_RE.match(document_id):
            raise ContentImportError("STATE_INVALID")
        validated = _validate_entry(
            {**entry, "document_id": document_id} if isinstance(entry, dict) else entry,
            "STATE_INVALID",
        )
        sources[document_id] = validated
    return sources


def _load_index(store: Path) -> dict | None:
    path = _index_path(store)
    if not path.exists():
        return None
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
    seen: set[str] = set()
    documents = []
    for entry in data["documents"]:
        validated = _validate_entry(entry, "INDEX_INVALID")
        if validated["document_id"] in seen:
            raise ContentImportError("INDEX_INVALID")
        seen.add(validated["document_id"])
        documents.append(validated)
    return {"version": INDEX_VERSION, "documents": documents}


def _ensure_consistent(state: dict[str, dict], index: dict) -> None:
    state_ids = set(state)
    index_ids = {entry["document_id"] for entry in index["documents"]}
    if state_ids != index_ids:
        raise ContentImportError("INDEX_STALE")
    for entry in index["documents"]:
        persisted = state[entry["document_id"]]
        for field in ENTRY_FIELDS:
            if entry.get(field) != persisted.get(field):
                raise ContentImportError("INDEX_STALE")


def list_documents(store: Path | str = DEFAULT_STORE) -> list[dict]:
    """List documents only when the index exactly matches persisted state."""
    store = Path(store)
    state = _load_state(store)
    index = _load_index(store)

    if state is None and index is None:
        return []
    if state is None:
        if index["documents"]:
            raise ContentImportError("INDEX_STALE")
        return []
    if index is None:
        if state:
            raise ContentImportError("INDEX_STALE")
        return []

    _ensure_consistent(state, index)
    return [dict(entry) for entry in index["documents"]]


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
