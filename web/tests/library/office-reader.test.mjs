import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { extractOfficeSections } from '../../src/lib/office-reader.mjs';
import { parseFeishuFolderToken } from '../../src/lib/feishu-folder.mjs';

function makeZip(entries) {
  const local=[],central=[]; let offset=0;
  for (const [name,xml] of Object.entries(entries)) {
    const n=Buffer.from(name),content=Buffer.from(xml),zipped=deflateRawSync(content),l=Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50,0); l.writeUInt16LE(20,4); l.writeUInt16LE(8,8);
    l.writeUInt32LE(zipped.length,18); l.writeUInt32LE(content.length,22); l.writeUInt16LE(n.length,26);
    local.push(l,n,zipped);
    const c=Buffer.alloc(46); c.writeUInt32LE(0x02014b50,0); c.writeUInt16LE(20,4);
    c.writeUInt16LE(20,6); c.writeUInt16LE(8,10); c.writeUInt32LE(zipped.length,20);
    c.writeUInt32LE(content.length,24); c.writeUInt16LE(n.length,28); c.writeUInt32LE(offset,42);
    central.push(c,n);offset+=l.length+n.length+zipped.length;
  }
  const center=Buffer.concat(central),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(entries).length,8);
  end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,center,end]);
}
test('Feishu folder links are parsed safely',()=>{
  assert.equal(parseFeishuFolderToken('https://acme.feishu.cn/drive/folder/fldcnABC12345?from=copy'),'fldcnABC12345');
  assert.equal(parseFeishuFolderToken('fldcnABC12345'),'fldcnABC12345');
  assert.equal(parseFeishuFolderToken('https://fake.feishu.cn.attacker.tld/drive/folder/fldcnABC12345'),null);
});
test('PPTX preserves slide number and textual content',()=>{
  const buffer=makeZip({'ppt/slides/slide10.xml':'<p:sld><a:p><a:t>第十页</a:t></a:p></p:sld>',
    'ppt/slides/slide2.xml':'<p:sld><a:p><a:t>第二页</a:t></a:p><a:p><a:t>练习 &amp; 答案</a:t></a:p></p:sld>'});
  const result=extractOfficeSections(buffer,'lesson.pptx');
  assert.deepEqual(result.sections.map(x=>x.label),['第 2 页','第 10 页']);
  assert.deepEqual(result.sections[0].paragraphs,['第二页','练习 & 答案']);
});
test('DOCX reads paragraphs and XLSX resolves shared strings',()=>{
  const word=makeZip({'word/document.xml':'<w:document><w:p><w:t>教学</w:t></w:p><w:p><w:t>复习</w:t></w:p></w:document>'});
  assert.deepEqual(extractOfficeSections(word,'x.docx').sections[0].paragraphs,['教学','复习']);
  const sheet=makeZip({'xl/sharedStrings.xml':'<sst><si><t>课程</t></si></sst>',
    'xl/worksheets/sheet1.xml':'<worksheet><row><c t="s"><v>0</v></c><c><v>24</v></c></row></worksheet>'});
  assert.deepEqual(extractOfficeSections(sheet,'x.xlsx').sections[0].paragraphs,['课程　｜　24']);
});
test('Damaged and oversized documents fail closed',()=>{
  assert.throws(()=>extractOfficeSections(Buffer.from('no'), 'x.docx'), /OFFICE_FILE_INVALID/);
  assert.throws(()=>extractOfficeSections(Buffer.alloc(15*1024*1024+1), 'x.pptx'), /OFFICE_SIZE_UNSUPPORTED/);
});
