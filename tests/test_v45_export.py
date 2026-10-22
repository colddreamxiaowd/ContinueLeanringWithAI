import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.synthetic_pptx import build_synthetic_bytes
from scripts.v43_pipeline import DownloadedFile, SourceFile, run_incremental
from scripts.v45_export_synthetic import (
    ALLOWED_FIXTURES,
    ExportError,
    FixtureSpec,
    export_all,
)


def _tree_hashes(root: Path) -> dict[str, str]:
    return {
        path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


class _BytesDownloader:
    def __init__(self, payload: bytes):
        self.payload = payload

    def __call__(self, file_token: str) -> DownloadedFile:
        handle = tempfile.NamedTemporaryFile(
            prefix="v45-test-", suffix=".pptx", delete=False
        )
        handle.write(self.payload)
        handle.close()
        return DownloadedFile(
            path=Path(handle.name),
            sha256=hashlib.sha256(self.payload).hexdigest(),
            size=len(self.payload),
        )


class V45ExportTests(unittest.TestCase):
    def test_export_is_deterministic_and_marked_synthetic(self):
        with tempfile.TemporaryDirectory() as temporary:
            store = Path(temporary) / "store"
            output = Path(temporary) / "output"

            first = export_all(store, output)
            first_hashes = _tree_hashes(output)
            second = export_all(store, output)
            second_hashes = _tree_hashes(output)

            self.assertEqual(first_hashes, second_hashes)
            self.assertEqual(
                set(first["statuses"].values()), {"NEW"}
            )
            self.assertEqual(
                set(second["statuses"].values()), {"UNCHANGED"}
            )

            index = json.loads((output / "index.json").read_text(encoding="utf-8"))
            self.assertEqual(index["schema_version"], "v45-demo-v1")
            self.assertTrue(index["synthetic"])
            self.assertEqual(len(index["documents"]), 2)
            self.assertTrue(all(item["synthetic"] for item in index["documents"]))
            self.assertTrue(all(item["demo"] for item in index["documents"]))
            self.assertTrue(
                any("合成集成样例" in item["title"] for item in index["documents"])
            )

            documents = {}
            for item in index["documents"]:
                content = json.loads(
                    (output / item["content_file"]).read_text(encoding="utf-8")
                )
                documents[item["document_id"]] = content
                self.assertEqual(content["source_sha256"], item["source_sha256"])
                self.assertEqual(content["slide_count"], len(content["slides"]))
                self.assertEqual(
                    [slide["slide_number"] for slide in content["slides"]],
                    list(range(1, len(content["slides"]) + 1)),
                )

            integration = next(
                content
                for content in documents.values()
                if any(
                    block["type"] == "table"
                    for slide in content["slides"]
                    for block in slide["blocks"]
                )
            )
            self.assertTrue(
                any(
                    block["type"] == "table"
                    for slide in integration["slides"]
                    for block in slide["blocks"]
                )
            )
            self.assertTrue(
                any(
                    block["type"] == "unsupported"
                    for slide in integration["slides"]
                    for block in slide["blocks"]
                )
            )

            for path in output.rglob("*"):
                if not path.is_file():
                    continue
                text = path.read_text(encoding="utf-8")
                self.assertNotIn(str(Path(temporary).resolve()), text)
                self.assertNotIn("synthetic-stack-lesson.pptx", text)
                self.assertNotIn("synthetic-integration-deck.pptx", text)

            self.assertEqual(
                {spec.path.name for spec in ALLOWED_FIXTURES},
                {
                    "synthetic-stack-lesson.pptx",
                    "synthetic-integration-deck.pptx",
                },
            )

    def test_non_allowlisted_fixture_is_rejected_before_export(self):
        with tempfile.TemporaryDirectory() as temporary:
            fake_path = Path(temporary) / "valid-but-not-allowlisted.pptx"
            fake_path.write_bytes(build_synthetic_bytes(marker="PRIVATE_LOOKING_VALID_PPTX"))
            fake = FixtureSpec(
                path=fake_path,
                token="v45:test:not-allowlisted",
                title="Not allowlisted",
            )
            store = Path(temporary) / "store"
            output = Path(temporary) / "output"

            with self.assertRaises(ExportError) as caught:
                export_all(store, output, specs=(fake,))
            self.assertIn("NON_ALLOWLISTED_FIXTURE", str(caught.exception))
            self.assertFalse((store / "state.json").exists())
            self.assertFalse((output / "index.json").exists())

    def test_unexpected_store_document_aborts_export(self):
        with tempfile.TemporaryDirectory() as temporary:
            store = Path(temporary) / "store"
            output = Path(temporary) / "output"
            payload = build_synthetic_bytes(marker="UNEXPECTED_SYNTHETIC_DOC")
            extra = SourceFile("v45:test:unexpected")
            result = run_incremental(
                [extra], _BytesDownloader(payload), store, verbose=False
            )[0]
            self.assertEqual(result.status, "NEW")

            with self.assertRaises(ExportError) as caught:
                export_all(store, output)
            self.assertIn("STORE_HAS_UNEXPECTED_DOCUMENTS", str(caught.exception))
            self.assertFalse((output / "index.json").exists())


if __name__ == "__main__":
    unittest.main()
