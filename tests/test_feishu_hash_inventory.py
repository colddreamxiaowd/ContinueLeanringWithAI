import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from scripts.feishu_hash_inventory import classify, load_manifest, InventoryError


class FingerprintTests(unittest.TestCase):
    def test_new(self):
        self.assertEqual(classify(None, "abc"), "NEW")

    def test_changed(self):
        self.assertEqual(classify("abc", "def"), "CHANGED")

    def test_duplicate(self):
        self.assertEqual(classify("abc", "abc"), "UNCHANGED")

    def test_missing_state(self):
        with TemporaryDirectory() as folder:
            self.assertEqual(load_manifest(Path(folder) / "no.json"), {})

    def test_invalid_state_rejected(self):
        with TemporaryDirectory() as folder:
            path = Path(folder) / "manifest.json"
            path.write_text('{"version":1,"files":[]}', encoding="utf-8")
            with self.assertRaises(InventoryError):
                load_manifest(path)


if __name__ == "__main__":
    unittest.main()
