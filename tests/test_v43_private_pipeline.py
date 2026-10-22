import contextlib
import hashlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tempfile import TemporaryDirectory

from scripts.feishu_hash_inventory import (
    InventoryError,
    download_digest,
    download_to_temp,
)
from scripts.synthetic_pptx import build_synthetic_bytes
from scripts.v43_import import (
    ContentImportError,
    list_documents,
    read_document,
    render_document,
)
from scripts.v43_pipeline import (
    DownloadedFile,
    PipelineError,
    SourceFile,
    run_feishu_pipeline,
    run_incremental,
    select_feishu_sources,
)


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class FakeDownloader:
    def __init__(self, payloads: dict[str, bytes], failures=()):
        self.payloads = dict(payloads)
        self.failures = set(failures)
        self.calls: list[str] = []
        self.paths: list[Path] = []

    def __call__(self, file_token: str) -> DownloadedFile:
        self.calls.append(file_token)
        if file_token in self.failures:
            raise InventoryError("SIMULATED_DOWNLOAD_FAILURE")
        data = self.payloads[file_token]
        with tempfile.NamedTemporaryFile(
            prefix="v43-test-", suffix=".pptx", delete=False
        ) as handle:
            handle.write(data)
            path = Path(handle.name)
        self.paths.append(path)
        return DownloadedFile(path=path, sha256=_sha(data), size=len(data))


def _run(store: Path, downloader: FakeDownloader, sources):
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        results = run_incremental(sources, downloader, store)
    return results, output.getvalue()


