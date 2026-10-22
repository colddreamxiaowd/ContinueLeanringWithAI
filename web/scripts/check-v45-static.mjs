import fs from 'node:fs';
import path from 'node:path';
import { readDemoDocument, readDemoIndex } from '../src/lib/v45-demo-data.mjs';

const args = process.argv.slice(2);
const basePathIndex = args.indexOf('--base-path');
const basePath = basePathIndex >= 0 ? args[basePathIndex + 1] || '' : '';
const outDir = path.join(process.cwd(), 'out');
const index = readDemoIndex();

function fail(message) {
  console.error(`V45_STATIC_ERROR ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing ${path.relative(process.cwd(), file)}`);
  return fs.readFileSync(file, 'utf8').replace(/<!--.*?-->/gs, '');
}

if (fs.existsSync(path.join(outDir, 'sources', 'demo', 'invalid-document'))) {
  fail('unexpected invalid document page was generated');
}
if (!fs.existsSync(path.join(outDir, '404.html'))) {
  fail('missing 404.html');
}

const listHtml = read(path.join(outDir, 'sources', 'index.html'));
for (const entry of index.documents) {
  const document = readDemoDocument(entry.document_id);
  if (!document) fail(`missing detail JSON ${entry.document_id}`);
  if (!listHtml.includes(document.title)) fail(`list missing title ${document.title}`);
  const href = `${basePath}/sources/demo/${document.document_id}/`;
  if (!listHtml.includes(href)) fail(`list missing href ${href}`);
  const detailPath = path.join(outDir, 'sources', 'demo', document.document_id, 'index.html');
  const detailHtml = read(detailPath);
  if (!detailHtml.includes(document.title)) fail(`detail missing title ${document.title}`);
  if (!detailHtml.includes(`第 1 页`)) fail(`detail missing page 1 marker ${document.document_id}`);
  if (!detailHtml.includes(`第 ${document.slide_count} 页`)) fail(`detail missing last page marker ${document.document_id}`);
  for (const slide of document.slides) {
    if (!detailHtml.includes(`第 ${slide.slide_number} 页`)) fail(`detail missing page ${slide.slide_number}`);
  }
  for (const block of document.slides.flatMap((slide) => slide.blocks)) {
    if (block.type === 'table') {
      for (const cell of block.rows.flat()) {
        if (cell && !detailHtml.includes(cell)) fail(`detail missing table cell ${cell}`);
      }
    }
    if (block.type === 'unsupported' && !detailHtml.includes(`未支持的内容类型：${block.shape_type}`)) {
      fail(`detail missing unsupported notice ${block.shape_type}`);
    }
  }
}

console.log(`V45_STATIC_OK documents=${index.documents.length} basePath=${basePath || '(root)'}`);
