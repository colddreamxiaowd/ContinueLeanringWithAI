"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {demoPlanBundle,taskFor,normalizeMastery,upgradeMastery,MASTERY_LEVELS,MODE_NAMES} from "@/lib/course-plan-view.mjs";
import s from "./course-plan-studio.module.css";
import ChatGptCourseHandoff from "./ChatGptCourseHandoff";

type Mode="deep"|"faithful"|"exam";
type Level=0|1|2;
type Topic={id:string;title:string;excerpt:string;sourceRefId:string;
  locator:{kind:string;value:string;label:string;verified:boolean};
  extractionStatus:string;warnings:string[]};
type Plan={id:Mode;title:string;purpose:string;stages:string[]};
type Bundle={schemaVersion:string;plannerVersion:string;
 source:{libraryItemId:string;fileName:string;sha256:string;synthetic:boolean;limited:boolean;
   totalSections:number;includedSections:number};
 topics:Topic[];plans:Record<Mode,Plan>};
type Family={id:string;source_name:string;source_sha256:string;planner_version?:string;created_at:string};
type FileItem={id:string;name:string;item_type:string;relative_path:string};
type Result<T>={error?:string}&T;
const sample=demoPlanBundle() as Bundle;
const demoKey="zhixu_three_modes_synthetic_mastery_v1";
const modes:Mode[]=["deep","faithful","exam"];
const labels:Record<Mode,string>={deep:"B · 深度理解",faithful:"A · 课件忠实",exam:"C · 纯应试"};
const errors:Record<string,string>={
 AUTH_REQUIRED:"请先登录知序账号。",FEISHU_NOT_CONNECTED:"请先在资料库连接飞书。",
 FEISHU_REAUTH_REQUIRED:"飞书授权已失效，请重新连接。",
 FEISHU_PERMISSION_DENIED:"当前飞书账号无权读取这份资料。",
 OFFICE_SIZE_UNSUPPORTED:"Office 文件超过 15 MiB 网页解析上限。",
 SOURCE_NO_LEARNABLE_TEXT:"这份文件没有可用文本，可能主要是扫描图或复杂图表。",
 PLAN_NOT_FOUND:"这份课程方案不存在，或当前账号无访问权。",
 COURSE_PLANS_UNAVAILABLE:"课程方案数据库尚未配置，请执行最新 Supabase migration。",
 COURSE_PLAN_GENERATION_FAILED:"课程生成未成功，请检查数据库 migration 与飞书连接。",
 MASTERY_WRITE_FAILED:"掌握记录保存未成功，尚未确认同步到账号。",
};
const friendly=(value:string)=>errors[value]||value;

