import test from "node:test";
import assert from "node:assert/strict";
import {deflateRawSync} from "node:zlib";
import {createHash} from "node:crypto";
import {extractOfficeSections} from "../../src/lib/office-reader.mjs";
import {officeSourceChunks,sha256Office} from "../../src/lib/source-chunks.mjs";
function zip(entries){
 const locals=[],centrals=[];let at=0;
 for(const [name,body] of Object.entries(entries)){
  const path=Buffer.from(name),data=Buffer.from(body),def=deflateRawSync(data),local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);
  local.writeUInt32LE(def.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(path.length,26);
  locals.push(local,path,def);
  const head=Buffer.alloc(46);head.writeUInt32LE(0x02014b50,0);head.writeUInt16LE(20,4);head.writeUInt16LE(20,6);
  head.writeUInt16LE(8,10);head.writeUInt32LE(def.length,20);head.writeUInt32LE(data.length,24);
  head.writeUInt16LE(path.length,28);head.writeUInt32LE(at,42);centrals.push(head,path);
  at+=local.length+path.length+def.length;
 }
 const directory=Buffer.concat(centrals),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(entries).length,8);
 end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(at,16);
 return Buffer.concat([...locals,directory,end]);
}
test("visible PowerPoint page order overrides slide filenames and is source-verified",()=>{
 const source=zip({
  "ppt/slides/slide10.xml":"<p:sld><a:p><a:t>开篇</a:t></a:p></p:sld>",
  "ppt/slides/slide2.xml":"<p:sld><a:p><a:t>第二张可见页</a:t></a:p><p:pic/></p:sld>",
  "ppt/presentation.xml":'<p:presentation><p:sldIdLst><p:sldId id="256" r:id="rB"/><p:sldId id="257" r:id="rA"/></p:sldIdLst></p:presentation>',
  "ppt/_rels/presentation.xml.rels":'<Relationships><Relationship Id="rA" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/><Relationship Id="rB" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide10.xml"/></Relationships>'
 });
 const parsed=extractOfficeSections(source,"my-lecture.pptx");
 assert.deepEqual(parsed.sections.map(x=>x.label),["第 1 页","第 2 页"]);
 assert.deepEqual(parsed.sections.map(x=>x.title),["开篇","第二张可见页"]);
 assert.deepEqual(parsed.sections.map(x=>x.locatorVerified),[true,true]);
 assert.equal(parsed.sections[1].extractionStatus,"partial");
 const metadata={ownerId:"owner-a",libraryItemId:"11111111-1111-4111-8111-111111111111",
    fileName:"my-lecture.pptx",mimeType:"application/pptx",originalHash:sha256Office(source)};
 const chunks=officeSourceChunks(parsed,metadata);
 assert.equal(chunks[0].locator.value,"1");
 assert.equal(chunks[1].extractionStatus,"partial");
 assert.equal(chunks[0].id,officeSourceChunks(parsed,metadata)[0].id);
 assert.equal(chunks[0].originalHash,createHash("sha256").update(source).digest("hex"));
});
test("worksheet visible names and ordering are resolved from workbook relationships",()=>{
 const source=zip({
  "xl/worksheets/sheet2.xml":"<worksheet><row><c><v>22</v></c></row></worksheet>",
  "xl/worksheets/sheet1.xml":"<worksheet><row><c><v>11</v></c></row></worksheet>",
  "xl/workbook.xml":'<workbook><sheets><sheet name="第二学期" sheetId="1" r:id="rB"/><sheet name="第一学期" sheetId="2" r:id="rA"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels":'<Relationships><Relationship Id="rA" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rB" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>'
 });
 const parsed=extractOfficeSections(source,"scores.xlsx");
 assert.deepEqual(parsed.sections.map(x=>x.label),["工作表 第二学期","工作表 第一学期"]);
 assert.deepEqual(parsed.sections.map(x=>x.paragraphs),[["22"],["11"]]);
 assert.equal(parsed.sections[0].locatorVerified,true);
});
test("missing manifest never asserts verified source location",()=>{
 const source=zip({"ppt/slides/slide1.xml":"<p:sld><a:p><a:t>文字</a:t></a:p></p:sld>"});
 const data=extractOfficeSections(source,"unconfirmed.pptx");
 const chunks=officeSourceChunks(data,{ownerId:"owner",libraryItemId:"id",fileName:"unconfirmed.pptx",
   mimeType:"application/pptx",originalHash:sha256Office(source)});
 assert.equal(data.sections[0].locatorVerified,false);
 assert.equal(chunks[0].extractionStatus,"partial");
 assert.ok(chunks[0].warnings.some(s=>s.includes("未核验")));
});
