import { inflateRawSync } from 'node:zlib';

// Bounded on-demand extraction: do not store private original files or text.
const MAX_INPUT = 15 * 1024 * 1024, MAX_PART = 3 * 1024 * 1024;
function decodeXml(value) {
  return String(value).replace(/&#x([0-9a-f]+);|&#([0-9]+);|&(amp|lt|gt|quot|apos);/gi, (_m, hex, dec, entity) => {
    if (hex || dec) {
      const n = parseInt(hex || dec, hex ? 16 : 10);
      return n >= 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '';
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()];
  });
}

// ZIP central directory reader; extracts only OOXML text parts.
function readZipParts(input, wanted) {
  const zip = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (zip.length > MAX_INPUT) throw new Error('OFFICE_SIZE_UNSUPPORTED');
  if (zip.length < 22) throw new Error('OFFICE_FILE_INVALID');
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50 && i + 22 + zip.readUInt16LE(i + 20) === zip.length) { end = i; break; }
  }
  if (end < 0) throw new Error('OFFICE_FILE_INVALID');
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  if (count > 600 || cursor >= end) throw new Error('OFFICE_FILE_INVALID');
  const parts = new Map();
  let all = 0;
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error('OFFICE_FILE_INVALID');
    const flags = zip.readUInt16LE(cursor + 8), method = zip.readUInt16LE(cursor + 10);
    const zipped = zip.readUInt32LE(cursor + 20), original = zip.readUInt32LE(cursor + 24);
    const nameLength = zip.readUInt16LE(cursor + 28), extra = zip.readUInt16LE(cursor + 30), comment = zip.readUInt16LE(cursor + 32);
    const offset = zip.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameLength + extra + comment;
    if (next > end) throw new Error('OFFICE_FILE_INVALID');
    const name = zip.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    cursor = next;
    if (!wanted(name)) continue;
    if (parts.has(name) || (flags & 1) || (method !== 8 && method !== 0) || original > MAX_PART || zipped > MAX_INPUT) throw new Error('OFFICE_FILE_INVALID');
    if (offset + 30 > zip.length || zip.readUInt32LE(offset) !== 0x04034b50) throw new Error('OFFICE_FILE_INVALID');
    const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
    if (start + zipped > zip.length) throw new Error('OFFICE_FILE_INVALID');
    const bytes = zip.subarray(start, start + zipped);
    const output = method === 0 ? bytes : inflateRawSync(bytes, { maxOutputLength: MAX_PART + 1 });
    if (output.length !== original) throw new Error('OFFICE_FILE_INVALID');
    all += output.length;
    if (all > 12 * 1024 * 1024) throw new Error('OFFICE_SIZE_UNSUPPORTED');
    parts.set(name, output.toString('utf8'));
  }
  return parts;
}

function taggedText(xml, tag) {
  const safe = tag.replace(':', '\\:');
  const re = new RegExp('<' + safe + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + safe + '>', 'g');
  return [...String(xml).matchAll(re)].map(match => decodeXml(match[1])).join('');
}
function paragraphs(xml, paragraphTag, textTag) {
  const re = new RegExp('<' + paragraphTag + '(?=[\\s>])[^>]*>[\\s\\S]*?<\\/' + paragraphTag + '>', 'g');
  return [...String(xml).matchAll(re)].map(([p]) => taggedText(p, textTag).trim()).filter(Boolean);
}

export function extractOfficeSections(buffer, filename) {
  const format = String(filename).split('.').pop().toLowerCase();
  if (!['pptx', 'docx', 'xlsx'].includes(format)) throw new Error('OFFICE_TYPE_UNSUPPORTED');
  const wanted = format === 'pptx' ? name => /^ppt\/slides\/slide\d+\.xml$/.test(name)
    : format === 'docx' ? name => name === 'word/document.xml'
    : name => name === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(name);
  const parts = readZipParts(buffer, wanted);
  let sections;
  if (format === 'pptx') {
    sections = [...parts.keys()].map(name => ({ name, number: Number(name.match(/^ppt\/slides\/slide(\d+)\.xml$/)?.[1]) }))
      .filter(s => Number.isFinite(s.number)).sort((a,b) => a.number-b.number).map(({name, number}) => {
        const lines = paragraphs(parts.get(name), 'a:p', 'a:t');
        return { label: '第 ' + number + ' 页', title: lines[0] || '第 ' + number + ' 页', paragraphs: lines };
      });
  } else if (format === 'docx') {
    const xml = parts.get('word/document.xml');
    if (!xml) throw new Error('OFFICE_NO_READABLE_CONTENT');
    const lines = paragraphs(xml, 'w:p', 'w:t');
    sections = [];
    for (let i = 0; i < lines.length; i += 75) {
      const chunk = lines.slice(i, i + 75);
      sections.push({ label: '正文 ' + (Math.floor(i / 75) + 1), title: chunk[0].slice(0,85), paragraphs: chunk });
    }
  } else {
    const strings = [...(parts.get('xl/sharedStrings.xml') || '').matchAll(/<si(?=[\s>])[^>]*>[\s\S]*?<\/si>/g)].map(([item]) => taggedText(item, 't'));
    sections = [...parts.keys()].map(name => ({ name, number: Number(name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/)?.[1]) }))
      .filter(s => Number.isFinite(s.number)).sort((a,b) => a.number-b.number).map(({name, number}) => {
        const rows = [];
        for (const [row] of parts.get(name).matchAll(/<row(?=[\s>])[^>]*>[\s\S]*?<\/row>/g)) {
          const cells = [];
          for (const [cell] of row.matchAll(/<c(?=[\s>])[^>]*>[\s\S]*?<\/c>/g)) {
            const type = cell.match(/\bt="([^"]+)"/)?.[1], raw = cell.match(/<v>([\s\S]*?)<\/v>/)?.[1];
            let value = raw ? decodeXml(raw) : taggedText(cell, 't');
            if (type === 's') value = strings[Number(raw)] || '';
            cells.push(value);
          }
          if (cells.length) rows.push(cells.join('　｜　'));
          if (rows.length >= 200) break;
        }
        return { label: '工作表 ' + number, title: '工作表 ' + number, paragraphs: rows };
      });
  }
  if (!sections.length) throw new Error('OFFICE_NO_READABLE_CONTENT');
  return { format, sections, totalSections: sections.length };
}
