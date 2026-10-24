import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ownCourseRows,emptyCourseProgress,courseView,markReadingComplete} from "../../src/lib/private-course-view.mjs";
import {validateCoursePack} from "../../src/lib/coursepack.mjs";
import {adaptCoursePackV01} from "../../src/design/pixel-pop/workstreams/reader/coursepack-adapter.mjs";

const pack={
  schemaVersion:"0.1",version:1,visibility:"private",title:"合成课程 · G1 测试",description:"仅用于隔离测试，不代表私人账号或飞书资料",
  sourceRefs:[{id:"ref01",fileName:"合成示例.pptx",locator:"模拟第1页"}],
  chapters:[
    {id:"intro",title:"第一节",blocks:[
      {id:"text01",type:"explanation",markdown:"栈遵循 LIFO。",sourceRefIds:["ref01"]},
      {id:"code01",type:"code",language:"python",source:"stack = []"},
      {id:"stack01",type:"stack-simulator",initial:[1],capacity:3}]},
    {id:"test",title:"第二节",blocks:[
      {id:"quiz01",type:"quiz",prompt:"栈顶是哪一个？",options:["1","2"],answerIndex:1}]},
  ]
};
test("stored rows must contain validated v0.1 packs and opaque private IDs",()=>{
  assert.equal(validateCoursePack(pack).ok,true);
  assert.equal(ownCourseRows([{id:"11111111-1111-4111-8111-111111111111",pack},
    {id:"11111111-1111-4111-8111-111111111112",pack:{...pack,chapters:[]}},
    {id:"demo",pack}]).length,1);
});
test("progress derived only from real block IDs; no demonstration progress defaults",()=>{
  const state={completedBlockIds:["text01","stranger"],answers:{},simStacks:{}};
  const view=courseView(pack,state);
  assert.equal(view.progressPercent,25);
  assert.equal(view.completeCount,1);
  assert.equal(view.chapterId,"intro");
  assert.deepEqual(view.chapters.map(c=>c.status),["current","available"]);
  assert.equal(courseView(pack,emptyCourseProgress()).progressPercent,0);
});
test("read action preserves quiz and simulator state and refuses unsupported completion",()=>{
  const old={completedBlockIds:["text01"],answers:{quiz01:0},simStacks:{stack01:[1,2]}};
  const next=markReadingComplete(pack,old,"code01");
  assert.deepEqual(next.completedBlockIds,["text01","code01"]);
  assert.deepEqual(next.answers,old.answers);
  assert.deepEqual(next.simStacks,old.simStacks);
  assert.equal(markReadingComplete(pack,next,"code01"),null);
  assert.equal(markReadingComplete(pack,next,"quiz01"),null);
});
test("existing reader adapter maps saved chapter and source locator without inventing a Feishu URL",()=>{
  const mapped=adaptCoursePackV01(pack,{chapterId:"intro",completedBlockIds:["text01"]});
  assert.equal(mapped.lesson.title,"第一节");
  assert.equal(mapped.citations[0].location,"模拟第1页");
  assert.equal(mapped.citations[0].href,undefined);
  assert.equal(mapped.chapters[0].sections[0].status,"done");
});
test("new route is authenticated and uses private APIs rather than the integrated demo data",()=>{
  const page=readFileSync(new URL("../../src/app/learn/page.tsx",import.meta.url),"utf8");
  const client=readFileSync(new URL("../../src/app/learn/PrivateLearningClient.tsx",import.meta.url),"utf8");
  assert.match(page,/getCurrentUser\(\)/);
  assert.match(page,/redirect\("\/login\?next=%2Flearn"\)/);
  assert.match(client,/fetch\("\/api\/coursepacks"/);
  assert.match(client,/\/progress"/);
  assert.match(client,/adaptCoursePackV01/);
  assert.doesNotMatch(client,/DEMO_COURSEPACK|DEMO_QUIZZES|DEMO_CHAPTERS/);
});
