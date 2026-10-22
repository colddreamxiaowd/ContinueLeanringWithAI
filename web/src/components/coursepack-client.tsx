"use client";
import {useEffect,useState} from "react";
import style from "./coursepack.module.css";
import {validateCoursePack} from "@/lib/coursepack.mjs";

type SourceRef={id:string;fileName:string;locator:string};
type Block={id:string;type:"explanation"|"quiz"|"code"|"stack-simulator";
  markdown?:string;language?:string;source?:string;prompt?:string;options?:string[];
  answerIndex?:number;hint?:string;initial?:number[];capacity?:number;sourceRefIds?:string[]};
type Pack={schemaVersion:string;title:string;description:string;version:number;
  sourceRefs:SourceRef[];chapters:Array<{id:string;title:string;blocks:Block[]}>};
type SavedCourse={id:string;title:string;pack_version:number;pack:Pack;created_at:string};
type Progress={completedBlockIds:string[];answers:Record<string,number>;simStacks:Record<string,number[]>};
const emptyProgress=():Progress=>({completedBlockIds:[],answers:{},simStacks:{}});
const sample:Pack={
  schemaVersion:"0.1",title:"数据结构 · 栈（演示）",
  description:"本演示课程不来自真实飞书资料；正式课程请从已授权资料生成 CoursePack。",
  version:1,sourceRefs:[{id:"demo-slide-12",fileName:"合成示例讲义.pptx",locator:"第12页"}],
  chapters:[{id:"stack",title:"栈的基本操作",blocks:[
    {id:"concept",type:"explanation",markdown:"栈是一种后进先出（LIFO）的数据结构。push 把元素放到栈顶；pop 只弹出栈顶。",sourceRefIds:["demo-slide-12"]},
    {id:"demo-code",type:"code",language:"python",source:"stack = [3, 7]\\nstack.append(12)\\nprint(stack.pop())  # 12"},
    {id:"stack-lab",type:"stack-simulator",initial:[3,7,12],capacity:6},
    {id:"check",type:"quiz",prompt:"依次 push(3)、push(7)、push(12)，第一次 pop() 得到什么？",options:["3","7","12"],answerIndex:2,hint:"pop 总是取走当前栈顶。"}
  ]}]};
