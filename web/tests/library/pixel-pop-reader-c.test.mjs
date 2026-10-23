import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {adaptCoursePackV01} from "../../src/design/pixel-pop/workstreams/reader/coursepack-adapter.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../src/design/pixel-pop/workstreams/reader");
const read=name=>readFileSync(resolve(root,name),"utf8");
const component=read("reader.tsx"),demo=read("Demo.tsx"),css=read("reader.module.css");
const sample=()=>({schemaVersion:"0.1",title:"演示课程",description:"合成数据",version:1,
  sourceRefs:[{id:"r1",fileName:"虚拟讲义.pptx",locator:"第8页"}],
  chapters:[{id:"c1",title:"栈操作",blocks:[
    {id:"intro",type:"explanation",markdown:"第一段\n\n第二段",sourceRefIds:["r1"]},
    {id:"code1",type:"code",language:"python",source:"print('<script>')"},
    {id:"quiz1",type:"quiz",prompt:"怎么做？",options:["A","B"],answerIndex:0},
    {id:"lab1",type:"stack-simulator",initial:[1],capacity:6}
  ]}]});

test("Only three reusable components; developer labels belong exclusively in Demo",()=>{
  for(const x of ["LessonContent","ChapterOutline","SourceCitation"])assert.match(component,new RegExp(`export function ${x}\\(`));
  assert.doesNotMatch(component,/LessonContent · 课文内容区|ChapterOutline · 章节大纲|SourceCitation · 来源引用/);
  assert.match(demo,/LessonContent · Demo 说明/);
  assert.doesNotMatch(component,/dangerouslySetInnerHTML|\beval\(/);
});
test("CoursePack v0.1 explanation, code and activity IDs survive adaptation",()=>{
  const view=adaptCoursePackV01(sample(),{mode:"demo",activeBlockId:"intro",completedBlockIds:["code1"]});
  assert.deepEqual(view.chapters[0].sections.map(x=>x.id),["intro","code1","quiz1","lab1"]);
  assert.equal(view.chapters[0].sections[1].status,"done");
  assert.equal(view.chapters[0].sections[0].status,"current");
  assert.equal(view.lesson.blocks.find(x=>x.type==="heading").id,"intro");
  assert.equal(view.lesson.blocks.filter(x=>x.type==="paragraph")[1].content.at(-1).citationId,"r1");
  assert.equal(view.lesson.blocks.find(x=>x.type==="code").code,"print('<script>')");
  assert.equal(view.lesson.blocks.filter(x=>x.type==="activity").length,2);
});
test("Source locator is evidence hint, never fabricated URL or verified Feishu",()=>{
  const v=adaptCoursePackV01(sample(),{mode:"demo",sourceLinks:{r1:"https://example.org/resource"}});
  assert.equal(v.citations[0].location,"第8页");
  assert.equal(v.citations[0].sourceTitle,"虚拟讲义.pptx");
  assert.equal(v.citations[0].provenance,"demo");
  assert.match(component,/active\?\.provenance==="demo"\?undefined/);
  assert.match(component,/尚无可用原文链接/);
  assert.match(component,/未找到引用/);
});
test("Unknown citations remain visible and unsupported schema fails closed",()=>{
  const pack=sample();pack.chapters[0].blocks[0].sourceRefIds=["r2"];
  const v=adaptCoursePackV01(pack);
  assert.equal(v.citations[0].provenance,"unverified");
  assert.match(v.citations[0].description,/不存在的 sourceRef/);
  assert.throws(()=>adaptCoursePackV01({...pack,schemaVersion:"0.2"}),/v0.1/);
});
test("Outline positioning, copy failure handling and hover-only previews are explicit",()=>{
  for(const token of ["scrollIntoView({block:\"start\"","target.focus({preventScroll:true})",
    "aria-current={isActive?\"location\":undefined}","aria-expanded={open}",
    "aria-valuenow={done}","setHoveredId(item.id)","onMouseLeave={()=>setHoveredId(null)}",
    "navigator.clipboard.writeText(code)","复制失败，请选择代码后手动复制"]){
    assert.ok(component.includes(token),`Missing reader contract: ${token}`);
  }
  assert.match(component,/useId\(/);
});
test("Reader retains quiet body, three density modes and responsive/reduced motion",()=>{
  for(const token of ["--pp-blue","--pp-mint","line-height:1.9","width:min(100%,760px)",
    '[data-density="minimal"]','[data-density="normal"]',"@media(max-width:620px)","prefers-reduced-motion"])
    assert.ok(css.includes(token),`Missing reader style ${token}`);
  assert.match(demo,/CoursePack v0.1 映射/);
  assert.match(demo,/以下内容、来源和进度均为合成演示/);
});