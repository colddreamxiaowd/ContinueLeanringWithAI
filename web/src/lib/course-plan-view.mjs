// Client-safe view rules shared by all three pedagogical modes.
// Explicitly distinguish self-assessed recall from graded examination mastery.
export const TEACHING_MODES=["deep","faithful","exam"];
export const MODE_NAMES={deep:"深度理解",faithful:"课件忠实",exam:"纯应试"};
export const MASTERY_LEVELS=["未开始","已阅读 / 练习中","自评能够复述"];
export function taskFor(topic,mode){
 if(!TEACHING_MODES.includes(mode))throw Error("UNSUPPORTED_STUDY_MODE");
 if(mode==="deep")return{
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
export function normalizeMastery(rows,concepts){
 const ids=new Set((Array.isArray(concepts)?concepts:[]).map(t=>t.id));
 const result={};
 for(const row of Array.isArray(rows)?rows:[]){
  if(ids.has(row?.concept_id)&&Number.isInteger(row.level)&&row.level>=0&&row.level<=2)
   result[row.concept_id]=Math.max(result[row.concept_id]||0,row.level);
 }
 return result;
}
export function upgradeMastery(old,conceptId,level) {
 if(typeof conceptId!=="string"||![1,2].includes(level))throw Error("INVALID_MASTERY");
 return {...old,[conceptId]:Math.max(old?.[conceptId]||0,level)};
}
export function demoPlanBundle(){
 const sha="a".repeat(64);
 return {
  schemaVersion:"1.0",plannerVersion:"g3-rule-plan-v1",
  source:{libraryItemId:"synthetic",fileName:"合成概率课件.pptx",sha256:sha,
   synthetic:true,totalSections:2,includedSections:2,limited:false},
  topics:[
   {id:"concept_11111111111111111111",title:"条件概率与样本空间",sourceRefId:"source_1",
    locator:{kind:"slide",value:"1",label:"合成第 1 页",verified:false},
    excerpt:"条件概率表示在事件B已经发生的条件下事件A发生的概率。\n当P(B)>0时，P(A|B)=P(A∩B)/P(B)。",
    extractionStatus:"partial",warnings:["合成样例，不对应真实飞书资料"]},
   {id:"concept_22222222222222222222",title:"贝叶斯公式",sourceRefId:"source_2",
    locator:{kind:"slide",value:"2",label:"合成第 2 页",verified:false},
    excerpt:"贝叶斯公式由条件概率定义得到，用于根据新证据更新事件的条件概率。\nP(A|B)=P(B|A)P(A)/P(B)，其中P(B)>0。",
    extractionStatus:"partial",warnings:["合成样例，不对应真实飞书资料"]}
  ],
  plans:{
   deep:{id:"deep",title:"深度理解",purpose:"理解公式、解释因果并尝试迁移。",
    stages:["读原始证据","自主解释","提出反例","尝试迁移"]},
   faithful:{id:"faithful",title:"课件忠实",purpose:"沿原课件顺序复述并核对来源。",
    stages:["阅读","复述","对照原文","纠偏"]},
   exam:{id:"exam",title:"纯应试",purpose:"遮住原文、限时回忆、核对考点。无真题频率推断。",
    stages:["回忆","限时复述","展开核对","强化薄弱点"]}
  }
 };
}