class V43PipelineTests(unittest.TestCase):
    def setUp(self):
        self._tmp = TemporaryDirectory()
        self.store = Path(self._tmp.name) / "private-store"
        self.payload_v1 = build_synthetic_bytes(marker="PRIVATE_BODY_MARKER_V1")
        self.payload_v2 = build_synthetic_bytes(marker="PRIVATE_BODY_MARKER_V2")
        self.source_a = SourceFile("RAW_TOKEN_A")

    def tearDown(self):
        self._tmp.cleanup()

    def test_status_transitions_and_artifact_retention(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["NEW"])
        self.assertTrue(results[0].parsed)
        self.assertEqual(results[0].slide_count, 1)

        documents = list_documents(self.store)
        self.assertEqual(len(documents), 1)
        first = documents[0]
        self.assertEqual(first["document_id"], self.source_a.document_id)
        self.assertEqual(first["source_sha256"], _sha(self.payload_v1))
        self.assertEqual(first["schema_version"], "pptx-content-v1")
        first_content_path = self.store / first["content_path"]
        first_preview_path = self.store / first["preview_path"]
        self.assertTrue(first_content_path.is_file())
        self.assertTrue(first_preview_path.is_file())
        content = read_document(self.source_a.document_id, self.store)
        self.assertEqual(content["source_sha256"], _sha(self.payload_v1))
        self.assertIn("PRIVATE_BODY_MARKER_V1", render_document(self.source_a.document_id, self.store))
        self.assertFalse(any(path.exists() for path in downloader.paths))

        calls_before = len(downloader.calls)
        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["UNCHANGED"])
        self.assertFalse(results[0].parsed)
        self.assertEqual(len(downloader.calls), calls_before + 1)

        downloader.payloads["RAW_TOKEN_A"] = self.payload_v2
        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["CHANGED"])
        self.assertTrue(results[0].parsed)
        changed = list_documents(self.store)[0]
        self.assertNotEqual(changed["source_sha256"], first["source_sha256"])
        self.assertTrue(first_content_path.exists())
        self.assertTrue((self.store / changed["content_path"]).is_file())
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            _sha(self.payload_v2),
        )

        (self.store / changed["content_path"]).unlink()
        calls_before = len(downloader.calls)
        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["REBUILD"])
        self.assertTrue(results[0].parsed)
        self.assertEqual(len(downloader.calls), calls_before + 1)
        self.assertTrue((self.store / changed["content_path"]).is_file())
        self.assertFalse(any(path.exists() for path in downloader.paths))

    def test_duplicate_content_reuses_artifacts(self):
        downloader = FakeDownloader(
            {"RAW_TOKEN_A": self.payload_v1, "RAW_TOKEN_C": self.payload_v1}
        )
        sources = [self.source_a, SourceFile("RAW_TOKEN_C")]
        results, _ = _run(self.store, downloader, sources)
        self.assertEqual([result.status for result in results], ["NEW", "NEW"])
        self.assertTrue(results[0].parsed)
        self.assertFalse(results[1].parsed)
        self.assertEqual(len(list_documents(self.store)), 2)
        shard_dirs = [path for path in (self.store / "documents").iterdir() if path.is_dir()]
        self.assertEqual(len(shard_dirs), 1)
        self.assertEqual(len(downloader.calls), 2)

    def test_parse_failure_preserves_old_version(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        _run(self.store, downloader, [self.source_a])
        downloader.payloads["RAW_TOKEN_A"] = self.payload_v2
        _run(self.store, downloader, [self.source_a])
        before = list_documents(self.store)
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            _sha(self.payload_v2),
        )

        downloader.payloads["RAW_TOKEN_A"] = b"not a pptx"
        results, logs = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["FAILED"])
        self.assertEqual(list_documents(self.store), before)
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            _sha(self.payload_v2),
        )
        self.assertNotIn("PRIVATE_BODY_MARKER", logs)
        self.assertFalse(any(path.exists() for path in downloader.paths))

        downloader.failures.add("RAW_TOKEN_B")
        results, _ = _run(self.store, downloader, [SourceFile("RAW_TOKEN_B")])
        self.assertEqual([result.status for result in results], ["FAILED"])
        self.assertNotIn(
            SourceFile("RAW_TOKEN_B").document_id,
            [document["document_id"] for document in list_documents(self.store)],
        )

    def test_import_reader_resilience(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        _run(self.store, downloader, [self.source_a])
        documents = list_documents(self.store)
        self.assertEqual(len(documents), 1)
        self.assertTrue(render_document(self.source_a.document_id, self.store).startswith("<!doctype html>"))

        content_path = self.store / documents[0]["content_path"]
        content_path.unlink()
        with self.assertRaises(ContentImportError) as raised:
            read_document(self.source_a.document_id, self.store)
        self.assertIn("DOCUMENT_UNAVAILABLE", str(raised.exception))

        with TemporaryDirectory() as empty_store:
            self.assertEqual(list_documents(Path(empty_store)), [])

        index_path = self.store / "index.json"
        index_path.unlink()
        with self.assertRaises(ContentImportError) as raised:
            list_documents(self.store)
        self.assertIn("INDEX_STALE", str(raised.exception))
        with self.assertRaises(ContentImportError) as raised:
            read_document(self.source_a.document_id, self.store)
        self.assertIn("INDEX_STALE", str(raised.exception))

        index_path.write_text("{bad json", encoding="utf-8")
        with self.assertRaises(ContentImportError) as raised:
            list_documents(self.store)
        self.assertIn("INDEX_INVALID", str(raised.exception))

    def test_logs_and_index_do_not_leak_private_data(self):
        marker = "PRIVATE_MARKER_SHOULD_NOT_BE_LOGGED"
        token = "RAW_TOKEN_SHOULD_NOT_BE_LOGGED"
        downloader = FakeDownloader(
            {token: build_synthetic_bytes(marker=marker)}
        )
        results, logs = _run(self.store, downloader, [SourceFile(token)])
        self.assertEqual([result.status for result in results], ["NEW"])
        self.assertNotIn(token, logs)
        self.assertNotIn(marker, logs)
        self.assertIn(SourceFile(token).document_id[:12], logs)

        state_text = (self.store / "state.json").read_text(encoding="utf-8")
        index_text = (self.store / "index.json").read_text(encoding="utf-8")
        self.assertNotIn(token, state_text)
        self.assertNotIn(marker, state_text)
        self.assertNotIn(token, index_text)
        self.assertNotIn(marker, index_text)
        # The local private content store intentionally contains the extracted
        # text; it is not part of the index or the sanitized logs.

    def test_invalid_state_fails_before_processing(self):
        self.store.mkdir(parents=True)
        (self.store / "state.json").write_text("{bad", encoding="utf-8")
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        with self.assertRaises(PipelineError) as raised:
            _run(self.store, downloader, [self.source_a])
        self.assertIn("STATE_INVALID", str(raised.exception))


    def test_state_write_failure_preserves_old_and_recovers(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        _run(self.store, downloader, [self.source_a])
        before = list_documents(self.store)
        before_content = read_document(self.source_a.document_id, self.store)
        old_content_path = self.store / before[0]["content_path"]
        downloader.payloads["RAW_TOKEN_A"] = self.payload_v2

        with patch(
            "scripts.v43_pipeline._write_state",
            side_effect=OSError("simulated state failure"),
        ):
            results, logs = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["FAILED"])
        self.assertIn("IO_ERROR", logs)
        self.assertEqual(list_documents(self.store), before)
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            before_content["source_sha256"],
        )
        self.assertTrue(old_content_path.is_file())

        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["CHANGED"])
        self.assertFalse(results[0].parsed)
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            _sha(self.payload_v2),
        )
        self.assertTrue(old_content_path.is_file())

    def test_index_write_failure_is_not_reported_as_success(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        _run(self.store, downloader, [self.source_a])
        old_docs = list_documents(self.store)
        old_sha = read_document(self.source_a.document_id, self.store)["source_sha256"]
        downloader.payloads["RAW_TOKEN_A"] = self.payload_v2

        with patch(
            "scripts.v43_pipeline._write_index",
            side_effect=OSError("simulated index failure"),
        ):
            with self.assertRaises(PipelineError) as raised:
                _run(self.store, downloader, [self.source_a])
        self.assertIn("INDEX_WRITE_FAILED", str(raised.exception))
        with self.assertRaises(ContentImportError) as raised:
            list_documents(self.store)
        self.assertIn("INDEX_STALE", str(raised.exception))
        with self.assertRaises(ContentImportError):
            read_document(self.source_a.document_id, self.store)

        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["UNCHANGED"])
        self.assertNotEqual(_sha(self.payload_v2), old_sha)
        self.assertEqual(
            read_document(self.source_a.document_id, self.store)["source_sha256"],
            _sha(self.payload_v2),
        )
        self.assertEqual(len(list_documents(self.store)), 1)
        self.assertTrue((self.store / old_docs[0]["content_path"]).is_file())

    def test_missing_index_is_stale_and_repaired_by_next_run(self):
        downloader = FakeDownloader({"RAW_TOKEN_A": self.payload_v1})
        _run(self.store, downloader, [self.source_a])
        (self.store / "index.json").unlink()
        with self.assertRaises(ContentImportError) as raised:
            list_documents(self.store)
        self.assertIn("INDEX_STALE", str(raised.exception))

        results, _ = _run(self.store, downloader, [self.source_a])
        self.assertEqual([result.status for result in results], ["UNCHANGED"])
        self.assertEqual(len(list_documents(self.store)), 1)


