import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readDemoDocument, readDemoIndex } from '../../src/lib/v45-demo-data.mjs';

const dataDir = path.join(process.cwd(), 'src', 'data', 'v45-demo');
const index = readDemoIndex();

test('V4.5 index exposes exactly two synthetic documents', () => {
  assert.equal(index.schema_version, 'v45-demo-v1');
  assert.equal(index.synthetic, true);
  assert.equal(index.documents.length, 2);
  assert.equal(index.documents.reduce((sum, document) => sum + document.slide_count, 0), 6);
  assert.ok(index.documents.every((document) => document.synthetic && document.demo));
  assert.ok(index.documents.some((document) => document.title.includes('合成集成样例')));
});

test('document IDs map one-to-one to detail content', () => {
  const ids = new Set();
  for (const entry of index.documents) {
    assert.ok(!ids.has(entry.document_id));
    ids.add(entry.document_id);
    const document = readDemoDocument(entry.document_id);
    assert.ok(document);
    assert.equal(document.document_id, entry.document_id);
    assert.equal(document.source_sha256, entry.source_sha256);
    assert.equal(document.slides.length, entry.slide_count);
    assert.equal(document.slides[0].slide_number, 1);
    assert.equal(document.slides.at(-1).slide_number, entry.slide_count);
    assert.equal(readDemoDocument(`${entry.document_id}0`), null);
  }
  assert.equal(readDemoDocument('not-a-document'), null);
});

test('integration document contains a table and an unsupported picture', () => {
  const entry = index.documents.find((document) => document.title.includes('合成集成样例'));
  assert.ok(entry);
  const document = readDemoDocument(entry.document_id);
  assert.ok(document);
  const blocks = document.slides.flatMap((slide) => slide.blocks);
  const table = blocks.find((block) => block.type === 'table');
  assert.ok(table);
  assert.deepEqual(table.rows[0], ['知识点', '操作', '复杂度']);
  const unsupported = blocks.find((block) => block.type === 'unsupported');
  assert.ok(unsupported);
  assert.equal(unsupported.shape_type, 'PICTURE');
  assert.match(unsupported.note, /not parsed/i);
  assert.ok(blocks.every((block) => Number.isInteger(block.shape_index)));
});

test('paragraph levels and traceability fields are preserved', () => {
  const documents = index.documents.map((entry) => readDemoDocument(entry.document_id));
  const textBlocks = documents.flatMap((document) =>
    document.slides.flatMap((slide) => slide.blocks).filter((block) => block.type === 'text')
  );
  assert.ok(textBlocks.length >= 4);
  assert.ok(textBlocks.some((block) => block.paragraphs.some((paragraph) => paragraph.level > 0)));
  assert.ok(documents.every((document) => document.slides.every((slide) => Array.isArray(slide.blocks))));
});

test('committed JSON contains no fixture filename, absolute path, or token', () => {
  for (const entry of index.documents) {
    const files = [path.join(dataDir, 'index.json'), path.join(dataDir, entry.content_file)];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      assert.ok(!text.includes('synthetic-stack-lesson.pptx'));
      assert.ok(!text.includes('synthetic-integration-deck.pptx'));
      assert.ok(!text.includes('D:/program'));
      assert.ok(!/feishu_(app|user|folder|file)_token/i.test(text));
      assert.ok(!text.includes('b9c56c0c'));
    }
  }
});
