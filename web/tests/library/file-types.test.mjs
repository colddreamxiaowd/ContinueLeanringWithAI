import test from "node:test";
import assert from "node:assert/strict";
import { extensionOf, mimeTypeForName, previewKind, safeFileName } from "../../src/lib/file-types.mjs";

test("recognizes common learning material previews", () => {
  assert.equal(previewKind("lecture-notes.TXT"), "text");
  assert.equal(previewKind("notes.md"), "text");
  assert.equal(previewKind("diagram.PNG"), "image");
  assert.equal(previewKind("week-2.pdf"), "pdf");
  assert.equal(previewKind("slides.pptx"), "download");
  assert.equal(previewKind("course-folder", "folder"), "folder");
});

test("active web formats are never served as inline content", () => {
  assert.equal(mimeTypeForName("payload.svg"), "application/octet-stream");
  assert.equal(mimeTypeForName("payload.html"), "application/octet-stream");
  assert.equal(mimeTypeForName("notes.txt"), "text/plain; charset=utf-8");
});

test("file names are safe for Content-Disposition headers", () => {
  assert.equal(extensionOf("A.TXT"), "txt");
  assert.equal(safeFileName('a"\r\nb.txt'), "a___b.txt");
});
