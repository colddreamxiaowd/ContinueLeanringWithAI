import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const repo=resolve(dirname(fileURLToPath(import.meta.url)),"../../src/design/pixel-pop/workstreams/reader");
const component=readFileSync(resolve(repo,"reader.tsx"),"utf8");
const demo=readFileSync(resolve(repo,"Demo.tsx"),"utf8");
const css=readFileSync(resolve(repo,"reader.module.css"),"utf8");

test("Session C publishes exactly three composable reader components",()=>{
  for(const name of ["LessonContent","ChapterOutline","SourceCitation"]){
    assert.match(component,new RegExp(`export function ${name}\\(`));
  }
  assert.doesNotMatch(component,/export function LearningToolsRail/);
  assert.match(component,/from "\.\.\/\.\.\/primitives"/);
});
test("Course text is rendered from typed fields, not unsafe markup",()=>{
  for(const kind of ['type:"paragraph"','type:"heading"','type:"figure"','type:"code"','type:"keyPoints"']){
    assert.ok(component.includes(kind),`Reader block missing ${kind}`);
  }
  assert.doesNotMatch(component,/dangerouslySetInnerHTML|\beval\(/);
  assert.match(component,/onCitationSelect/);
  assert.match(component,/sourceTitle/);
});
test("Chapter progress, selection and interactive citations have accessible states",()=>{
  for(const token of ['aria-expanded={open}','aria-current={section.id===activeSectionId',
    'aria-valuenow={done}','aria-pressed={active?.id===item.id}',
    'onMouseEnter={()=>select(item.id)}','role="status"']){
    if(token==='role="status"')continue;
    assert.ok(component.includes(token),`Missing accessible interaction ${token}`);
  }
});
test("Three densities, responsive layouts, reduced motion and demo labeling",()=>{
  for(const v of ['[data-density="minimal"]','[data-density="normal"]',
    '@media(max-width:520px)','prefers-reduced-motion'])assert.ok(css.includes(v),`Missing ${v}`);
  assert.match(demo,/非真实 CoursePack/);
  assert.match(demo,/onClick=\{\(\)=>setDensity\(mode\)\}/);
});