export function CoursePackClient(){
  const [courses,setCourses]=useState<SavedCourse[]>([]);
  const [active,setActive]=useState<SavedCourse|null>(null);
  const [draft,setDraft]=useState("");
  const [preview,setPreview]=useState<Pack|null>(null);
  const [progress,setProgress]=useState<Progress>(emptyProgress);
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{void loadCourses();},[]);
  async function loadCourses(){
    try{
      const res=await fetch("/api/coursepacks",{cache:"no-store"});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"课程加载失败");
      const list=Array.isArray(data.courses)?data.courses as SavedCourse[]:[];
      setCourses(list);
    }catch(err){setStatus(err instanceof Error?err.message:"课程加载失败");}
  }
  async function choose(course:SavedCourse) {
    setPreview(null);setActive(course);setProgress(emptyProgress);setStatus("");
    try {
      const r=await fetch("/api/coursepacks/"+encodeURIComponent(course.id)+"/progress");
      const d=await r.json();
      if(r.ok && d.state && Array.isArray(d.state.completedBlockIds))setProgress(d.state as Progress);
    }catch{setStatus("暂时无法读取已保存进度");}
  }
  function previewDraft(){
    try{
      const parsed=JSON.parse(draft) as Pack;
      const verdict=validateCoursePack(parsed);
      if(!verdict.ok) throw new Error(verdict.errors.join("；"));
      setPreview(parsed);setActive(null);setProgress(emptyProgress());
      setStatus("已在浏览器预览。点击保存后由服务器校验格式，并以私人课程存储。");
    }catch(err){setPreview(null);setStatus("JSON 解析失败："+String(err));}
  }
  async function saveCourse(){
    if(!preview)return;
    setBusy(true);setStatus("正在校验并保存私人课程…");
    try{
      const r=await fetch("/api/coursepacks",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pack:preview})
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.details?.join("；")||d.error||"保存失败");
      await loadCourses();setStatus("私人课程已保存。点击左侧课程以继续学习。");setPreview(null);setDraft("");
    }catch(err){setStatus("保存失败："+String(err));}
    finally{setBusy(false);}
  }
  async function commit(next:Progress){
    setProgress(next);
    if(!active)return;
    try{
      const r=await fetch("/api/coursepacks/"+encodeURIComponent(active.id)+"/progress",{
        method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)
      });
      setStatus(r.ok?"学习记录已保存": "记录暂未保存，请重试操作");
    }catch{setStatus("网络异常，学习记录未保存");}
  }
  const pack=preview||(active?.pack??null);
  const count=pack?.chapters.reduce((n,c)=>n+c.blocks.length,0)??0;
  const complete=progress.completedBlockIds.length;
  function markBlock(id:string){if(!progress.completedBlockIds.includes(id))
    void commit({...progress,completedBlockIds:[...progress.completedBlockIds,id]});}
  function answer(block:Block,index:number){
    const next={...progress,answers:{...progress.answers,[block.id]:index},
      completedBlockIds:progress.completedBlockIds.includes(block.id)?progress.completedBlockIds:[...progress.completedBlockIds,block.id]};
    if(preview)setProgress(next);else void commit(next);
  }
  function doStack(block:Block,mode:"push"|"pop"|"reset"){
    const arr=[...(progress.simStacks[block.id]||block.initial||[])];
    if(mode==="push"){if(arr.length>=(block.capacity||6))return setStatus("栈已满");arr.push((arr[arr.length-1]||0)+5);}
    if(mode==="pop"){if(!arr.length)return setStatus("栈已空");arr.pop();}
    if(mode==="reset")arr.splice(0,arr.length,...(block.initial||[]));
    if(preview) return setProgress({...progress,simStacks:{...progress.simStacks,[block.id]:arr}});
    void commit({...progress,simStacks:{...progress.simStacks,[block.id]:arr}});
  }
  return <div className={style.root}>
    <header className={style.hero}><div><div className={style.kicker}>COURSEPACK v0.1 · PRIVATE BY DEFAULT</div>
      <h1>把资料变成真正能学习的课程</h1>
      <p>导入结构化 CoursePack → 预览 → 私人保存 → 动手操作、答题并保存学习记录。</p></div>
      <span className={style.privacy}>🔒 原始飞书文件不会随课程公开</span></header>
    <div className={style.columns}>
      <aside className={style.side}>
        <h2>我的私人课程 <span>{courses.length}</span></h2>
        {courses.map(course=><button type="button" key={course.id} onClick={()=>void choose(course)} className={active?.id===course.id?style.selected:style.course}>
          <strong>{course.title}</strong><small>v{course.pack_version} · {new Date(course.created_at).toLocaleDateString("zh-CN")}</small>
        </button>)}
        {!courses.length&&<p className={style.muted}>暂时没有导入的课程。你可以先体验下面的合成示例。</p>}
        <h2>导入课程包</h2>
        <p className={style.muted}>支持从 Qoder + ChatGPT 生成的 JSON，也可选择本地 JSON 文件。</p>
        <label className={style.filelabel}>选择 JSON 文件 <input type="file" accept=".json,application/json" onChange={e=>{
          const f=e.target.files?.[0];if(f)void f.text().then(setDraft);}}/></label>
        <textarea className={style.editor} aria-label="CoursePack JSON" rows={8} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="粘贴 CoursePack v0.1 JSON …"/>
        <div className={style.buttons}>
          <button type="button" onClick={()=>setDraft(JSON.stringify(sample,null,2))}>载入合成示例</button>
          <button type="button" disabled={!draft.trim()} onClick={previewDraft}>预览</button>
          <button type="button" className={style.primary} disabled={!preview||busy} onClick={()=>void saveCourse()}>保存私人课程</button>
        </div>
      </aside>
      <main className={style.main}>
        {status&&<div className={style.notice} role="status">{status}</div>}
        {!pack&&<div className={style.empty}><span>◇</span><h2>从你的飞书资料开始</h2>
          <p>导入合法的 CoursePack JSON，或点击左侧「载入合成示例」体验栈的操作与练习。</p></div>}
        {pack&&<div>
          <div className={style.lessonHead}><span>{preview?"尚未保存 · 本地预览":"已保存 · 私人课程"}</span>
            <h2>{pack.title}</h2><p>{pack.description}</p>
            <div className={style.bar}><span style={{width:count?Math.min(100,complete/count*100)+"%":"0%"}}/></div>
            <small>已完成 {complete} / {count} 个学习块 {preview?"· 预览不会保存":"· 记录保存在当前账号"}</small>
          </div>
          {pack.chapters.map((chapter,index)=><section key={chapter.id}>
            <h3 className={style.chapter}>第 {index+1} 章 · {chapter.title}</h3>
            <div className={style.blockgrid}>{chapter.blocks.map(block=><article className={style.block} key={block.id}>
              <div className={style.blocktitle}><strong>{block.type==="explanation"?"概念讲解":block.type==="quiz"?"理解检测":block.type==="code"?"源码阅读":"栈的交互实验"}</strong><small>{progress.completedBlockIds.includes(block.id)?"✓ 已完成":block.type}</small></div>
              {block.type==="explanation"&&<><p className={style.explanation}>{block.markdown}</p>
                <button type="button" onClick={()=>markBlock(block.id)}>标记已阅读</button></>}
              {block.type==="code"&&<><div className={style.codehead}>{block.language} · 阅读模式（代码不会执行）</div><pre>{block.source}</pre>
                <button type="button" onClick={()=>markBlock(block.id)}>标记已理解</button></>}
              {block.type==="quiz"&&<><p>{block.prompt}</p><div className={style.options}>
                {block.options?.map((option,i)=><button type="button" key={i} onClick={()=>answer(block,i)}
                  className={progress.answers[block.id]===i?style.chosen:""}>{String.fromCharCode(65+i)}. {option}</button>)}</div>
                {progress.answers[block.id]!==undefined&&<p className={style.feedback}>{progress.answers[block.id]===block.answerIndex?
                  "✓ 回答正确。":"回答未正确，可以调整答案再试。"} {block.hint||""}</p>}</>}
              {block.type==="stack-simulator"&&<><p>亲手执行 push / pop，观察栈顶变化。</p>
                <div className={style.stack}><span>TOP →</span><div>{(progress.simStacks[block.id]||block.initial||[]).map((n,i)=><b key={i}>{n}</b>)}</div></div>
                <div className={style.buttons}><button type="button" onClick={()=>doStack(block,"push")}>＋ Push</button>
                  <button type="button" onClick={()=>doStack(block,"pop")}>－ Pop</button>
                  <button type="button" onClick={()=>doStack(block,"reset")}>重置</button>
                  <button type="button" onClick={()=>markBlock(block.id)}>完成实验</button></div></>}
              {!!block.sourceRefIds?.length&&<div className={style.sources}>来源：{block.sourceRefIds.map(refId=>{
                const ref=pack.sourceRefs.find(x=>x.id===refId);
                return ref?<span key={refId}>{ref.fileName} · {ref.locator}</span>:null;})}</div>}
            </article>)}</div>
          </section>)}
        </div>}
      </main>
    </div>
  </div>;
}
