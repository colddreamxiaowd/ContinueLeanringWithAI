import {createHash} from "node:crypto";

// One source => one canonical set of concepts, three switchable teaching plans.
// This is intentionally a transparent source-grounded planner, not an AI
// paraphraser and not an assertion of actual exam frequency.
export const PLANNER_VERSION = "g3-rule-plan-v1";
export const TEACHING_MODES = Object.freeze(["deep","faithful","exam"]);
export const MODE_NAMES = Object.freeze({
 deep:"深度理解",faithful:"课件忠实",exam:"纯应试"
});
const hash=s=>createHash("sha256").update(s).digest("hex");
const clean=s=>String(s??"").replace(/\s+/g," ").trim();
const slice=(s,n)=>clean(s).slice(0,n);
const number=n=>Number.isSafeInteger(n);
function usefulLines(raw) {
 return (Array.isArray(raw)?raw:[]).filter(x=>typeof x==="string")
  .map(x=>slice(x,360)).filter(Boolean).slice(0,22);
}
function makeTopic(chunk,index){
 const lines=usefulLines(chunk.paragraphs);
 if(!lines.length)return null;
 const fallback="知识点 "+(index+1);
 const title=slice(chunk.title||lines[0]||fallback,95)||fallback;
 const locator=chunk.locator&&typeof chunk.locator==="object"?
  {kind:slice(chunk.locator.kind,30),value:slice(chunk.locator.value,180),
   label:slice(chunk.locator.label||chunk.label,240),
   verified:chunk.locator.verified===true}:
  {kind:"section",value:String(index+1),label:slice(chunk.label,240),verified:false};
 const excerpt=lines.join("\n").slice(0,2600);
 const conceptId="concept_"+hash([index,title,excerpt].join("|")).slice(0,20);
 return {
  id:conceptId,title,sourceRefId:"source_"+(index+1),
  locator, excerpt,
  warnings:(Array.isArray(chunk.warnings)?chunk.warnings:[]).filter(s=>typeof s==="string").slice(0,5).map(s=>slice(s,280)),
  extractionStatus:chunk.extractionStatus==="complete"?"complete":"partial"
 };
}
export function makePlanBundle({libraryItemId,fileName,sourceHash,sections,synthetic=false}){
 if(typeof libraryItemId!=="string"||!libraryItemId||
    typeof fileName!=="string"||!fileName||!/^[a-f0-9]{64}$/i.test(sourceHash)||
    !Array.isArray(sections))throw Error("INVALID_PLAN_SOURCE");
 const topics=sections.slice(0,24).map(makeTopic).filter(Boolean);
 if(!topics.length)throw Error("SOURCE_NO_LEARNABLE_TEXT");
 const truncated=sections.length>24||topics.some(x=>x.excerpt.length>=2600);
 return {
  schemaVersion:"1.0",plannerVersion:PLANNER_VERSION,
  source:{libraryItemId,fileName:slice(fileName,260),sha256:sourceHash,synthetic:Boolean(synthetic),
   limited:truncated,totalSections:sections.length,includedSections:topics.length},
  topics,
  plans:{
   deep:{id:"deep",title:"深度理解",purpose:"从资料内容出发，组织解释、主动回忆和自主举例，再检验迁移能力。",
    stages:["先读原始证据","用自己的语言解释","提出反例或新情境","尝试迁移"]},
   faithful:{id:"faithful",title:"课件忠实",purpose:"沿原始资料顺序复习，保留术语与来源，避免把未写出的内容冒充老师要求。",
    stages:["按原顺序阅读","复述原资料内容","核对出处","标记疑问"]},
   exam:{id:"exam",title:"纯应试",purpose:"优先回忆、限时复述与查漏补缺。无真题或考试大纲时不伪称高频考点。",
    stages:["遮住原文回忆","限时复述要点","展开原文核对","重练未掌握知识点"]}
  }
 };
}
export function taskFor(topic,mode) {
 if(!TEACHING_MODES.includes(mode))throw Error("UNSUPPORTED_STUDY_MODE");
 if(mode==="deep")return {
  prompt:"不查看原文，解释「"+topic.title+"」为什么成立；再尝试举出一个新例子或反例。",
  reflection:"能否区分资料中直接支持的结论与你自己提出的推测？",
  suggestedMinutes:8};
 if(mode==="faithful")return{
  prompt:"先不看资料，按老师原有表述复述「"+topic.title+"」；再展开原文逐条核对。",
  reflection:"有哪些关键词、限定条件或公式被遗漏？",
  suggestedMinutes:5};
 return {
  prompt:"将「"+topic.title+"」视为待复习考点，限时复述关键信息，再对照来源纠错。",
  reflection:"此次是熟练、半熟练还是尚需复习？这是自评，不代表真题高频或客观测评分。",
  suggestedMinutes:3};
}
export function isMode(mode){return TEACHING_MODES.includes(mode);}
export function isBundle(value) {
 return Boolean(value&&typeof value==="object"&&value.plannerVersion===PLANNER_VERSION&&
   Array.isArray(value.topics)&&value.topics.length>0&&value.topics.length<=24&&
   value.topics.every(t=>typeof t.id==="string"&&typeof t.title==="string"&&typeof t.excerpt==="string")&&
   TEACHING_MODES.every(mode=>value.plans?.[mode]?.id===mode));
}
export const MASTERY_LEVELS=Object.freeze(["未开始","已阅读 / 练习中","自评能够复述"]);
export function normalizeMastery(rows,concepts) {
 const ids=new Set((Array.isArray(concepts)?concepts:[]).map(t=>t.id));
 const result={};
 for(const row of Array.isArray(rows)?rows:[]){
  if(ids.has(row?.concept_id)&&number(row.level)&&row.level>=0&&row.level<=2)
   result[row.concept_id]=Math.max(result[row.concept_id]||0,row.level);
 }
 return result;
}
export function upgradeMastery(old,conceptId,level) {
 if(typeof conceptId!=="string"||![1,2].includes(level))throw Error("INVALID_MASTERY");
 return {...old,[conceptId]:Math.max(old?.[conceptId]||0,level)};
}
export function syntheticPlanFixture(){
 const sections=[
  {title:"条件概率与样本空间",paragraphs:[
   "条件概率表示在事件B已经发生的条件下事件A发生的概率。",
   "当P(B)>0时，P(A|B)=P(A∩B)/P(B)。"
  ],label:"合成第 1 页",locator:{kind:"slide",value:"1",label:"合成第 1 页",verified:false},
    warnings:["合成资料，不对应真实飞书 PPTX"],extractionStatus:"partial"},
  {title:"贝叶斯公式",paragraphs:[
   "贝叶斯公式由条件概率定义得到，用于根据新证据更新事件的条件概率。",
   "P(A|B)=P(B|A)P(A)/P(B)，其中P(B)>0。"
  ],label:"合成第 2 页",locator:{kind:"slide",value:"2",label:"合成第 2 页",verified:false},
    warnings:["合成资料，不对应真实飞书 PPTX"],extractionStatus:"partial"}
 ];
 return makePlanBundle({libraryItemId:"synthetic-probability-file",fileName:"合成概率讲义.pptx",
   sourceHash:hash("synthetic-probability-lecture-v1"),sections,synthetic:true});
}
