import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'v45-demo');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function readDemoIndex() {
  const indexPath = path.join(DATA_DIR, 'index.json');
  const index = readJson(indexPath);
  if (!index || index.schema_version !== 'v45-demo-v1' || !Array.isArray(index.documents)) {
    throw new Error('V45_DEMO_INDEX_INVALID');
  }
  return index;
}

export function readDemoDocument(documentId) {
  const index = readDemoIndex();
  const entry = index.documents.find((item) => item.document_id === documentId);
  if (!entry) return null;
  const resolved = path.resolve(DATA_DIR, entry.content_file);
  if (resolved !== DATA_DIR && !resolved.startsWith(DATA_DIR + path.sep)) return null;
  const content = readJson(resolved);
  if (
    !content ||
    content.schema_version !== 'v45-demo-v1' ||
    content.document_id !== documentId ||
    content.source_sha256 !== entry.source_sha256
  ) {
    return null;
  }
  return content;
}
