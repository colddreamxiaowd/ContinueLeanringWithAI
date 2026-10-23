"use client";
import {useState} from "react";
import {BrandHeader,CourseHero} from "@/design/pixel-pop/blocks/lego";
import {CourseProgressCard,SourceFileCard,StudyTaskCard} from "@/design/pixel-pop/workstreams/dashboard";
import type {ProgressChapter,DashboardSourceFile,DashboardStudyTask} from "@/design/pixel-pop/workstreams/dashboard";
import styles from "./overview.module.css";

const CHAPTERS:ProgressChapter[]=[
 {id:"stack-concept",title:"栈的基本概念",status:"completed"},
 {id:"stack-operations",title:"栈的 Push / Pop",status:"completed"},
 {id:"stack-use",title:"栈的应用场景",status:"completed"},
 {id:"stack-exercise",title:"综合练习",status:"current"},
 {id:"stack-exam",title:"章节测验",status:"available"},
];
const FILES:DashboardSourceFile[]=[
 {id:"deck",name:"数据结构.pptx",kind:"pptx",subtitle:"课程讲解 · 32页 · 演示资料",outcome:"course",syncState:"synced"},
 {id:"sheet",name:"栈与队列_课后习题.pdf",kind:"pdf",subtitle:"课后练习 · 12页 · 演示资料",outcome:"practice",syncState:"synced"},
 {id:"notes",name:"栈的实现与应用.md",kind:"markdown",subtitle:"学习笔记 · 演示资料",outcome:"supplement",syncState:"synced"},
 {id:"feishu",name:"面试高频：栈的常见题型",kind:"feishu",subtitle:"飞书云文档 · 演示资料",outcome:"course",syncState:"synced"},
];
const TASKS:DashboardStudyTask[]=[
 {id:"lesson",title:"栈的 Push / Pop",kind:"video",status:"in-progress",durationMinutes:8},
 {id:"practice",title:"栈的应用场景",kind:"practice",status:"not-started",durationMinutes:12},
 {id:"assessment",title:"章节测验",kind:"quiz",status:"completed",durationMinutes:10},
];
type Density="minimal"|"balanced"|"normal";

/** Real product composition, using the exact approved workstream components.
 * All content is demonstrative and callbacks are local only.
 */
export default function DashboardOverview(){
 const [density,setDensity]=useState<Density>("balanced");
 const [tasks,setTasks]=useState<DashboardStudyTask[]>(TASKS);
 const [message,setMessage]=useState("点击任一课程章节、资料或任务，体验组件回调。");
 const act=(what:string)=>setMessage(what+" · 本页只演示交互，不会写入真实学习记录");
 const nextTask=(id:string)=>{
   setTasks(prev=>prev.map(t=>t.id===id?{
      ...t,status:t.status==="not-started"?"in-progress":t.status==="in-progress"?"completed":"completed"
   }:t));
   act("已更新演示任务："+id);
 };
 return <div className="pp-root" data-density={density}>
   <BrandHeader/>
   <main className={styles.container}>
     <div className={styles.utility}>
       <div className={styles.utilityCopy}><span className={styles.dot}/> PIXEL POP · INTEGRATED PREVIEW
         <span className={styles.demoTag}>仅演示数据</span></div>
       <fieldset className={styles.modes}><legend>界面密度</legend>
         {(["minimal","balanced","normal"] as const).map(m=>
           <button type="button" key={m} aria-pressed={density===m} onClick={()=>setDensity(m)}>
            {({minimal:"极简",balanced:"较简",normal:"正常"})[m]}
           </button>)}
       </fieldset>
     </div>
     <div className={styles.heroWrap}><CourseHero href="/coursepacks"/></div>
     <div className={styles.sectionHeader}><div><span className={styles.overline}>YOUR LEARNING DESK</span>
       <h2>今天，继续探索知识。</h2></div>
       <span className={styles.version}>B / DASHBOARD CARDS V2</span>
     </div>
     <div className={styles.cards}>
       <CourseProgressCard progressPercent={68} chapters={CHAPTERS}
         onOpenChapter={id=>act("打开章节："+CHAPTERS.find(c=>c.id===id)?.title)}
         onContinue={()=>act("继续学习：综合练习")} onViewAll={()=>act("查看课程进度")}/>
       <SourceFileCard title="我的资料库" files={FILES}
         onOpenFile={id=>act("查看资料："+FILES.find(f=>f.id===id)?.name)}
         onViewAll={()=>act("浏览完整资料库")}/>
       <StudyTaskCard dateLabel="示例任务" tasks={tasks}
         onOpenTask={nextTask} onViewAll={()=>act("查看今日学习任务")}/>
     </div>
     <div className={styles.notice} role="status"><span aria-hidden="true">✦</span>{message}</div>
     <p className={styles.foot}>这是一张真实 Next.js 页面，由现有 BrandHeader、CourseHero 和 B 组三个受控组件组成。资料、进度及操作均为模拟，不连接个人飞书账号。</p>
   </main>
 </div>;
}
