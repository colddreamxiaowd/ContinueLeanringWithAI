import test from "node:test";
import assert from "node:assert/strict";
import {validateCoursePack} from "../../src/lib/coursepack.mjs";
const sample = () => ({
  schemaVersion:"0.1",title:"栈的基本操作",description:"数据结构交互课程",
  version:1,visibility:"private",
  sourceRefs:[{id:"slide12",fileName:"数据结构.pptx",locator:"slide 12"}],
  chapters:[{id:"ch1",title:"栈",blocks:[
    {id:"ex1",type:"explanation",markdown:"栈是后进先出",sourceRefIds:["slide12"]},
    {id:"code1",type:"code",language:"python",source:"stack.append(3)"},
    {id:"sim1",type:"stack-simulator",initial:[3,7],capacity:6},
    {id:"q1",type:"quiz",prompt:"先弹出谁",options:["3","7"],answerIndex:1}
  ]}]
});
test("accepts a traceable lesson with four safe block types",()=>{
  assert.equal(validateCoursePack(sample()).ok,true);
});
test("refuses arbitrary generated JS/HTML block",()=>{
  const s=sample();s.chapters[0].blocks.push({id:"x",type:"raw-html",html:"<script>alert(1)</script>"});
  assert.equal(validateCoursePack(s).ok,false);
});
test("refuses public import, broken references and bad answer indexes",()=>{
  const s=sample();s.visibility="public";
  s.chapters[0].blocks[0].sourceRefIds=["missing"];
  s.chapters[0].blocks[3].answerIndex=9;
  const r=validateCoursePack(s);
  assert.equal(r.ok,false);assert(r.errors.length>=3);
});
test("refuses duplicate block IDs",()=>{
  const s=sample();s.chapters[0].blocks[2].id="ex1";
  assert.equal(validateCoursePack(s).ok,false);
});
