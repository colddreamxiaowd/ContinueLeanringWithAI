"use client";
import Link from "next/link";
import {LearningPractice} from "@/design/pixel-pop/workstreams/learning";
import {DEMO_QUIZZES} from "../sample-course";
import s from "../unified.module.css";
export default function IntegratedPractice(){
 return <section className={s.page} data-integrated-page="practice">
  <div className={s.demoBand}><strong>互动学习 · 栈的基本操作</strong><span>真实数组状态与答题交互 · 成绩仅在当前浏览器组件内</span></div>
  <LearningPractice lessonTitle="栈的 Push / Pop" questions={DEMO_QUIZZES}/>
  <div className={s.bottomLink}>
   <Link href="/ui-lab/integrated/reader">← 返回课程阅读</Link>
   <Link href="/ui-lab/integrated/home" data-practice-to-home>返回学习首页 →</Link>
  </div>
 </section>;
}
