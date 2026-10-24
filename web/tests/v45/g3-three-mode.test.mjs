import test from "node:test";
import assert from "node:assert/strict";
import {makePlanBundle,PLANNER_VERSION,isBundle} from "../../src/lib/course-plan-modes.mjs";
import {taskFor,demoPlanBundle,normalizeMastery,upgradeMastery} from "../../src/lib/course-plan-view.mjs";
const H="a".repeat(64);
const source=[
 {label:"原件第3页",title:"条件概率",paragraphs:["P(A|B)=P(A且B)/P(B)","样本空间随已知条件改变。"],
  locator:{kind:"slide",value:"3",label:"原件第3页",verified:true},warnings:[],extractionStatus:"complete"},
 {label:"原件第1页",title:"贝叶斯公式",paragraphs:["P(A|B)=P(B|A)P(A)/P(B)","已知检验结果更新判断。"],
  locator:{kind:"slide",value:"1",label:"原件第1页",verified:true},warnings:[],extractionStatus:"complete"}
];
test("one imported real-source snapshot deterministically generates all three distinct plans",()=>{
 const params={libraryItemId:"11111111-1111-4111-8111-111111111111",fileName:"用户授权课件.pptx",
  sourceHash:H,sections:source};
 const pack=makePlanBundle(params);
 assert.equal(pack.plannerVersion,PLANNER_VERSION);
 assert.equal(pack.source.synthetic,false);
 assert.equal(pack.topics.length,2);
 assert.equal(Object.keys(pack.plans).length,3);
 assert.equal(isBundle(pack),true);
 const twin=makePlanBundle(params);
 assert.deepEqual(twin,pack);
 assert.equal(pack.topics[0].locator.value,"3");
 assert.equal(pack.topics[0].locator.verified,true);
 assert.notEqual(taskFor(pack.topics[0],"deep").prompt,taskFor(pack.topics[0],"faithful").prompt);
 assert.notEqual(taskFor(pack.topics[0],"exam").prompt,taskFor(pack.topics[0],"deep").prompt);
 assert.match(pack.plans.exam.purpose,/无真题/);
});
test("source changes change concept ID, but switching modes does not",()=>{
 const first=makePlanBundle({libraryItemId:"x",fileName:"x.pptx",sourceHash:H,sections:source});
 const revised=makePlanBundle({libraryItemId:"x",fileName:"x.pptx",sourceHash:"b".repeat(64),
  sections:[{...source[0],paragraphs:["修订后的概率定义。"]},source[1]]});
 assert.notEqual(first.topics[0].id,revised.topics[0].id);
 assert.equal(first.topics[1].id,revised.topics[1].id);
 const id=first.topics[0].id;
 let mastery=upgradeMastery({},id,2);
 for(const mode of ["deep","faithful","exam"]){
  assert.ok(taskFor(first.topics[0],mode).prompt);
  assert.equal(mastery[id],2);
 }
 mastery=upgradeMastery(mastery,id,1);
 assert.equal(mastery[id],2,"lesser evidence must not downgrade");
});
test("normalized mastery accepts only concept IDs in current family",()=>{
 const pack=demoPlanBundle();
 const [first,second]=pack.topics;
 assert.equal(pack.source.synthetic,true);
 assert.deepEqual(normalizeMastery([{concept_id:first.id,level:2},
  {concept_id:second.id,level:1},{concept_id:"other",level:2}],pack.topics),
  {[first.id]:2,[second.id]:1});
 assert.throws(()=>upgradeMastery({},first.id,0),/INVALID_MASTERY/);
});
test("no source text means no fake course plan",()=>{
 assert.throws(()=>makePlanBundle({libraryItemId:"x",fileName:"x.docx",sourceHash:H,
  sections:[{title:"",paragraphs:[]}]}),/SOURCE_NO_LEARNABLE_TEXT/);
 assert.throws(()=>makePlanBundle({libraryItemId:"x",fileName:"x",sourceHash:"garbage",sections:[]}),
 /INVALID_PLAN_SOURCE/);
});
