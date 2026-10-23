import Link from "next/link";
import {Bell,Search,Star,Play,ArrowRight} from "lucide-react";
import {PixelCat} from "../primitives";
import styles from "./lego.module.css";

/** Pixel Pop / LEGO 01 — shared identity bar, zero page-specific colors. */
export function BrandHeader(){
  return <header className={styles.header}>
    <Link className={styles.logo} href="/" aria-label="知序 Learning Hub 首页">
      <svg width="42" height="44" viewBox="0 0 44 44" role="img" aria-label="知序标志">
        <path d="M6 14L20 5 30 13 19 23Z" fill="#18B8FF"/>
        <path d="M19 23L30 13 39 19 25 32Z" fill="#7440FF"/>
        <path d="M6 14L19 23 25 32 13 39 4 28Z" fill="#245AFF"/>
        <path d="M20 5L30 13 39 19 25 32 13 39 4 28 6 14Z" fill="none" stroke="#111119" strokeWidth="1.7" strokeLinejoin="round"/>
      </svg>
      <strong>知序 <span>Learning Hub</span></strong>
    </Link>
    <Link href="/courses" className={styles.search} aria-label="浏览与搜索课程">
      <Search size={21}/><span>搜索课程、飞书文档或知识点...</span><kbd>⌘ K</kbd>
    </Link>
    <div className={styles.account}>
      <Bell size={24} aria-label="通知" role="img"/>
      <div className={styles.profile}><span className={styles.avatar}><PixelCat size={32}/></span><b>小知</b><span aria-hidden="true">⌄</span></div>
    </div>
  </header>;
}

/** Pixel Pop / LEGO 02 — isometric 3-layer illustration rendered as a vector. */
export function StackMonument({className=""}:{className?:string}){
 return <svg className={className} viewBox="0 0 430 345" role="img" aria-label="三层立体积木：蓝色 Push、橙色 Pop、绿色 Stack" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="lego-dot" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.4" cy="2.4" r="1.8" fill="#111119" opacity=".65"/></pattern>
    <filter id="lego-shadow" x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="4" dy="6" stdDeviation=".15" floodColor="#111119" floodOpacity="1"/></filter>
  </defs>
  <path d="M27 272L213 217L400 273L219 334Z" fill="#111119"/>
  <g filter="url(#lego-shadow)" stroke="#111119" strokeWidth="5" strokeLinejoin="round">
    <path d="M54 235L248 190L380 237L185 289Z" fill="#6FFFE2"/>
    <path d="M54 235L185 289V329L54 276Z" fill="#18D3AC"/>
    <path d="M185 289L380 237V279L185 329Z" fill="#079A78"/>
    <path d="M81 153L248 114L354 151L189 196Z" fill="#FFC768"/>
    <path d="M81 153L189 196V252L81 209Z" fill="#FF8233"/>
    <path d="M189 196L354 151V206L189 252Z" fill="#F55416"/>
    <path d="M81 57L248 16L354 56L186 102Z" fill="#74C7FF"/>
    <path d="M81 57L186 102V161L81 115Z" fill="#277AFF"/>
    <path d="M186 102L354 56V114L186 161Z" fill="#1461E5"/>
  </g>
  <path d="M186 102L354 56V114L186 161Z" fill="url(#lego-dot)" opacity=".45"/>
  <path d="M189 196L354 151V206L189 252Z" fill="url(#lego-dot)" opacity=".45"/>
  <path d="M185 289L380 237V279L185 329Z" fill="url(#lego-dot)" opacity=".45"/>
  <g fontFamily="Arial, sans-serif" fontWeight="900" textAnchor="middle" fontSize="28">
    <text x="131" y="130" fill="#FFF" transform="rotate(18 131 130)">Push</text>
    <text x="135" y="220" fill="#FFF" transform="rotate(19 135 220)">Pop</text>
    <text x="123" y="307" fill="#111119" transform="rotate(20 123 307)">Stack</text>
  </g>
  <path d="M362 7L374 15 366 30 354 20Z M383 35L407 32 406 46 383 45Z M9 158L17 139 27 144 21 164Z" fill="#111119"/>
  <path d="M20 90Q-4 134 21 155M15 142L21 155 35 151" fill="none" stroke="#7440FF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M389 136Q421 167 395 196M389 183L395 196 410 188" fill="none" stroke="#246BFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}

/** Pixel Pop / LEGO 03 — hero composes the reusable illustration and text. */
export function CourseHero({
  course="数据结构",chapter="第 3 章 栈与队列",
  title="栈的 Push / Pop",description="从飞书文档自动生成互动课程，结合动画演示、随堂练习和即时反馈，帮助你真正理解「栈」的工作原理。",
  href="/courses"
}:{course?:string;chapter?:string;title?:string;description?:string;href?:string}){
  return <section className={styles.hero} aria-labelledby="lego-course-title">
    <div className={styles.heroInner}>
      <div className={styles.heroLabels}>
        <span className={styles.resume}><Star size={19} fill="white"/> 继续学习</span>
        <span className={styles.crumb}>{course} <b>›</b> {chapter}</span>
      </div>
      <h1 id="lego-course-title"><span>{title}</span></h1>
      <h2>基于 CoursePack 的互动式学习体验</h2>
      <p>{description}</p>
      <div className={styles.actions}>
        <Link href={href} className={styles.primary}><Play size={20} fill="white"/> 继续学习 <ArrowRight size={19}/></Link>
        <small>上次学习：栈的基本操作 · 演示</small>
      </div>
    </div>
    <div className={styles.art}>
      <StackMonument className={styles.stackSvg}/>
      <span className={styles.bubble}>后进先出<br/>LIFO</span>
      <span className={styles.cat}><PixelCat size={70}/></span>
      <span className={styles.spark} aria-hidden="true">✦</span>
    </div>
  </section>;
}