class FeishuScopeTests(unittest.TestCase):
    def setUp(self):
        self._tmp = TemporaryDirectory()
        self.store = Path(self._tmp.name) / "scope-store"
        self.payload = build_synthetic_bytes(marker="SCOPE_TEST_MARKER")

    def tearDown(self):
        self._tmp.cleanup()

    def test_selection_requires_explicit_single_file_or_all(self):
        entries = [
            {"token": "RAW_FILE_TOKEN_ABC"},
            {"token": "RAW_FILE_TOKEN_XYZ"},
        ]
        with self.assertRaises(PipelineError) as raised:
            select_feishu_sources(entries)
        self.assertIn("CONFIG_MISSING_FILE_TOKEN", str(raised.exception))

        with self.assertRaises(PipelineError) as raised:
            select_feishu_sources(entries, file_token="RAW_FILE_TOKEN_MISSING")
        self.assertIn("FILE_NOT_IN_FOLDER", str(raised.exception))

        selected = select_feishu_sources(entries, file_token="RAW_FILE_TOKEN_ABC")
        self.assertEqual([source.file_token for source in selected], ["RAW_FILE_TOKEN_ABC"])

        all_selected = select_feishu_sources(entries, all_files=True)
        self.assertEqual(
            [source.file_token for source in all_selected],
            ["RAW_FILE_TOKEN_ABC", "RAW_FILE_TOKEN_XYZ"],
        )

        with self.assertRaises(PipelineError) as raised:
            select_feishu_sources(
                entries, file_token="RAW_FILE_TOKEN_ABC", all_files=True
            )
        self.assertIn("SCOPE_CONFLICT", str(raised.exception))

    def test_missing_file_token_refuses_before_listing(self):
        with patch("scripts.v43_pipeline.list_pptx") as listing, patch(
            "scripts.v43_pipeline.download_to_temp"
        ) as download:
            with self.assertRaises(PipelineError) as raised:
                run_feishu_pipeline(self.store, token="user-token", folder="folder")
        self.assertIn("CONFIG_MISSING_FILE_TOKEN", str(raised.exception))
        listing.assert_not_called()
        download.assert_not_called()

    def test_file_must_belong_to_folder(self):
        entries = [{"token": "RAW_FILE_TOKEN_ABC"}]
        with patch(
            "scripts.v43_pipeline.list_pptx", return_value=entries
        ), patch("scripts.v43_pipeline.download_to_temp") as download:
            with self.assertRaises(PipelineError) as raised:
                run_feishu_pipeline(
                    self.store,
                    token="user-token",
                    folder="folder",
                    file_token="RAW_FILE_TOKEN_MISSING",
                )
        self.assertIn("FILE_NOT_IN_FOLDER", str(raised.exception))
        download.assert_not_called()

    def _fake_download(self, token, file_token, paths):
        self.assertEqual(token, "user-token")
        with tempfile.NamedTemporaryFile(
            prefix="scope-test-", suffix=".pptx", delete=False
        ) as handle:
            handle.write(self.payload)
            path = Path(handle.name)
        paths.append(path)
        return path, _sha(self.payload), len(self.payload)

    def test_single_file_mode_downloads_only_selected(self):
        entries = [
            {"token": "RAW_FILE_TOKEN_ABC"},
            {"token": "RAW_FILE_TOKEN_XYZ"},
        ]
        paths = []
        output = io.StringIO()
        with patch(
            "scripts.v43_pipeline.list_pptx", return_value=entries
        ), patch(
            "scripts.v43_pipeline.download_to_temp",
            side_effect=lambda token, file_token: self._fake_download(
                token, file_token, paths
            ),
        ) as download, contextlib.redirect_stdout(output):
            results = run_feishu_pipeline(
                self.store,
                token="user-token",
                folder="folder",
                file_token="RAW_FILE_TOKEN_ABC",
            )
        self.assertEqual([result.status for result in results], ["NEW"])
        self.assertEqual(download.call_count, 1)
        self.assertEqual(download.call_args.args[1], "RAW_FILE_TOKEN_ABC")
        self.assertNotIn("RAW_FILE_TOKEN_ABC", output.getvalue())
        self.assertNotIn("user-token", output.getvalue())
        self.assertFalse(any(path.exists() for path in paths))
        self.assertEqual(len(list_documents(self.store)), 1)

    def test_bulk_mode_is_explicit_and_processes_all(self):
        entries = [
            {"token": "RAW_FILE_TOKEN_ABC"},
            {"token": "RAW_FILE_TOKEN_XYZ"},
        ]
        paths = []
        output = io.StringIO()
        with patch(
            "scripts.v43_pipeline.list_pptx", return_value=entries
        ), patch(
            "scripts.v43_pipeline.download_to_temp",
            side_effect=lambda token, file_token: self._fake_download(
                token, file_token, paths
            ),
        ) as download, contextlib.redirect_stdout(output):
            results = run_feishu_pipeline(
                self.store,
                token="user-token",
                folder="folder",
                all_files=True,
            )
        self.assertEqual([result.status for result in results], ["NEW", "NEW"])
        self.assertFalse(results[1].parsed)
        self.assertEqual(download.call_count, 2)
        self.assertEqual(len(list_documents(self.store)), 2)
        self.assertFalse(any(path.exists() for path in paths))


