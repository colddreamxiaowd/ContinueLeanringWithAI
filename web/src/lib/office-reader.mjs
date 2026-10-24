import { inflateRawSync } from 'node:zlib';
import {pptxVisibleSlideOrder,xlsxVisibleSheetOrder} from './office-locators.mjs';

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
  const wanted = format === 'pptx' ? name => /^ppt\/slides\/slide\d+\.xml$/.test(name) ||
      name === 'ppt/presentation.xml' || name === 'ppt/_rels/presentation.xml.rels'
    : format === 'docx' ? name => name === 'word/document.xml'
    : name => name === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(name) ||
      name === 'xl/workbook.xml' || name === 'xl/_rels/workbook.xml.rels';
  const parts = readZipParts(buffer, wanted);
  let sections;
  if (format === 'pptx') {
    const order=pptxVisibleSlideOrder(parts);
    const fallback=[...parts.keys()].filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a,b)=>Number(a.match(/slide(\d+)/)?.[1])-Number(b.match(/slide(\d+)/)?.[1]));
    sections=(order||fallback).map((name,index)=>{
      const xml=parts.get(name),number=order?index+1:Number(name.match(/slide(\d+)/)?.[1]);
      const lines=paragraphs(xml, 'a:p', 'a:t');
      const warnings=[];
      if(!order)warnings.push('PPTX 缺少完整幻灯片顺序映射；此编号来自文件名，实际顺序未确认');
      if(/<a:blip(?=[\\s/>])|<p:pic(?=[\\s/>])/.test(xml))warnings.push('本页含图像，图像内容尚未完整理解');
      return {label:'第 '+number+' 页',title:lines[0]||'第 '+number+' 页',paragraphs:lines,
        locator:{kind:'slide',value:String(number)},sourcePart:name,
        locatorVerified:Boolean(order),extractionStatus:warnings.length?'partial':'complete',warnings};
    });
  } else if (format === 'docx') {
    const xml = parts.get('word/document.xml');
    if (!xml) throw new Error('OFFICE_NO_READABLE_CONTENT');
    const lines = paragraphs(xml, 'w:p', 'w:t');
    sections = [];
    for (let i = 0; i < lines.length; i += 75) {
      const chunk = lines.slice(i, i + 75);
      sections.push({ label: '正文 ' + (Math.floor(i / 75) + 1), title: chunk[0].slice(0,85), paragraphs: chunk,
        locator:{kind:'paragraph',value:(i+1)+'-'+(i+chunk.length)},
        sourcePart:'word/document.xml',locatorVerified:true,extractionStatus:'partial',
        warnings:['当前段落提取不包含图片、复杂公式或脚注的完整内容'] });
    }
  } else {
    const strings = [...(parts.get('xl/sharedStrings.xml') || '').matchAll(/<si(?=[\s>])[^>]*>[\s\S]*?<\/si>/g)].map(([item]) => taggedText(item, 't'));
    const ordered=xlsxVisibleSheetOrder(parts);
    const fallback=[...parts.keys()].filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort((a,b)=>Number(a.match(/sheet(\d+)/)?.[1])-Number(b.match(/sheet(\d+)/)?.[1]))
      .map(name=>({part:name,label:'工作表文件 '+(name.match(/sheet(\d+)/)?.[1]||'?')}));
    sections=(ordered||fallback).map(({part:name,label},index) => {
        const number=index+1;
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
        return { label:ordered?'工作表 '+label:label,title:ordered?label:label,paragraphs:rows,
          locator:{kind:'sheet',value:ordered?label:name},sourcePart:name,
          locatorVerified:Boolean(ordered),extractionStatus:'partial',
          warnings:ordered?['仅提取部分单元格文本；图表/公式与后续行未完整解析']:
          ['工作簿缺少工作表名称映射；显示的是底层文件名而非确认的工作表名称'] };
      
      });
  }
  if (!sections.length) throw new Error('OFFICE_NO_READABLE_CONTENT');
  return { format, sections, totalSections: sections.length };
}
