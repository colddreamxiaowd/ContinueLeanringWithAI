/**
 * ChatGPT web handoff contract, deliberately client-safe.
 * NO hardcoded user's private chat URL, Supabase keys, session cookies,
 * access tokens, or server-side uploads to chatgpt.com.
 */
export const HANDOFF_VERSION="zhixu-chatgpt-handoff-v1";
export const CHAT_LINK_STORAGE_KEY="zhixu_course_gpt_chat_link_v1";
export const CHATGPT_HOME="https://chatgpt.com/";
export const HANDOFF_MODES=["deep","faithful","exam"];
export const MODE_LABELS={
 deep:"B · 深度理解（默认）",
 faithful:"A · 课件忠实",
 exam:"C · 纯应试"
};
const clean=(value,limit=500)=>String(value??"").trim().slice(0,limit);
function isObj(x){return Boolean(x&&typeof x==="object"&&!Array.isArray(x));}

/** Only permit the user's explicitly pasted chatgpt.com conversation URL. */
export function normalizeChatGptConversationUrl(raw){
 if(typeof raw!=="string"||raw.length>1500)return null;
 try{
  const url=new URL(raw.trim().replace(/[，、。\s]+$/g,""));
  if(url.protocol!=="https:"||url.hostname!=="chatgpt.com"||url.username||url.password||
     url.port||!/^\/(?:g\/g-p-[a-zA-Z0-9_-]+\/)?c\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname))return null;
  return url.origin+url.pathname.replace(/\/$/,"");
 }catch{return null;}
}
export function projectUrlFromConversation(raw){
 const url=normalizeChatGptConversationUrl(raw);
 if(!url)return null;
 const match=new URL(url).pathname.match(/^\/g\/(g-p-[a-zA-Z0-9_-]+)\/c\//);
 return match?`https://chatgpt.com/g/${match[1]}`:null;
}

export function sourceRefsForBundle(bundle){
 const source=isObj(bundle?.source)?bundle.source:{};
 return (Array.isArray(bundle?.topics)?bundle.topics:[]).slice(0,100).map((topic,index)=>({
  id:/^[a-zA-Z0-9_-]{1,80}$/.test(topic?.sourceRefId||"")?topic.sourceRefId:"source_"+(index+1),
  fileName:clean(source.fileName||"未知来源",400),
  locator:clean(topic?.locator?.label||topic?.locator?.value||"位置待确认",500),
  verified:topic?.locator?.verified===true,
  conceptId:clean(topic?.id,90)
 }));
}

function sanitizedSections(reader){
 if(!isObj(reader)||!Array.isArray(reader.sections))return [];
 return reader.sections.slice(0,250).map((item,i)=>({
  sourceRefId:"source_"+(i+1),
  label:clean(item.label,200),
  title:clean(item.title,280),
  paragraphs:(Array.isArray(item.paragraphs)?item.paragraphs:[])
    .filter(x=>typeof x==="string").map(s=>s.slice(0,20000)).slice(0,500),
  locator:isObj(item.locator)?{
   kind:clean(item.locator.kind,35),value:clean(item.locator.value,150),
   verified:item.locatorVerified===true
  }:{kind:"unknown",value:"",verified:false},
  extractionStatus:item.extractionStatus==="complete"?"complete":"partial",
  warnings:(Array.isArray(item.warnings)?item.warnings:[])
   .filter(x=>typeof x==="string").map(x=>clean(x,500)).slice(0,12)
 }));
}
/**
 * @param {{
 *   bundle?: any,
 *   reader?: any,
 *   mode?: string,
 *   mastery?: Record<string, number>,
 *   familyId?: string,
 *   localFile?: {name:string,size:number}|null,
 *   notes?: string
 * }} [options]
 */
export function makeCourseHandoff({bundle=null,reader=null,mode="deep",
 mastery={},familyId="",localFile=null,notes=""}={}){
 if(!HANDOFF_MODES.includes(mode))throw Error("INVALID_HANDOFF_MODE");
 if(bundle&&!isObj(bundle))throw Error("INVALID_HANDOFF_BUNDLE");
 const source=isObj(bundle?.source)?bundle.source:{};
 const fileName=clean(source.fileName||localFile?.name||"未选择资料",300);
 const local=localFile&&isObj(localFile)?{
  fileName:clean(localFile.name,300),
  sizeBytes:Number.isSafeInteger(localFile.size)&&localFile.size>=0?localFile.size:null,
  transfer:"ATTACH_MANUALLY_IN_CHATGPT"
 }:null;
 const sections=sanitizedSections(reader);
 const refs=sourceRefsForBundle(bundle);
 const validConcepts=new Set((Array.isArray(bundle?.topics)?bundle.topics:[]).map(t=>t.id));
 const levelByConcept={};
 for(const [conceptId,level] of Object.entries(isObj(mastery)?mastery:{})){
  if(validConcepts.has(conceptId)&&Number.isInteger(level)&&level>=0&&level<=2)
   levelByConcept[conceptId]=level;
 }
 const concepts=(Array.isArray(bundle?.topics)?bundle.topics:[]).map(t=>({
  id:clean(t.id,90),title:clean(t.title,200),
  sourceRefId:clean(t.sourceRefId,80),
  excerpt:clean(t.excerpt,2600),
  locatorVerified:t.locator?.verified===true,
  warnings:(Array.isArray(t.warnings)?t.warnings:[])
   .filter(x=>typeof x==="string").map(x=>clean(x,300)).slice(0,10)
 }));
 const out={
  handoffVersion:HANDOFF_VERSION,kind:"create_course",
  source:{
   fileName,sha256:typeof source.sha256==="string"?source.sha256:null,
   synthetic:source.synthetic===true,originalAttachmentRequired:true,
   extraction:"USER_ATTACH_ORIGINAL_FILE; extracted sections may omit images, equations, charts",
   completeTextIncluded:sections.length>0,
   sourceLimited:source.limited===true,
   originalTotalSections:Number.isInteger(source.totalSections)?source.totalSections:null,
   extractedSections:sections.length
  },
  mode,modeLabel:MODE_LABELS[mode],
  familyId:clean(familyId,90)||null,
  localFile:local,
  sourceRefs:refs.map(({id,fileName,locator})=>({id,fileName,locator})),
  conceptNotes:concepts,
  extractedSections:sections,
  masterySelfReports:levelByConcept,
  userNotes:clean(notes,8000),
  outputContract:{
   format:"CoursePack JSON v0.1 (one JSON object, standalone .json attachment)",
   maxChapters:60,maxBlocks:400,
   blockTypes:["explanation","quiz","code","stack-simulator"],
   privateOnly:true,
   note:"Only stack-simulator has interactive controls besides quiz in v0.1. Code is read-only."
  }
 };
 // Avoid huge browser downloads or context overflows. Original attachment
 // remains authoritative if the extracted payload is incomplete.
 const json=JSON.stringify(out);
 if(new TextEncoder().encode(json).byteLength>7*1024*1024)throw Error("HANDOFF_TEXT_TOO_LARGE");
 return out;
}
export function handoffPrompt(handoff){
 if(!isObj(handoff)||handoff.handoffVersion!==HANDOFF_VERSION)throw Error("INVALID_HANDOFF");
 const mode=handoff.mode;
 const modeRules={
  deep:"从直觉、推导、误区和迁移构建学习路线；例题要体现原理与独立思考，不止是选择题。",
  faithful:"遵循原始讲义结构、顺序、术语、限定条件，额外解释必须明确指出是补充，不能杜撰教师要求。",
  exam:"聚焦考试范围、常见解题模式、限时回忆、错因与练习，未知真题频率时不要编造高频权重。"
 };
 return `你正在 ChatGPT 项目中充当「知序 Learning Hub」的高质量交互课程设计师。

任务：阅读我上传的 **原始课件文件** 与 **zhixu-gpt-handoff.json**，为目标模式「${handoff.modeLabel}」生成可直接导回知序的真实课程。当前交接包只由用户主动上传，网页并未自动向此对话发送资料。

制课原则：
1. 以原文件为最终依据，交接包提取的文本不一定覆盖图片、公式、图表；核对来源和页码可信度。不确定的部分请明确列出，不得猜造。
2. ${modeRules[mode]||modeRules.deep}
3. 避免机械逐页抄写，组织可操作的教学目标、分层练习、常见错误和反馈。允许提出创新交互，但不能伪装成当前产品已支持的组件。
4. 使用 CoursePack v0.1，不输出 HTML、JSX、可执行网页或外部脚本。当前支持的 block.type 仅：
   - "explanation": {id,type,markdown,sourceRefIds}
   - "quiz": {id,type,prompt,options,answerIndex,hint?,sourceRefIds}（2–6 选项，答案 0-based）
   - "code": {id,type,language,source,sourceRefIds}（源码只读，不在网页运行）
   - "stack-simulator": {id,type,initial:[整数],capacity:1..20,sourceRefIds}（只适合栈课题）
5. 课程根结构必须是 {schemaVersion:"0.1",title,description,version:1,visibility:"private",sourceRefs:[{id,fileName,locator}],chapters:[{id,title,blocks:[...]}]}。所有 ID 限字母、数字、下划线和连字符；block/章节 ID 全局唯一；每个 sourceRefIds 必须存在于 sourceRefs。
6. 使用交接包里的 sourceRefs，必要时从**已核实**的原文件位置创建新来源；不能虚构不存在的页码。最多 100 条来源、60 章、400 个 blocks。章节讲解尽量分清定义、例题、练习和自主迁移。
7. 根据 source.sha256、familyId、conceptNotes 的知识点语义保持与另外两种模式可追溯，但注意：CoursePack v0.1 的题目进度不会自动写入 G3 共享掌握表，不能伪称已实现关联。
8. 用户私人原件只用于本次授权制课；不要公开、分享或将其上传至第三方服务。

先输出很短的制课大纲和来源不足之处。确认讲解和题目均有依据后，生成 **一个完整合法的 CoursePack JSON 文件**（例如 coursepack-deep.json），不要以省略号代替章节内容。若输出文件能力不可用，输出一个能独立解析的纯 JSON 代码块。额外的高阶交互构想请另列「未来组件建议」，不要混进 JSON。

完成时告诉我：如何从知序的「导入 GPT 结果」将 JSON 验证、预览、保存为私人课程。

交接标识：${handoff.familyId||"尚未绑定课程族"} / 来源：${handoff.source.fileName} / SHA-256：${handoff.source.sha256||"待提供"}。`;
}
export function continuationPrompt(handoff,{completed="",remaining="",decisions="",previousSession=""}={}){
 if(!isObj(handoff)||handoff.handoffVersion!==HANDOFF_VERSION)throw Error("INVALID_HANDOFF");
 return `【知序制课 · 跨会话接力】\n你正在 ChatGPT 的同一个「生成资料」项目中的新会话。旧会话上下文可能已耗尽，请以本次上传的原始课件、zhixu-gpt-handoff.json，以及下列人工确认信息为准，不要声称已经自动读取完整旧会话。\n
资料：${handoff.source.fileName}\nSHA-256：${handoff.source.sha256||"未提供"}\n课程族：${handoff.familyId||"未绑定"}\n模式：${handoff.modeLabel}\n旧会话链接（仅人工参考）：${clean(previousSession,600)||"未提供"}\n
已完成：${clean(completed,2200)||"尚未填写，请根据当前产物核实"}\n未完成：${clean(remaining,2200)||"继续生成并校验 CoursePack"}\n已确认的教学决策：${clean(decisions,2200)||"未填写"}\n
下一步：先确认上传的 CoursePack 成品和交接资料，再继续未完成部分；输出新的独立 CoursePack v0.1 JSON 文件，保留正确来源，不要猜测旧对话缺失内容。\n`;
}
