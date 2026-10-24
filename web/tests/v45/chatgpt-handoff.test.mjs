import test from "node:test";
import assert from "node:assert/strict";
import {
 HANDOFF_VERSION,normalizeChatGptConversationUrl,projectUrlFromConversation,
 makeCourseHandoff,handoffPrompt,continuationPrompt,sourceRefsForBundle
} from "../../src/lib/chatgpt-course-handoff.mjs";
import {demoPlanBundle} from "../../src/lib/course-plan-view.mjs";
import {validateCoursePack} from "../../src/lib/coursepack.mjs";
const chat="https://chatgpt.com/g/g-p-projectContext-abc/c/00112233-4455";
test("private ChatGPT Project links sanitized and derived without exposing personal chat in source",()=>{
 assert.equal(normalizeChatGptConversationUrl(chat+"，"),chat);
 assert.equal(projectUrlFromConversation(chat),"https://chatgpt.com/g/g-p-projectContext-abc");
 assert.equal(normalizeChatGptConversationUrl("https://evil.example/c/123"),null);
 assert.equal(normalizeChatGptConversationUrl("javascript:alert(1)"),null);
 assert.equal(normalizeChatGptConversationUrl("https://chatgpt.com.evil.net/c/123"),null);
 assert.equal(normalizeChatGptConversationUrl("https://chatgpt.com@evil.example/c/123"),null);
 assert.equal(normalizeChatGptConversationUrl("http://chatgpt.com/c/123"),null);
 assert.equal(normalizeChatGptConversationUrl("https://chatgpt.com/g/project/c/123"),null);
 assert.equal(normalizeChatGptConversationUrl("https://chatgpt.com/c/abc?untrusted=value"),
   "https://chatgpt.com/c/abc");
 assert.equal(projectUrlFromConversation("https://chatgpt.com/c/abc"),null);
});
test("authorized sections and exact source mappings survive handoff without account tokens",()=>{
 const bundle=demoPlanBundle();
 const reader={
  format:"pptx",sections:[
   {label:"第 1 页",title:"概率课",paragraphs:["首段包含定义","第二段包含例题"],
    locator:{kind:"slide",value:"1"},locatorVerified:true,
    extractionStatus:"complete",warnings:[]},
   {label:"第 2 页",title:"结构图",paragraphs:["仅文本"],
    locator:{kind:"slide",value:"2"},locatorVerified:false,
    extractionStatus:"partial",warnings:["含图像，必须上传原始课件"]}
  ]
 };
 const out=makeCourseHandoff({bundle,reader,mode:"deep",
  mastery:{[bundle.topics[0].id]:2,"stranger":2},familyId:"fake-family-id",
  notes:"只做授权课件"});
 assert.equal(out.handoffVersion,HANDOFF_VERSION);
 assert.equal(out.source.completeTextIncluded,true);
 assert.equal(out.source.originalAttachmentRequired,true);
 assert.equal(out.extractedSections[1].locator.verified,false);
 assert.equal(out.extractedSections[1].warnings.length,1);
 assert.deepEqual(out.masterySelfReports,{[bundle.topics[0].id]:2});
 assert.equal(out.sourceRefs[0].id,bundle.topics[0].sourceRefId);
 assert.equal(out.extractedSections[0].paragraphs[0],"首段包含定义");
 assert.equal(out.localFile,null);
 const wire=JSON.stringify(out);
 for(const secret of ["SUPABASE_SECRET_KEY","FEISHU_TOKEN_ENCRYPTION_KEY","sb_secret_","Bearer ","authorization","access_token","user_id"])
  assert.ok(!wire.includes(secret),"export accidentally contains sensitive key "+secret);
});
test("standalone no-Feishu path never includes file bytes or fake extracts",()=>{
 const out=makeCourseHandoff({localFile:{name:"我的讲义.pdf",size:50212},mode:"exam",
  notes:"月底期末考试"});
 assert.equal(out.source.fileName,"我的讲义.pdf");
 assert.equal(out.source.completeTextIncluded,false);
 assert.equal(out.extractedSections.length,0);
 assert.equal(out.localFile.transfer,"ATTACH_MANUALLY_IN_CHATGPT");
 assert.match(handoffPrompt(out),/期末|限时|考试/);
 assert.match(handoffPrompt(out),/stack-simulator/);
 assert.match(handoffPrompt(out),/0-based/);
 assert.match(handoffPrompt(out),/完整合法的 CoursePack JSON 文件/);
 assert.equal(validateCoursePack({
  schemaVersion:"0.1",title:"手工题目",description:"手动生成",
  version:1,visibility:"private",sourceRefs:[],
  chapters:[{id:"c1",title:"认识概念",blocks:[{id:"b1",type:"explanation",markdown:"示例"}]}]
 }).ok,true);
});
test("continuation preserves mode/source metadata and explicitly rejects imaginary history",()=>{
 const out=makeCourseHandoff({bundle:demoPlanBundle(),mode:"faithful"});
 const prompt=continuationPrompt(out,{completed:"第一章已经核对",
  remaining:"第二章和计算题",
  decisions:"按老师课件原顺序",previousSession:chat});
 assert.match(prompt,/第一章已经核对/);
 assert.match(prompt,/第二章和计算题/);
 assert.match(prompt,/按老师课件原顺序/);
 assert.match(prompt,/不要声称已经自动读取完整旧会话/);
 assert.ok(prompt.includes(chat));
 assert.throws(()=>makeCourseHandoff({mode:"unknown"}),/INVALID_HANDOFF_MODE/);
 assert.ok(sourceRefsForBundle(demoPlanBundle()).length>0);
});
test("reject oversized extracted handoffs rather than silently omitting part of real file",()=>{
 const b=demoPlanBundle();
 const big="z".repeat(19_000);
 const reader={sections:Array.from({length:50},(_,i)=>({
  label:"part"+i,paragraphs:Array.from({length:20},()=>big)
 }))};
 assert.throws(()=>makeCourseHandoff({bundle:b,reader}),/HANDOFF_TEXT_TOO_LARGE/);
});
