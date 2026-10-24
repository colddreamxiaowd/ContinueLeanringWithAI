"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {validateCoursePack} from "@/lib/coursepack.mjs";
import {
 CHATGPT_HOME,CHAT_LINK_STORAGE_KEY,MODE_LABELS,HANDOFF_MODES,
 normalizeChatGptConversationUrl,projectUrlFromConversation,
 makeCourseHandoff,handoffPrompt,continuationPrompt
} from "@/lib/chatgpt-course-handoff.mjs";
import s from "./chatgpt-course-handoff.module.css";

type Mode="deep"|"faithful"|"exam";
type FileInfo={name:string;size:number};
type Source={fileName:string;libraryItemId:string;sha256:string;synthetic:boolean;limited?:boolean};
type Topic={id:string;title:string;sourceRefId:string;excerpt:string;locator?:{verified?:boolean};warnings?:string[]};
type Bundle={source:Source;topics:Topic[];plans:Record<Mode,{id:string;title:string;purpose:string}>};
type Props={bundle?:Bundle|null;familyId?:string;mastery?:Record<string,number>;mode?:Mode;demo?:boolean};
type CoursePack={schemaVersion:string;title:string;description:string;version:number;
 sourceRefs:Array<{id:string;fileName:string;locator:string}>;
 chapters:Array<{id:string;title:string;blocks:Array<{id:string;type:string}>}>};
type Handoff=ReturnType<typeof makeCourseHandoff>;
function download(name:string,text:string,type="application/json;charset=utf-8"){
 const blob=new Blob([text],{type});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 // Defer cleanup to let browsers finish handing the file to the download manager.
 window.setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function asFilename(value:string){return (value||"course").replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g,"_").slice(0,48);}
function formatError(value:string){return value==="HANDOFF_TEXT_TOO_LARGE"
 ?"资料提取内容过大，请直接上传原始文件并只发送制课指令。":value;}