export default function CoursePlanStudio({demo=false,ownerId=""}:{demo?:boolean;ownerId?:string}){
 const [families,setFamilies]=useState<Family[]>([]);
 const [library,setLibrary]=useState<FileItem[]>([]);
 const [selectedFile,setSelectedFile]=useState("");
 const [familyId,setFamilyId]=useState("");
 const [bundle,setBundle]=useState<Bundle|null>(demo?sample:null);
 const [mastery,setMastery]=useState<Record<string,number>>({});
 const [mode,setMode]=useState<Mode>("deep");
 const [topicId,setTopicId]=useState("");
 const [expanded,setExpanded]=useState(false);
 const [attempt,setAttempt]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [ready,setReady]=useState(demo);
 const [saveBusy,setSaveBusy]=useState(false);
 const storageKey=demoKey;
 useEffect(()=>{
  if(!demo)return;
  try{
   const stored=localStorage.getItem(storageKey);
   if(stored){const raw=JSON.parse(stored);
    if(raw&&typeof raw==="object"){
     const rows=Object.entries(raw).map(([concept_id,level])=>({concept_id,level}));
     setMastery(normalizeMastery(rows,sample.topics) as Record<string,number>);
    }}
  }catch{}
  setTopicId(sample.topics[0].id);
 },[demo,storageKey]);
 useEffect(()=>{
  if(demo)return;
  let alive=true;
  (async()=>{
   try{
    const [plans,items]=await Promise.all([
      fetch("/api/course-plans",{cache:"no-store"}),fetch("/api/library/items",{cache:"no-store"})
    ]);
    const p=await plans.json() as Result<{families?:Family[]}>;
    const x=await items.json() as Result<{items?:FileItem[]}>;
    if(!alive)return;
    if(plans.ok)setFamilies(Array.isArray(p.families)?p.families:[]);
    else setError(friendly(p.error||"COURSE_PLANS_UNAVAILABLE"));
    if(items.ok)setLibrary((Array.isArray(x.items)?x.items:[]).filter(item=>
     item.item_type==="file"&&/\.(pptx|docx|xlsx)$/i.test(item.name)));
    else setNotice("资料索引尚未就绪：请先连接飞书并同步 Office 文件。");
   }catch{if(alive)setError("无法连接私人课程或资料接口。");}
   finally{if(alive)setReady(true);}
  })();
  return ()=>{alive=false;};
 },[demo,ownerId]);
 async function openFamily(id:string){
  setBusy(true);setError("");setNotice("");setExpanded(false);setAttempt("");
  try{
   const response=await fetch("/api/course-plans/"+encodeURIComponent(id),{cache:"no-store"});
   const data=await response.json() as Result<{family?:{id:string;bundle:Bundle};
    mastery?:Array<{concept_id:string;level:number}>}>;
   if(!response.ok||!data.family?.bundle)throw Error(data.error||"PLAN_READ_FAILED");
   setFamilyId(data.family.id);setBundle(data.family.bundle);
   setMastery(normalizeMastery(data.mastery,data.family.bundle.topics) as Record<string,number>);
   setTopicId(data.family.bundle.topics[0]?.id||"");
   setMode("deep");
  }catch(err){setError(friendly(err instanceof Error?err.message:"PLAN_READ_FAILED"));}
  finally{setBusy(false);}
 }
 async function generate(){
  if(!selectedFile)return;
  setBusy(true);setError("");setNotice("正在从当前账号已授权的飞书原件提取内容并生成三种教学方案…");
  try{
   const response=await fetch("/api/course-plans",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({libraryItemId:selectedFile})});
   const data=await response.json() as Result<{id?:string;topics?:number;sourceLimited?:boolean}>;
   if(!response.ok||!data.id)throw Error(data.error||"COURSE_PLAN_GENERATION_FAILED");
   const row=await fetch("/api/course-plans",{cache:"no-store"});
   if(row.ok){const result=await row.json() as {families?:Family[]};setFamilies(result.families||[]);}
   await openFamily(data.id);
   setNotice("已从同一份资料生成三种课程方案（共 "+data.topics+" 个知识点）。"+
    (data.sourceLimited?" 本次仅纳入部分文字，请检查资料提取警告。":""));
  }catch(err){setNotice("");setError(friendly(err instanceof Error?err.message:"COURSE_PLAN_GENERATION_FAILED"));}
  finally{setBusy(false);}
 }
 async function mark(level:1|2){
  const concept=topic;
  if(!concept||saveBusy)return;
  setSaveBusy(true);setError("");
  try{
   if(demo){
    const next=upgradeMastery(mastery,concept.id,level);
    localStorage.setItem(storageKey,JSON.stringify(next));
    setMastery(next);setNotice("合成演示：掌握状态已保存在本浏览器，切换模式后仍共享。");
   }else{
    const response=await fetch("/api/course-plans/"+familyId+"/mastery",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({conceptId:concept.id,level})
    });
    const data=await response.json() as Result<{saved?:boolean;level?:number}>;
    if(!response.ok||!data.saved||![1,2].includes(data.level||0))
     throw Error(data.error||"MASTERY_WRITE_FAILED");
    setMastery(previous=>upgradeMastery(previous,concept.id,data.level as 1|2));
    setNotice("已由服务器确认保存。这条知识点掌握记录会在三种教学模式中共享。");
   }
  }catch(err){setError(friendly(err instanceof Error?err.message:"MASTERY_WRITE_FAILED"));}
  finally{setSaveBusy(false);}
 }
 function changeTopic(id:string){setTopicId(id);setExpanded(false);setAttempt("");}
 const current=bundle;
 const topic=current?.topics.find(t=>t.id===topicId)??current?.topics[0];
 const task=topic?taskFor(topic,mode):null;
 const levels=current?.topics.map(t=>mastery[t.id]||0)??[];
 const understand=levels.filter(x=>x>=2).length;
 const touched=levels.filter(x=>x>=1).length;
 const nav=demo?[
  {id:"home" as const,label:"演示首页",href:"/ui-lab/integrated/home",icon:"home" as const},
  {id:"courses" as const,label:"三种制课方案",href:"/ui-lab/plan-modes",icon:"courses" as const}
 ]:[
  {id:"home" as const,label:"我的课程",href:"/learn",icon:"home" as const},
  {id:"courses" as const,label:"三模式制课",href:"/learn/plans",icon:"courses" as const},
  {id:"reader" as const,label:"飞书资料",href:"/library",icon:"docs" as const}
 ];
 return <ShellIntegrationFrame surface="courses" navigation={nav} presentation="app"
   crumbs={[{label:"学习中心",href:demo?"/ui-lab/integrated/home":"/learn"},{label:"一份资料 · 三种课程"}]}>
  <main className={s.root} data-plan-studio="true" data-plan-mode={mode}>
   <header className={s.hero}>
    <div><span className={s.eyebrow}>ZHIXU · COURSE STUDIO · G3</span>
     <h2>一份资料，三种学习方式。</h2>
     <p>知识点只建立一次，深度理解、课件忠实和纯应试共享同一份个人掌握记录。</p>
    </div><span className={s.heroTag}>{demo?"合成资料演示":"当前账号 · 私人学习"}</span>
   </header>
   {demo?<p className={s.info}>公开合成演示：未接入真实飞书，掌握状态仅存本浏览器。登录后可使用私人 Office 资料创建课程。</p>:
    <section className={s.source} aria-label="创建真实课程方案">
     <div><span className={s.eyebrow}>01 · SOURCE</span><h3>从已授权资料创建三模式课程</h3>
      <p>读取选定 PPTX、DOCX 或 XLSX，使用同一份来源文本建立知识点，再生成三种教学安排。</p></div>
     <div className={s.create}>
      <label htmlFor="course-source-file">选择私人飞书资料</label>
      <select id="course-source-file" value={selectedFile} onChange={e=>setSelectedFile(e.target.value)}>
       <option value="">请选择已经同步的 Office 文件</option>
       {library.map(file=><option key={file.id} value={file.id}>{file.relative_path||file.name}</option>)}
      </select>
      <button type="button" disabled={!selectedFile||busy} onClick={()=>void generate()}>
       {busy?"正在处理…":"从这份资料生成三套课程 →"}
      </button>
      {!library.length&&<p>当前没有可选 Office 文件。请先进入 <Link href="/library">飞书资料库</Link> 授权并同步文件夹。</p>}
     </div>
     {!!families.length&&<div className={s.families}><strong>已有私人课程族</strong>
      <div>{families.map(row=><button type="button" key={row.id} disabled={busy}
        aria-pressed={familyId===row.id} onClick={()=>void openFamily(row.id)}>{row.source_name}
        <small> · {new Date(row.created_at).toLocaleDateString("zh-CN")}</small></button>)}</div></div>}
    </section>}
   {!ready&&<p role="status">正在读取你的私人学习资料和已有课程…</p>}
   {error&&<div className={s.error} role="alert">{error}</div>}
   {notice&&<div className={s.info} role="status">{notice}</div>}
   {current&&<div className={s.layout}>
    <aside className={s.left}>
     <span className={s.eyebrow}>02 · KNOWLEDGE BASE</span>
     <h3>{current.source.fileName}</h3>
     <p className={s.muted}>来源版本指纹：{current.source.sha256.slice(0,12)}…</p>
     <div className={s.stats}>
      <div><strong>{current.topics.length}</strong><span>知识点</span></div>
      <div><strong>{touched}</strong><span>已学习</span></div>
      <div><strong>{understand}</strong><span>自评会了</span></div>
     </div>
     <div className={s.concepts} role="group" aria-label="知识点目录">
      {current.topics.map((t,i)=><button type="button" key={t.id}
       aria-pressed={topic?.id===t.id} onClick={()=>changeTopic(t.id)}>
       <span>{String(i+1).padStart(2,"0")}</span><strong>{t.title}</strong>
       <small>{MASTERY_LEVELS[mastery[t.id]||0]}</small>
      </button>)}
     </div>
    </aside>
    <section className={s.main}>
     <span className={s.eyebrow}>03 · TEACHING STRATEGY</span>
     <div className={s.modes} role="group" aria-label="切换教学模式">
      {modes.map(value=><button type="button" key={value} aria-pressed={value===mode}
       className={value===mode?s.active:""} onClick={()=>{setMode(value);setExpanded(false);}}>
       {labels[value]}</button>)}
     </div>
     <div className={s.planIntro}><strong>{MODE_NAMES[mode]}</strong><p>{current.plans[mode].purpose}</p>
      <div className={s.stageLabels}>{current.plans[mode].stages.map((value,i)=>
       <span key={value}>{i+1}. {value}</span>)}</div></div>
     {topic&&task&&<article className={s.workbench}>
      <div className={s.topicHeading}><span className={s.eyebrow}>KNOWLEDGE POINT</span>
       <h3>{topic.title}</h3>
       <span className={s.level}>{MASTERY_LEVELS[mastery[topic.id]||0]}</span>
      </div>
      <p className={s.prompt}>{task.prompt}</p>
      <p className={s.muted}>建议用时：{task.suggestedMinutes} 分钟 · {task.reflection}</p>
      <label className={s.answerLabel} htmlFor="study-thinking">先尝试复述或写出答案（当前页面草稿）</label>
      <textarea id="study-thinking" rows={4} value={attempt} onChange={e=>setAttempt(e.target.value.slice(0,4000))}
       placeholder="这里可以先尝试推导、回忆老师的原话或练习考试答题。"/>
      <button type="button" className={s.reveal} aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>
       {expanded?"收起资料原文":"展开资料原文并核对 →"}
      </button>
      {expanded&&<div className={s.sourceExcerpt}>
       <strong>原件摘录 · {topic.locator.label||topic.locator.value}</strong>
       <p>{topic.excerpt}</p>
       <small>{topic.locator.verified?"来源位置已按原件关系解析":
        "来源定位尚未核验，不得当成精确页码。"}</small>
       {!!topic.warnings.length&&<ul>{topic.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul>}
      </div>}
      <div className={s.marks}>
       <button type="button" disabled={saveBusy} onClick={()=>void mark(1)}>
        <span>完成阅读或练习</span><small>仅记录学习行为</small>
       </button>
       <button type="button" disabled={saveBusy} onClick={()=>void mark(2)}>
        <span>自评：我能独立复述</span><small>不等于客观测验通过</small>
       </button>
      </div>
      <p className={s.footer}>掌握记录以知识点为单位，同一资料的三种模式共用。原件修订后会形成独立课程版本，避免旧掌握记录误套到新内容。</p>
     </article>}
    </section>
   </div>}
   {current&&<ChatGptCourseHandoff bundle={current} familyId={familyId} mastery={mastery}
    mode={mode} demo={demo}/>}
   {!demo&&!current&&ready&&!busy&&<p className={s.empty}>选择一份已同步的 Office 文件并点击生成，或打开已有的私人课程方案。</p>}
  </main>
 </ShellIntegrationFrame>;
}
