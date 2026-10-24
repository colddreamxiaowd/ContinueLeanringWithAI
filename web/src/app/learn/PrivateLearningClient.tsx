"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {CourseProgressCard,SourceFileCard} from "@/design/pixel-pop/workstreams/dashboard";
import type {ProgressChapter,DashboardSourceFile} from "@/design/pixel-pop/workstreams/dashboard";
import {ChapterOutline,LessonContent,SourceCitation,adaptCoursePackV01} from "@/design/pixel-pop/workstreams/reader";
import type {LessonData,OutlineChapter,CitationRecord} from "@/design/pixel-pop/workstreams/reader";
import {QuizCard,StackPlayground} from "@/design/pixel-pop/workstreams/learning";
import {ownCourseRows,emptyCourseProgress,courseView,markReadingComplete} from "@/lib/private-course-view.mjs";
import s from "./private-learning.module.css";
import readerStyles from "@/design/pixel-pop/workstreams/reader/reader.module.css";

type Block={id:string;type:"explanation"|"code"|"quiz"|"stack-simulator";markdown?:string;
  language?:string;source?:string;prompt?:string;options?:string[];answerIndex?:number;hint?:string;
  initial?:number[];capacity?:number;sourceRefIds?:string[]};
type Pack={schemaVersion:string;title:string;description:string;version:number;
  sourceRefs:{id:string;fileName:string;locator:string}[];
  chapters:{id:string;title:string;blocks:Block[]}[]};
type Course={id:string;title:string;pack_version:number;pack:Pack;created_at:string};
type Progress={completedBlockIds:string[];answers:Record<string,number>;simStacks:Record<string,number[]>};
const nav=[
  {id:"home" as const,label:"我的私人课程",href:"/learn",icon:"home" as const},
  {id:"courses" as const,label:"导入课程",href:"/coursepacks",icon:"courses" as const},
  {id:"reader" as const,label:"飞书资料库",href:"/library",icon:"courses" as const},
];
const empty=():Progress=>emptyCourseProgress() as Progress;

