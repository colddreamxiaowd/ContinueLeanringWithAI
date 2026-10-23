"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {CourseHero} from "@/design/pixel-pop/blocks/lego";
import {CourseProgressCard,SourceFileCard,StudyTaskCard} from "@/design/pixel-pop/workstreams/dashboard";
import {DEMO_CHAPTERS,DEMO_FILES,DEMO_TASKS} from "../sample-course";
import s from "../unified.module.css";

export default function IntegratedHome(){
 const router=useRouter();
 const [event,setEvent]=useState("欢迎体验真实组件。所有进度和资料均为合成示例，不保存到账号。");
 const taskClick=(id:string)=>router.push(id==="lesson"?"/ui-lab/integrated/reader":"/ui-lab/integrated/practice");
 return <div className={s.page} data-integrated-page="home">
   <div className={s.demoBand}><strong>今天，继续探索知识。</strong><span>统一产品预览 · 合成示例数据</span></div>
   <CourseHero href="/ui-lab/integrated/reader"/>
   <div className={s.sectionHeading}>
     <div><span className={s.overline}>YOUR LEARNING DESK</span><h2>学习工作台</h2></div>
     <Link href="/coursepacks" className={s.textLink}>进入真实私人课程库 →</Link>
   </div>
   <div className={s.cards} data-integrated-cards>
     <CourseProgressCard title="学习进度" progressPercent={68} chapters={DEMO_CHAPTERS}
       onOpenChapter={()=>router.push("/ui-lab/integrated/reader")}
       onContinue={()=>router.push("/ui-lab/integrated/reader")}
       onViewAll={()=>router.push("/courses")}/>
     <SourceFileCard title="我的资料库" files={DEMO_FILES}
       onOpenFile={id=>setEvent("演示来源："+(DEMO_FILES.find(f=>f.id===id)?.name||id)+"；没有伪造原文跳转")}
       onViewAll={()=>router.push("/library")}/>
     <StudyTaskCard title="今日学习" dateLabel="演示计划" tasks={DEMO_TASKS}
       onOpenTask={taskClick} onViewAll={()=>router.push("/ui-lab/integrated/practice")}/>
   </div>
   <p className={s.note} role="status">{event}</p>
   <div className={s.bottomLink}>
     <Link href="/ui-lab/integrated/reader">阅读「栈的 Push / Pop」 →</Link>
     <Link href="/ui-lab/integrated/practice">直接体验 Push / Pop 实验 →</Link>
   </div>
 </div>;
}
