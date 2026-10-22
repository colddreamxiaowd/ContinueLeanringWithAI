"""V4.3 incremental PPTX -> private content store pipeline.

One download per source per run, then:
- hash comparison / NEW / CHANGED / UNCHANGED / REBUILD / FAILED
- deterministic V4.2 JSON + HTML artifacts under .local/v43
- a website-consumable index contract

The pipeline never logs raw Feishu tokens, content text, or courseware.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.feishu_hash_inventory import (  # noqa: E402
    InventoryError,
    download_to_temp,
    file_identity,
    list_pptx,
)
from scripts.pptx_content import (  # noqa: E402
    SCHEMA_VERSION,
    PptxContentError,
    dumps_content,
    parse_pptx,
    render_html,
)

DEFAULT_STORE = Path(".local/v43")
STORE_VERSION = 1
SHA_RE = re.compile(r"^[a-f0-9]{64}$")


class PipelineError(Exception):
    """Sanitized pipeline error code."""


@dataclass(frozen=True)
class SourceFile:
    file_token: str

    @property
    def document_id(self) -> str:
        return file_identity(self.file_token)


@dataclass
class DownloadedFile:
    path: Path
    sha256: str
    size: int


@dataclass
class ProcessResult:
    document_id: str
    status: str
    sha256: str | None = None
    slide_count: int | None = None
    parsed: bool = False
    reason: str | None = None


Downloader = Callable[[str], DownloadedFile]

STATE_KEYS = {
    "source_sha256",
    "schema_version",
    "slide_count",
    "content_path",
    "preview_path",
    "current_version",
}


def _state_path(store: Path) -> Path:
    return store / "state.json"


def _index_path(store: Path) -> Path:
    return store / "index.json"


def _documents_dir(store: Path) -> Path:
    return store / "documents"


def _atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    temporary.replace(path)


def _safe_join(store: Path, relative: str) -> Path:
    base = Path(store).resolve()
    if not isinstance(relative, str) or not relative:
        raise PipelineError("PATH_UNSAFE")
    candidate = (base / relative).resolve()
    if candidate != base and not candidate.is_relative_to(base):
        raise PipelineError("PATH_UNSAFE")
    return candidate


def _relative(store: Path, path: Path) -> str:
    return path.resolve().relative_to(Path(store).resolve()).as_posix()


def _artifact_paths(store: Path, sha256: str) -> tuple[Path, Path]:
    if not SHA_RE.match(sha256 or ""):
        raise PipelineError("CONTENT_HASH_INVALID")
    directory = _documents_dir(store) / sha256
    return directory / "content.json", directory / "preview.html"


def _load_state(store: Path) -> dict:
    path = _state_path(store)
    if not path.exists():
        return {"version": STORE_VERSION, "sources": {}}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise PipelineError("STATE_INVALID") from None
    if (
        not isinstance(data, dict)
        or data.get("version") != STORE_VERSION
        or not isinstance(data.get("sources"), dict)
    ):
        raise PipelineError("STATE_INVALID")
    for document_id, entry in data["sources"].items():
        if not isinstance(document_id, str) or not SHA_RE.match(document_id):
            raise PipelineError("STATE_INVALID")
        if not isinstance(entry, dict) or not STATE_KEYS.issubset(entry):
            raise PipelineError("STATE_INVALID")
        if not SHA_RE.match(str(entry.get("source_sha256", ""))):
            raise PipelineError("STATE_INVALID")
        if not SHA_RE.match(str(entry.get("current_version", ""))):
            raise PipelineError("STATE_INVALID")
        if not isinstance(entry.get("slide_count"), int) or entry["slide_count"] < 0:
            raise PipelineError("STATE_INVALID")
        if not isinstance(entry.get("content_path"), str) or not isinstance(entry.get("preview_path"), str):
            raise PipelineError("STATE_INVALID")
    return data


def _write_state(store: Path, state: dict) -> None:
    payload = {
        "version": STORE_VERSION,
        "sources": dict(sorted(state["sources"].items())),
    }
    _atomic_write_text(
        _state_path(store),
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def _write_index(store: Path, state: dict) -> None:
    documents = [
        {"document_id": document_id, **entry}
        for document_id, entry in sorted(state["sources"].items())
    ]
    payload = {"version": STORE_VERSION, "documents": documents}
    _atomic_write_text(
        _index_path(store),
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def _valid_artifacts(store: Path, content_path: str, preview_path: str, sha256: str) -> bool:
    try:
        content_file = _safe_join(store, content_path)
        preview_file = _safe_join(store, preview_path)
    except PipelineError:
        return False
    if not content_file.is_file() or not preview_file.is_file():
        return False
    if preview_file.stat().st_size <= 0:
        return False
    try:
        content = json.loads(content_file.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    return (
        isinstance(content, dict)
        and content.get("schema_version") == SCHEMA_VERSION
        and content.get("source_sha256") == sha256
        and isinstance(content.get("slides"), list)
    )


def _valid_sha_artifacts(store: Path, sha256: str) -> bool:
    content_path, preview_path = _artifact_paths(store, sha256)
    try:
        return _valid_artifacts(
            store, _relative(store, content_path), _relative(store, preview_path), sha256
        )
    except PipelineError:
        return False


def _write_artifacts(store: Path, content: dict) -> None:
    sha256 = content["source_sha256"]
    content_path, preview_path = _artifact_paths(store, sha256)
    _atomic_write_text(content_path, dumps_content(content))
    _atomic_write_text(preview_path, render_html(content))


def _entry(store: Path, sha256: str, slide_count: int) -> dict:
    content_path, preview_path = _artifact_paths(store, sha256)
    return {
        "source_sha256": sha256,
        "schema_version": SCHEMA_VERSION,
        "slide_count": slide_count,
        "content_path": _relative(store, content_path),
        "preview_path": _relative(store, preview_path),
        "current_version": sha256,
    }


def _slide_count_from_artifacts(store: Path, sha256: str) -> int:
    content_path, _ = _artifact_paths(store, sha256)
    content = json.loads(content_path.read_text(encoding="utf-8"))
    return len(content["slides"])


def _log_result(result: ProcessResult) -> None:
    if result.status == "FAILED":
        reason = (result.reason or "UNKNOWN")[:160]
        print(f"DOC {result.document_id[:12]} FAILED reason={reason}")
        return
    print(
        f"DOC {result.document_id[:12]} {result.status} "
        f"sha={(result.sha256 or '')[:12]} slides={result.slide_count} "
        f"parsed={str(result.parsed).lower()}"
    )


def _print_summary(results: list[ProcessResult]) -> None:
    counts = {name: 0 for name in ("NEW", "CHANGED", "UNCHANGED", "REBUILD", "FAILED")}
    for result in results:
        counts[result.status] = counts.get(result.status, 0) + 1
    print("RESULT " + " ".join(f"{name}={counts[name]}" for name in counts))


def run_incremental(
    sources: Iterable[SourceFile],
    downloader: Downloader,
    store: Path | str = DEFAULT_STORE,
    *,
    verbose: bool = True,
) -> list[ProcessResult]:
    store = Path(store)
    state = _load_state(store)
    results: list[ProcessResult] = []
    seen: set[str] = set()

    for source in sources:
        document_id = source.document_id
        if document_id in seen:
            continue
        seen.add(document_id)
        prior = state["sources"].get(document_id)
        temp_path: Path | None = None
        downloaded_sha: str | None = None
        try:
            downloaded = downloader(source.file_token)
            if not isinstance(downloaded, DownloadedFile):
                raise PipelineError("DOWNLOAD_RESULT_INVALID")
            temp_path = Path(downloaded.path)
            downloaded_sha = downloaded.sha256
            if not SHA_RE.match(downloaded_sha or ""):
                raise PipelineError("CONTENT_HASH_INVALID")
            if not temp_path.is_file():
                raise PipelineError("DOWNLOAD_RESULT_INVALID")

            prior_sha = prior["source_sha256"] if prior else None
            prior_artifacts = bool(
                prior
                and _valid_artifacts(
                    store, prior["content_path"], prior["preview_path"], downloaded_sha
                )
            )
            if prior is None:
                status = "NEW"
            elif prior_sha != downloaded_sha:
                status = "CHANGED"
            elif prior_artifacts:
                status = "UNCHANGED"
            else:
                status = "REBUILD"

            parsed = False
            if status == "UNCHANGED":
                slide_count = prior["slide_count"]
            else:
                if _valid_sha_artifacts(store, downloaded_sha):
                    slide_count = _slide_count_from_artifacts(store, downloaded_sha)
                else:
                    content = parse_pptx(temp_path)
                    if content.get("source_sha256") != downloaded_sha:
                        raise PipelineError("CONTENT_HASH_MISMATCH")
                    _write_artifacts(store, content)
                    slide_count = len(content["slides"])
                    parsed = True

                state["sources"][document_id] = _entry(store, downloaded_sha, slide_count)
                _write_state(store, state)

            result = ProcessResult(
                document_id=document_id,
                status=status,
                sha256=downloaded_sha,
                slide_count=slide_count,
                parsed=parsed,
            )
            results.append(result)
            if verbose:
                _log_result(result)
        except (InventoryError, PptxContentError, PipelineError) as exc:
            result = ProcessResult(
                document_id=document_id,
                status="FAILED",
                sha256=downloaded_sha,
                reason=str(exc) or type(exc).__name__,
            )
            results.append(result)
            if verbose:
                _log_result(result)
        except OSError:
            result = ProcessResult(
                document_id=document_id,
                status="FAILED",
                sha256=downloaded_sha,
                reason="IO_ERROR",
            )
            results.append(result)
            if verbose:
                _log_result(result)
        except Exception as exc:  # keep one malformed file from aborting the run
            result = ProcessResult(
                document_id=document_id,
                status="FAILED",
                sha256=downloaded_sha,
                reason="UNEXPECTED_" + type(exc).__name__,
            )
            results.append(result)
            if verbose:
                _log_result(result)
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

    try:
        _write_index(store, state)
    except OSError:
        print("INDEX_WRITE_FAILED")
    if verbose:
        _print_summary(results)
    return results


def run_feishu_pipeline(
    store: Path | str = DEFAULT_STORE,
    *,
    token: str | None = None,
    folder: str | None = None,
    verbose: bool = True,
) -> list[ProcessResult]:
    token = (token if token is not None else os.environ.get("FEISHU_USER_ACCESS_TOKEN", "")).strip()
    folder = (folder if folder is not None else os.environ.get("FEISHU_FOLDER_TOKEN", "")).strip()
    if not token or not folder:
        raise PipelineError("CONFIG_MISSING_SECRET")

    def downloader(file_token: str) -> DownloadedFile:
        path, digest, size = download_to_temp(token, file_token)
        return DownloadedFile(path=path, sha256=digest, size=size)

    sources = [SourceFile(file_token=entry["token"]) for entry in list_pptx(token, folder)]
    return run_incremental(sources, downloader, store, verbose=verbose)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="V4.3 incremental PPTX -> private content store pipeline."
    )
    parser.add_argument("--store", type=Path, default=DEFAULT_STORE)
    parser.add_argument(
        "--feishu",
        action="store_true",
        help="process the authorized Feishu folder using FEISHU_USER_ACCESS_TOKEN and FEISHU_FOLDER_TOKEN",
    )
    args = parser.parse_args(argv)

    if not args.feishu:
        print("OFFLINE_ONLY: run python scripts/v43_demo.py for the simulated end-to-end pipeline")
        return 2

    try:
        results = run_feishu_pipeline(args.store)
    except PipelineError as exc:
        print(f"ERROR {exc}")
        return 2
    except InventoryError as exc:
        print(f"ERROR {exc}")
        return 1
    return 1 if any(result.status == "FAILED" for result in results) else 0


if __name__ == "__main__":
    sys.exit(main())