class FakeResponse:
    status = 200

    def __init__(self, data: bytes):
        self._stream = io.BytesIO(data)

    def read(self, size=-1):
        return self._stream.read(size)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class DownloadContractTests(unittest.TestCase):
    def setUp(self):
        self.data = build_synthetic_bytes(marker="DOWNLOAD_CONTRACT_MARKER")

    def test_download_to_temp_and_digest_contract(self):
        with patch(
            "scripts.feishu_hash_inventory.urllib.request.urlopen",
            side_effect=lambda *args, **kwargs: FakeResponse(self.data),
        ):
            path, digest, size = download_to_temp("token", "file")
        self.assertTrue(path.is_file())
        self.assertEqual(digest, _sha(self.data))
        self.assertEqual(size, len(self.data))
        path.unlink()

        before = set(Path(tempfile.gettempdir()).glob("feishu-pptx-*.pptx"))
        with patch(
            "scripts.feishu_hash_inventory.urllib.request.urlopen",
            side_effect=lambda *args, **kwargs: FakeResponse(self.data),
        ):
            digest2, size2 = download_digest("token", "file")
        after = set(Path(tempfile.gettempdir()).glob("feishu-pptx-*.pptx"))
        self.assertEqual((digest2, size2), (digest, size))
        self.assertEqual(after, before)

    def test_invalid_pptx_cleans_temp(self):
        before = set(Path(tempfile.gettempdir()).glob("feishu-pptx-*.pptx"))
        with patch(
            "scripts.feishu_hash_inventory.urllib.request.urlopen",
            side_effect=lambda *args, **kwargs: FakeResponse(b"not a zip"),
        ):
            with self.assertRaises(InventoryError) as raised:
                download_to_temp("token", "file")
            self.assertIn("NOT_A_VALID_PPTX_ARCHIVE", str(raised.exception))
            with self.assertRaises(InventoryError):
                download_digest("token", "file")
        after = set(Path(tempfile.gettempdir()).glob("feishu-pptx-*.pptx"))
        self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