export default function PrivateLearningClient(){
  const [courses,setCourses]=useState<Course[]>([]);
  const [selected,setSelected]=useState<Course|null>(null);
  const [chapterId,setChapterId]=useState("");
  const [sectionId,setSectionId]=useState("");
  const [citationId,setCitationId]=useState<string|null>(null);
  const [progress,setProgress]=useState<Progress|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [saveMessage,setSaveMessage]=useState("");
  const [showMobileOutline,setShowMobileOutline]=useState(false);
  const [showMobileSources,setShowMobileSources]=useState(false);
  const seq=useRef(0);
  const selectedId=useRef("");
  const progressRef=useRef<Progress>(empty());
  const writes=useRef<Promise<void>>(Promise.resolve());
  const latestWrite=useRef(0);

  useEffect(()=>{
    let mounted=true;
    async function load(){
      try{
        const response=await fetch("/api/coursepacks",{cache:"no-store"});
        if(response.status===401){window.location.assign("/login?next=%2Flearn");return;}
        if(!response.ok)throw new Error("私人课程列表暂时不可用，请重试。");
        const data=await response.json();
        if(!mounted)return;
        setCourses(ownCourseRows(data.courses) as Course[]);
      }catch(err){if(mounted)setError(err instanceof Error?err.message:"课程读取失败");}
      finally{if(mounted)setLoading(false);}
    }
    void load();
    return ()=>{mounted=false;seq.current++;};
  },[]);

  async function openCourse(course:Course){
    const requestId=++seq.current;
    selectedId.current=course.id;
    setSelected(course);setProgress(null);setChapterId("");setSectionId("");setCitationId(null);
    setError("");setSaveMessage("");setShowMobileOutline(false);setShowMobileSources(false);
    try{
      // Finish queued writes for the previous course before changing its displayed state.
      await writes.current.catch(()=>{});
      const response=await fetch("/api/coursepacks/"+encodeURIComponent(course.id)+"/progress",{cache:"no-store"});
      if(response.status===401){window.location.assign("/login?next=%2Flearn");return;}
      if(response.status===404)throw new Error("该课程不存在或当前账号没有访问权限。");
      if(!response.ok)throw new Error("进度读取失败；尚未加载课程学习区。");
      const data=await response.json();
      if(requestId!==seq.current)return;
      const loaded:Progress={
        completedBlockIds:Array.isArray(data.state?.completedBlockIds)?data.state.completedBlockIds:[],
        answers:data.state?.answers&&typeof data.state.answers==="object"?data.state.answers:{},
        simStacks:data.state?.simStacks&&typeof data.state.simStacks==="object"?data.state.simStacks:{},
      };
      progressRef.current=loaded;setProgress(loaded);
      const view=courseView(course.pack,loaded);
      setChapterId(view.chapterId);
    }catch(err){if(requestId===seq.current)setError(err instanceof Error?err.message:"进度读取失败");}
  }

  /** One serialized PUT queue per client: adjacent quiz/stack events cannot overwrite earlier updates. */
  function saveProgress(updater:(prev:Progress)=>Progress|null){
    if(!selected||!progress)return;
    const next=updater(progressRef.current);
    if(!next)return;
    const id=selected.id;
    const revision=++latestWrite.current;
    progressRef.current=next;setProgress(next);setSaveMessage("正在保存学习记录…");
    writes.current=writes.current.catch(()=>{}).then(async()=>{
      const response=await fetch("/api/coursepacks/"+encodeURIComponent(id)+"/progress",{
        method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(next),
      });
      if(!response.ok)throw new Error("PROGRESS_SAVE_FAILED");
    }).then(()=>{
      if(selectedId.current===id&&revision===latestWrite.current)setSaveMessage("学习记录已保存到当前账号");
    }).catch(()=>{
      if(selectedId.current===id&&revision===latestWrite.current)setSaveMessage("保存失败：当前页面的变化尚未确认落库，请刷新后重试。");
    });
  }

  function jump(id:string,pack:Pack){
    const found=pack.chapters.find(ch=>ch.blocks.some(block=>block.id===id));
    if(!found)return;
    setChapterId(found.id);setSectionId(id);setShowMobileOutline(false);
  }
  useEffect(()=>{
    if(!sectionId)return;
    const frame=requestAnimationFrame(()=>{
      const node=document.getElementById(sectionId);
      if(node){node.scrollIntoView({block:"start"});node.focus({preventScroll:true});}
    });
    return ()=>cancelAnimationFrame(frame);
  },[chapterId,sectionId]);

  const pack=selected?.pack;
  const view=pack&&progress?courseView(pack,progress,chapterId):null;
  const chapter=pack?.chapters.find(ch=>ch.id===view?.chapterId);
  const adapted=pack&&view?adaptCoursePackV01(pack,{
    chapterId:view.chapterId,completedBlockIds:view.completedBlockIds,activeBlockId:sectionId||undefined,mode:"private"
  }):null;
  const sources:DashboardSourceFile[]=pack?.sourceRefs.map(ref=>({
    id:ref.id,name:ref.fileName,subtitle:ref.locator+" · 仅为课程来源线索，未核对飞书权限",
    kind:/\.pptx$/i.test(ref.fileName)?"pptx":/\.pdf$/i.test(ref.fileName)?"pdf":
      /\.(md|txt)$/i.test(ref.fileName)?"markdown":"other",
    outcome:"none" as const,syncState:"not-synced" as const
  }))??[];
  const completed=new Set(view?.completedBlockIds??[]);

  return <ShellIntegrationFrame surface="home" navigation={nav}
    crumbs={[{label:"知序学习中心",href:"/learn"},{label:"私人课程"}]} presentation="app">
    <div className={s.page} data-private-course-page="true">
      <div className={s.banner}><strong>PRIVATE LEARNING · 账号专属</strong>
        <span>内容从 /api/coursepacks 获取；不使用合成演示样例</span></div>
      <div className={s.toolbar}>
        <label htmlFor="private-course-select">选择已保存的私人课程</label>
        <select id="private-course-select" value={selected?.id??""}
          onChange={event=>{const course=courses.find(c=>c.id===event.target.value);if(course)void openCourse(course);}}>
          <option value="">请选择课程</option>
          {courses.map(course=><option value={course.id} key={course.id}>{course.title}</option>)}
        </select>
        <Link href="/coursepacks" className={s.action}>导入 CoursePack JSON →</Link>
        <Link href="/learn/math" className={s.action}>条件概率深度实践（合成教学试点） →</Link>
      </div>
      {loading&&<p role="status" className={s.notice}>正在从私人课程接口读取课程…</p>}
      {!loading&&!courses.length&&!error&&<div className={s.empty}>
        <h2>还没有已保存的私人课程</h2>
        <p>请先到课程导入页，导入或载入合成示例并点击「保存私人课程」。这里只显示真正写入后端的课程。</p>
        <Link href="/coursepacks" className={s.action}>前往私人课程导入 →</Link>
      </div>}
      {error&&<p role="alert" className={s.error}>{error}</p>}
      {!loading&&courses.length>0&&!selected&&<div className={s.empty}>
        <h2>从自己的课程继续学习</h2><p>选中上方课程，系统会先读取该课程的服务器进度。</p>
      </div>}
      {selected&&!progress&&!error&&<p role="status" className={s.notice}>正在读取该课程在服务器保存的进度…</p>}
      {pack&&progress&&view&&chapter&&adapted&&<>
        <header className={s.courseHeader}>
          <div><small>已保存 · 当前登录账号私人课程</small><h2>{pack.title}</h2><p>{pack.description}</p></div>
          <span>{view.completeCount} / {view.totalCount} 学习块</span>
        </header>
        <div className={s.overview}>
          <CourseProgressCard title="当前课程进度" progressPercent={view.progressPercent}
            chapters={view.chapters as ProgressChapter[]}
            onOpenChapter={id=>{setChapterId(id);setSectionId("");}}
            onContinue={()=>{setChapterId(view.chapterId);setSectionId("");}}
            onViewAll={()=>document.getElementById("private-course-reader")?.scrollIntoView()}/>
          <SourceFileCard title="课程来源线索" files={sources} onViewAll={()=>window.location.assign("/library")}/>
        </div>
        <div className={s.chapterControls}>
          <label htmlFor="private-chapter-select">阅读章节</label>
          <select id="private-chapter-select" value={view.chapterId} onChange={e=>{setChapterId(e.target.value);setSectionId("");setCitationId(null);}}>
            {pack.chapters.map((ch,i)=><option key={ch.id} value={ch.id}>{i+1}. {ch.title}</option>)}
          </select>
        </div>
        <section id="private-course-reader" aria-label="私人课程阅读" className={readerStyles.integratedReader}>
          <div className={readerStyles.mobileReaderBar}>
            <div className={readerStyles.mobileReaderControls}>
              <button type="button" aria-expanded={showMobileOutline} onClick={()=>setShowMobileOutline(v=>!v)}>章节目录</button>
              <strong>{chapter.title}</strong>
              <button type="button" onClick={()=>setShowMobileSources(true)}>查看来源</button>
            </div>
            {showMobileOutline&&<div className={readerStyles.mobileOutlinePanel}>
              <ChapterOutline chapters={adapted.chapters as OutlineChapter[]} activeSectionId={sectionId||chapter.blocks[0]?.id||""}
                onNavigate={id=>jump(id,pack)}/>
            </div>}
          </div>
          <div className={readerStyles.integratedLayout}>
            <div className={readerStyles.integratedLesson}>
              <LessonContent lesson={adapted.lesson as LessonData} activeCitationId={citationId}
                onCitationSelect={id=>{setCitationId(id);setShowMobileSources(true);}}
                onOpenActivity={id=>document.getElementById("private-activity-"+id)?.scrollIntoView({block:"start"})}/>
              <div className={s.activityList} aria-label="当前章节学习操作">
                {chapter.blocks.map(block=><div key={block.id} id={"private-activity-"+block.id} className={s.activity}>
                  {(block.type==="explanation"||block.type==="code")&&<div className={s.activityRow}>
                    <strong>{block.type==="code"?"代码阅读":"概念阅读"}</strong>
                    <button type="button" disabled={completed.has(block.id)}
                      onClick={()=>saveProgress(old=>markReadingComplete(pack,old,block.id) as Progress|null)}>
                      {completed.has(block.id)?"✓ 已完成":"标记已阅读并保存"}
                    </button>
                  </div>}
                  {block.type==="quiz"&&<div>
                    {progress.answers[block.id]!==undefined&&<p className={s.savedAnswer}>
                      服务端记录的上次答案：{block.options?.[progress.answers[block.id]]??"未知"} 
                      {progress.answers[block.id]===block.answerIndex?" · 答对":" · 可以重试"}
                    </p>}
                    <QuizCard key={selected.id+":"+block.id} question={{
                      id:block.id,title:block.prompt||"课程练习",
                      options:(block.options||[]).map((label,i)=>({id:String(i),label})),
                      correctOptionId:String(block.answerIndex),explanation:block.hint||"请核对本节讲解。"
                    }} onAttempt={(optionId,correct)=>{
                      saveProgress(old=>({
                        ...old,answers:{...old.answers,[block.id]:Number(optionId)},
                        completedBlockIds:correct&&!old.completedBlockIds.includes(block.id)
                          ?[...old.completedBlockIds,block.id]:old.completedBlockIds
                      }));
                    }}/>
                  </div>}
                  {block.type==="stack-simulator"&&<div>
                    <h3>栈的 Push / Pop 实验</h3>
                    <StackPlayground key={selected.id+":"+block.id} initialStack={progress.simStacks[block.id]??block.initial??[]}
                      capacity={block.capacity??6} resetStack={block.initial??[]}
                      onOperation={event=>saveProgress(old=>({
                        ...old,simStacks:{...old.simStacks,[block.id]:event.stack},
                        completedBlockIds:old.completedBlockIds.includes(block.id)?old.completedBlockIds:[...old.completedBlockIds,block.id]
                      }))}
                      onReset={stack=>saveProgress(old=>({
                        ...old,simStacks:{...old.simStacks,[block.id]:stack}
                      }))}/>
                  </div>}
                </div>)}
              </div>
            </div>
            <div className={readerStyles.integratedSidebar+" "+(showMobileSources?readerStyles.integratedSidebarOpen:"")}>
              {showMobileSources&&<button className={readerStyles.mobileSourceClose} type="button" onClick={()=>setShowMobileSources(false)}>关闭来源 ×</button>}
              <div className={readerStyles.integratedChapter}>
                <ChapterOutline chapters={adapted.chapters as OutlineChapter[]} activeSectionId={sectionId||chapter.blocks[0]?.id||""}
                  onNavigate={id=>jump(id,pack)}/>
              </div>
              <div className={readerStyles.integratedCitation}>
                <SourceCitation citations={adapted.citations as CitationRecord[]} selectedId={citationId} onSelect={setCitationId}/>
              </div>
            </div>
          </div>
        </section>
        <p className={s.saveNotice} role="status" aria-live="polite">{saveMessage||"操作后将保存至当前账号。课程引用尚未经原文权限核验。"}</p>
      </>}
    </div>
  </ShellIntegrationFrame>;
}