function trimFences(text:string){
 return text.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"").trim();
}
export default function ChatGptCourseHandoff({bundle=null,familyId="",mastery={},mode="deep",demo=false}:Props){
 const [storedChat,setStoredChat]=useState("");
 const [chatDraft,setChatDraft]=useState("");
 const [localFile,setLocalFile]=useState<FileInfo|null>(null);
 const [localMode,setLocalMode]=useState<Mode>("deep");
 const [includeMastery,setIncludeMastery]=useState(false);
 const [notes,setNotes]=useState("");
 const [busy,setBusy]=useState(false);
 const [handoff,setHandoff]=useState<Handoff|null>(null);
 const [status,setStatus]=useState("");
 const [err,setErr]=useState("");
 const [jsonInput,setJsonInput]=useState("");
 const [preview,setPreview]=useState<CoursePack|null>(null);
 const [courseSaved,setCourseSaved]=useState(false);
 const [saving,setSaving]=useState(false);
 const [completed,setCompleted]=useState("");
 const [remaining,setRemaining]=useState("");
 const [decisions,setDecisions]=useState("");
 const selectedMode=bundle?mode:localMode;
 const session=normalizeChatGptConversationUrl(storedChat);
 const projectUrl=projectUrlFromConversation(storedChat);
 useEffect(()=>{
  try{
   const url=localStorage.getItem(CHAT_LINK_STORAGE_KEY)||"";
   const safe=normalizeChatGptConversationUrl(url);
   if(safe){setStoredChat(safe);setChatDraft(safe);}
  }catch{}
 },[]);
 function saveChatLink(){
  setErr("");
  if(!chatDraft.trim()){
   setStoredChat("");try{localStorage.removeItem(CHAT_LINK_STORAGE_KEY);}catch{}
   setStatus("已清除本浏览器保存的固定会话地址。");
   return;
  }
  const url=normalizeChatGptConversationUrl(chatDraft);
  if(!url){setErr("只接受 chatgpt.com 的完整会话链接（/c/… 或 /g/g-p-…/c/…）。");return;}
  try{localStorage.setItem(CHAT_LINK_STORAGE_KEY,url);}catch{}
  setStoredChat(url);setStatus("固定会话地址只保存在当前浏览器，不发送至知序服务器。");
 }
 async function prepare(){
  setErr("");setStatus("");setBusy(true);
  try{
   if(!bundle&&!localFile)throw Error("请选择一份本地资料文件（不会上传到知序服务器）。");
   let reader=null;
   if(bundle&&!demo&&!bundle.source.synthetic){
    // Download the complete extract only from the existing owner-authenticated API.
    // Never send auth headers or Feishu tokens to chatgpt.com.
    const res=await fetch("/api/library/items/"+encodeURIComponent(bundle.source.libraryItemId)+"/reader",{
     credentials:"same-origin",cache:"no-store"
    });
    if(!res.ok){
     const data=await res.json().catch(()=>({}));
     throw Error("原始资料提取失败（"+(data.error||res.status)+"）。请先恢复飞书连接，或直接选择本地原文件。");
    }
    reader=await res.json();
    if(!Array.isArray(reader?.sections))throw Error("资料提取接口未返回有效的章节数组。");
   }
   const result=makeCourseHandoff({bundle,reader,
    mode:selectedMode,mastery:includeMastery?mastery:{},familyId,
    localFile,notes});
   setHandoff(result);
   download("zhixu-gpt-handoff-"+asFilename(result.source.fileName)+".json",JSON.stringify(result,null,2));
   setStatus("交接包已下载。接下来复制制课指令，并将交接包和原始课件上传到 ChatGPT 固定会话。");
  }catch(e){setErr(formatError(e instanceof Error?e.message:"交接包生成失败"));}
  finally{setBusy(false);}
 }
 async function copy(text:string,success:string){
  try{await navigator.clipboard.writeText(text);setErr("");setStatus(success);}
  catch{setErr("浏览器未允许复制，请从下方文本区域手动选中并复制。");}
 }
 function chatOpen(url:string){window.open(url,"_blank","noopener,noreferrer");}
 function reviewDraft(value:string){
  setErr("");setStatus("");setPreview(null);setCourseSaved(false);
  try{
   const parsed=JSON.parse(trimFences(value)) as CoursePack;
   const verdict=validateCoursePack(parsed);
   if(!verdict.ok)throw Error(verdict.errors.join("；"));
   setPreview(parsed);
   setStatus("CoursePack v0.1 格式校验通过；请确认课程内容与原件出处，再保存到私人数据库。");
  }catch(e){setErr("课程校验失败："+(e instanceof Error?e.message:"无效 JSON"));}
 }
 async function saveCourse(){
  if(!preview||saving||demo)return;
  setSaving(true);setErr("");
  try{
   const response=await fetch("/api/coursepacks",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({pack:preview})
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.id)throw Error(data.details?.join("；")||data.error||"未成功保存");
   setCourseSaved(true);
   setStatus("课程已由服务器验证并保存到当前登录账号。可进入「我的互动课程」继续学习。");
  }catch(e){setErr("私人课程保存失败："+(e instanceof Error?e.message:"未知错误"));}
  finally{setSaving(false);}
 }
 function exportContinuation(){
  if(!handoff){setErr("请先准备本次 ChatGPT 制课交接包。");return;}
  const content=continuationPrompt(handoff,{completed,remaining,decisions,previousSession:session||""});
  download("zhixu-session-continuation-"+asFilename(handoff.source.fileName)+".md",content,"text/markdown;charset=utf-8");
  setStatus("续接提示文件已下载。打开同一 ChatGPT 项目中的新对话，附上它、原始课件和交接包即可继续。");
 }
 const prompt=handoff?handoffPrompt(handoff):"先点击「生成并下载交接包」，这里会出现适用于固定 ChatGPT 会话的制课指令。";
 const continuation=handoff?continuationPrompt(handoff,{completed,remaining,decisions,previousSession:session||""}):"";
 const originalId=bundle?.source.libraryItemId;
 const canDownloadOriginal=!demo&&Boolean(originalId&&/^[0-9a-f-]{36}$/i.test(originalId));
 return <section className={s.root} data-chatgpt-handoff="true">
  <header className={s.heading}>
   <div><span className={s.eyebrow}>ZHIXU × CHATGPT PROJECT · COURSE BRIDGE</span>
    <h2>把真实课件交给 GPT 制课，再回到知序学习</h2>
    <p>固定会话、可追溯来源、结构化课程包，以及会话达到上限时的人工接力。</p>
   </div>
   <span className={s.privacy}>手动授权上传 · 不公开课件</span>
  </header>
  <div className={s.grid}>
   <div className={s.panel}>
    <span className={s.step}>01 · 固定会话</span>
    <h3>只需设置一次 ChatGPT 会话链接</h3>
    <p>链接仅保存在这个浏览器的本地设置，不写入公开 GitHub，也不会发往知序服务器。</p>
    <label htmlFor="gpt-chat-url">固定的 ChatGPT 项目会话 URL</label>
    <input id="gpt-chat-url" type="url" autoComplete="off" spellCheck={false}
     placeholder="https://chatgpt.com/g/g-p-…/c/…" value={chatDraft}
     onChange={e=>setChatDraft(e.target.value.slice(0,1500))}/>
    <div className={s.actions}>
     <button type="button" onClick={saveChatLink}>保存固定会话</button>
     <button type="button" className={s.primary} onClick={()=>chatOpen(session||CHATGPT_HOME)}>
      {session?"打开固定制课会话 ↗":"打开 ChatGPT ↗"}
     </button>
    </div>
    {projectUrl&&<div className={s.muted}>会话接近上下文上限时：
     <button className={s.inline} type="button" onClick={()=>chatOpen(projectUrl)}>打开同一 ChatGPT 项目 ↗</button>
    </div>}
   </div>

   <div className={s.panel}>
    <span className={s.step}>02 · 私人来源</span>
    <h3>{bundle?"当前课程族已选择资料":"或者直接选本地原文件"}</h3>
    {bundle?<div className={s.source}>
      <strong>{bundle.source.fileName}</strong>
      <small>SHA-256 {bundle.source.sha256.slice(0,15)}… · {bundle.topics.length} 个知识点</small>
      <small>教学模式：{MODE_LABELS[selectedMode]}</small>
      {bundle.source.limited&&<small>注意：G3 的摘要只覆盖部分文本；本交接将重新读取全部可提取段落。</small>}
     </div>:<>
      <label htmlFor="gpt-local-file">选择你的 PPTX、PDF、DOCX、XLSX 或其他教学资料</label>
      <input id="gpt-local-file" type="file" accept=".pptx,.pdf,.docx,.xlsx,.md,.txt"
       onChange={e=>{const file=e.target.files?.[0];setLocalFile(file?{name:file.name,size:file.size}:null);setHandoff(null);}}/>
      <label htmlFor="gpt-standalone-mode">希望生成哪种课程？</label>
      <select id="gpt-standalone-mode" value={localMode}
       onChange={e=>{setLocalMode(e.target.value as Mode);setHandoff(null);}}>
       {HANDOFF_MODES.map(item=><option key={item} value={item}>{MODE_LABELS[item as Mode]}</option>)}
      </select>
      <p className={s.muted}>文件不会通过此控件上传服务器；之后请你在 ChatGPT 会话中手动附上原文件。</p>
     </>}
    <label htmlFor="gpt-extra-notes">制课要求或考试范围（可选）</label>
    <textarea id="gpt-extra-notes" rows={3} maxLength={8000} value={notes}
     onChange={e=>{setNotes(e.target.value);setHandoff(null);}}
     placeholder="例如：重点讲清条件概率；期末题型偏计算；需要推导和迁移题。"/>
    <label className={s.check}>
     <input type="checkbox" checked={includeMastery} onChange={e=>{setIncludeMastery(e.target.checked);setHandoff(null);}}/>
     把我当前知识点的自评掌握状态也放进交接包
    </label>
    <div className={s.actions}>
     <button type="button" className={s.primary} disabled={busy} onClick={()=>void prepare()}>
      {busy?"正在从私人资料提取…":"生成并下载交接包 ↓"}
     </button>
     {canDownloadOriginal&&<a className={s.actionLink}
      href={"/api/library/items/"+encodeURIComponent(originalId!)+"/original"}>
      下载授权原始课件 ↓</a>}
    </div>
    <p className={s.muted}>原文件是最高优先级资料。文字交接包可能没有图片、复杂公式和图表；必须在 ChatGPT 中同时上传原文件。</p>
   </div>
  </div>

  <div className={s.panel}>
   <span className={s.step}>03 · 生成课程</span>
   <h3>复制指令，在固定会话中粘贴并附上文件</h3>
   <textarea className={s.prompt} readOnly rows={7} aria-label="ChatGPT 制课指令" value={prompt}/>
   <div className={s.actions}>
    <button type="button" disabled={!handoff} onClick={()=>void copy(prompt,"制课指令已复制，请粘贴到固定会话。")}>复制制课指令</button>
    <button type="button" onClick={()=>chatOpen(session||CHATGPT_HOME)}>去 ChatGPT 制课 ↗</button>
   </div>
   <p className={s.muted}>这是你主动确认的文件交接，而非服务器自动向 ChatGPT 会话写入消息。生成时请让 GPT 返回独立的 CoursePack v0.1 JSON 文件。</p>
  </div>

  <div className={s.panel}>
   <span className={s.step}>04 · 回传知序</span>
   <h3>导入 GPT 生成的 CoursePack</h3>
   <p>既可选择 GPT 下载的 JSON 文件，也可以粘贴 JSON 代码块。先校验结构和来源，再保存为当前账号的私人课程。</p>
   <label htmlFor="gpt-output-file">选择 GPT 的 coursepack.json</label>
   <input id="gpt-output-file" type="file" accept=".json,application/json"
    onChange={e=>{const f=e.target.files?.[0];if(f)void f.text().then(v=>{setJsonInput(v);setPreview(null);setCourseSaved(false);}).catch(()=>setErr("无法读取 JSON 文件"));}}/>
   <label htmlFor="gpt-output-json">或者粘贴 JSON</label>
   <textarea id="gpt-output-json" className={s.prompt} rows={5} maxLength={240000}
    value={jsonInput} onChange={e=>{setJsonInput(e.target.value);setPreview(null);setCourseSaved(false);}}
    placeholder={'{"schemaVersion":"0.1","title":"…","sourceRefs":[],"chapters":[…]}'}/>
   <div className={s.actions}>
    <button type="button" disabled={!jsonInput.trim()} onClick={()=>reviewDraft(jsonInput)}>校验课程格式</button>
    <button type="button" className={s.primary} disabled={!preview||saving||demo||courseSaved}
     onClick={()=>void saveCourse()}>{saving?"正在保存…":courseSaved?"已保存":"确认保存私人课程"}</button>
    <Link href="/coursepacks" className={s.actionLink}>打开课程学习界面 ↗</Link>
   </div>
   {preview&&<div className={s.coursePreview}>
    <strong>{preview.title}</strong>
    <span>{preview.chapters.length} 章 · {preview.chapters.reduce((n,c)=>n+c.blocks.length,0)} 学习块 · {preview.sourceRefs.length} 条来源</span>
    <p>结构校验通过不代表内容或答案正确，请在正式学习前核对关键公式、题目答案和来源。</p>
   </div>}
   {demo&&<p className={s.muted}>公开演示不会保存私人课程；请登录正式学习中心使用。</p>}
  </div>

  <details className={s.panel}>
   <summary>05 · 当前 ChatGPT 会话达到上限？生成续接文件</summary>
   <p>先在旧会话让 GPT 总结已完成的章节和关键决策，再填入这里。续接包不会自动读取旧会话。</p>
   <div className={s.continuation}>
    <label htmlFor="gpt-completed">已完成内容</label>
    <textarea id="gpt-completed" rows={2} maxLength={2200} value={completed} onChange={e=>setCompleted(e.target.value)}
     placeholder="例如：章节1–3已经生成，已确认第2章练习答案。"/>
    <label htmlFor="gpt-remaining">剩余工作</label>
    <textarea id="gpt-remaining" rows={2} maxLength={2200} value={remaining} onChange={e=>setRemaining(e.target.value)}
     placeholder="例如：完成章节4–5，检查来源定位，再导出 JSON。"/>
    <label htmlFor="gpt-decisions">已确认决策</label>
    <textarea id="gpt-decisions" rows={2} maxLength={2200} value={decisions} onChange={e=>setDecisions(e.target.value)}
     placeholder="例如：只使用有依据的计算题，不生成栈模拟器。"/>
   </div>
   <div className={s.actions}>
    <button type="button" disabled={!handoff} onClick={exportContinuation}>下载续接提示 .md ↓</button>
    <button type="button" disabled={!handoff}
     onClick={()=>void copy(continuation,"续接提示已复制，请在同一 ChatGPT 项目的新会话使用。")}>复制续接提示</button>
    {projectUrl&&<button type="button" onClick={()=>chatOpen(projectUrl)}>进入原 ChatGPT 项目 ↗</button>}
   </div>
   <p className={s.muted}>建议新聊天继续在原项目内；上传最新的交接包、原课件和已生成 CoursePack，避免旧聊天上下文丢失。</p>
  </details>
  {err&&<div className={s.error} role="alert">{err}</div>}
  {status&&<div className={s.status} role="status">{status}</div>}
 </section>;
}
