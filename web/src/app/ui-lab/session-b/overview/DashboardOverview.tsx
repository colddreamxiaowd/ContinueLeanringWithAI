"use client";
import {useState} from "react";
import {CourseHero} from "@/design/pixel-pop/blocks/lego";
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
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
export default function DashboardOverview(){
  const [tasks,setTasks]=useState<DashboardStudyTask[]>(TASKS);
  const [message,setMessage]=useState("Demo：点击章节、文件或任务可以体验真实回调，不写入学习记录。");
  const feedback=(text:string)=>setMessage("Demo：" + text + "（未保存到 CoursePack）");
  const openTask=(id:string)=>{
    setTasks(old=>old.map(t=>t.id===id?{...t,
      status:t.status==="not-started"?"in-progress":t.status==="in-progress"?"completed":"completed"
    }:t));
    feedback("已更新演示任务：" + id);
  };
  return <ShellIntegrationFrame surface="courses"
    navigation={[{id:"courses",label:"我的课程",icon:"courses",href:"/ui-lab/session-b/overview"}]}
    crumbs={[{label:"学习中心"},{label:"首页学习卡片"}]}>
    <div className={styles.container}>
      <div className={styles.utility}>
        <strong>知序首页 · Learning Hub</strong>
        <span className={styles.demoTag}>DEMO · 全部为演示数据</span>
      </div>
      <div className={styles.heroWrap}><CourseHero href="/coursepacks"/></div>
      <div className={styles.sectionHeader}>
        <div><span className={styles.overline}>YOUR LEARNING DESK</span>
          <h2>今天，继续探索知识。</h2></div>
        <span className={styles.version}>B / DASHBOARD CARDS</span>
      </div>
      <div className={styles.cards} data-session-b-cards>
        <CourseProgressCard progressPercent={68} chapters={CHAPTERS}
          onOpenChapter={id=>feedback("打开章节："+CHAPTERS.find(c=>c.id===id)?.title)}
          onContinue={()=>feedback("继续学习：综合练习")}
          onViewAll={()=>feedback("查看全部章节")}/>
        <SourceFileCard title="我的资料库" files={FILES}
          onOpenFile={id=>feedback("查看资料："+FILES.find(f=>f.id===id)?.name)}
          onViewAll={()=>feedback("浏览资料库")}/>
        <StudyTaskCard dateLabel="示例任务" tasks={tasks} onOpenTask={openTask}
          onViewAll={()=>feedback("查看今日任务")}/>
      </div>
      <div className={styles.notice} role="status">{message}</div>
      <p className={styles.foot}>真实 Next.js 组合预览；使用 A 共享侧栏 / 密度 / 面包屑及原有三张 B 卡。任务状态仅保存在当前 Demo 内存中。</p>
    </div>
  </ShellIntegrationFrame>;
}
