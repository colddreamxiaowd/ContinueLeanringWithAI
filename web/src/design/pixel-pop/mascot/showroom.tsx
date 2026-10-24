"use client";
import {useState} from "react";
import {Xiaozhi,XIAOZHI_MOODS} from "./Xiaozhi";
import {XIAOZHI_PARTS} from "./XiaozhiLayers";
import type {XiaozhiPart} from "./XiaozhiLayers";
import type {XiaozhiMood,XiaozhiMotion} from "./Xiaozhi";
import styles from "./showroom.module.css";

const names:Record<XiaozhiMood,string>={
 idle:"默认",happy:"开心",thinking:"思考",curious:"好奇",
 focused:"专注",encourage:"鼓励",celebrate:"庆祝",surprised:"惊讶"
};
const uses:Record<XiaozhiMood,string>={
 idle:"日常导航",happy:"理解成功",thinking:"提示与引导",curious:"探索入口",
 focused:"练习中",encourage:"回答错误",celebrate:"章节完成",surprised:"发现新知识"
};
const motionOptions:{id:XiaozhiMotion;title:string}[]=[
 {id:"none",title:"静止"},{id:"idle",title:"悬停互动"},
 {id:"wave",title:"挥动"},{id:"bounce",title:"庆祝跳跃"}
];

export default function XiaozhiShowroom(){
 const [mood,setMood]=useState<XiaozhiMood>("idle");
 const [motion,setMotion]=useState<XiaozhiMotion>("idle");
 const [theme,setTheme]=useState<"light"|"dark">("light");
 const [art,setArt]=useState<"trace"|"reference"|"vector">("trace");
 const [inspectPart,setInspectPart]=useState<XiaozhiPart|null>(null);
 return <div className={styles.page}>
  <header className={styles.header}>
    <div><span className={styles.overline}>PIXEL POP / CHARACTER SYSTEM / V1</span>
      <h1>你好，我是 <span>小知。</span></h1>
      <p>真正能重复使用的品牌角色，必须拥有统一的轮廓、色彩、结构与动作语言。</p>
    </div>
    <a href="/" className={styles.back}>← 返回知序首页</a>
  </header>
  <div className={styles.layout}>
    <section className={styles.spotlight+" "+(theme==="dark"?styles.spotlightDark:"")}>
      <div className={styles.sparkTop} aria-hidden="true">✦ <b>LEARN • PRACTICE • GROW</b> ✦</div>
      <div className={styles.mascotMain}><Xiaozhi size={286} mood={mood} motion={motion} art={art} inspectPart={inspectPart}/></div>
      <div className={styles.spotlightCaption}>
       <strong>{names[mood]}</strong><span>{uses[mood]}</span>
      </div>
      <div className={styles.floor} aria-hidden="true"/>
    </section>
    <aside className={styles.controls}>
      <h2>01 / 表情切换</h2>
      <p>全部复用同一套帽子、耳朵、脸颊、躯干与尾巴。</p>
      <div className={styles.moodGrid}>
        {XIAOZHI_MOODS.map(state=><button key={state} type="button"
          aria-pressed={mood===state}
          className={mood===state?styles.selected:styles.moodButton}
          onClick={()=>setMood(state)}>
          <Xiaozhi size={64} mood={state} art={art}/><span>{names[state]}</span>
        </button>)}
      </div>
      <h2>02 / 动作状态</h2>
      <div className={styles.segmented}>
        {motionOptions.map(m=><button type="button" key={m.id}
          className={motion===m.id?styles.activeSegment:""} aria-pressed={motion===m.id}
          onClick={()=>setMotion(m.id)}>{m.title}</button>)}
      </div>
      <h2>03 / 三种制作方法的真实对照</h2>
      <div className={styles.segmented}>
       <button type="button" onClick={()=>setArt("trace")} aria-pressed={art==="trace"}
         className={art==="trace"?styles.activeSegment:""}>25 色真实路径版（默认）</button>
       <button type="button" onClick={()=>setArt("reference")} aria-pressed={art==="reference"}
         className={art==="reference"?styles.activeSegment:""}>PNG 嵌入 SVG 的参考版</button>
       <button type="button" onClick={()=>setArt("vector")} aria-pressed={art==="vector"}
         className={art==="vector"?styles.activeSegment:""}>以前的手工多边形版</button>
      </div>
      <h2>04 / 真实语义图层（静态）</h2>
      <p className={styles.partHint}>选择眼睛、学士帽或尾巴，只高亮该部位。默认合成必须与原始 25 色母版完全一致。</p>
      <div className={styles.partGrid}>
        <button type="button" aria-pressed={inspectPart===null} onClick={()=>setInspectPart(null)}>完整角色</button>
        {XIAOZHI_PARTS.map(part=><button type="button" key={part} disabled={art!=="trace"}
          aria-pressed={inspectPart===part} onClick={()=>setInspectPart(part)}>{part}</button>)}
      </div>
      <h2>05 / 对比场景</h2>
      <div className={styles.segmented}>
        <button type="button" onClick={()=>setTheme("light")} aria-pressed={theme==="light"}
          className={theme==="light"?styles.activeSegment:""}>明亮背景</button>
        <button type="button" onClick={()=>setTheme("dark")} aria-pressed={theme==="dark"}
          className={theme==="dark"?styles.activeSegment:""}>深色背景</button>
      </div>
      <p className={styles.footnote}>真实路径版已拆成 12 个静态语义组，重新合成与 25 色原始母版完全一致。它不是骨骼动画系统；额外的 mood 符号不等于五官真正换表情。24px / 32px 头像采用单独的光学校正 SVG。动画遵循“减少动态效果”设置。</p>
    </aside>
  </div>
  <section className={styles.specimens}>
   <div className={styles.sectionTitle}><span>04 / SCALE STUDY</span><h2>每一种尺寸，都还是小知。</h2></div>
   <div className={styles.scaleGrid}>
     {[{size:32,name:"32px",use:"导航头像"},{size:48,name:"48px",use:"反馈提示"},
       {size:96,name:"96px",use:"课程卡片"},{size:160,name:"160px",use:"完整角色"}].map(item=>
       <div key={item.size} className={styles.scaleCard}>
        <div className={styles.scaleAsset}><Xiaozhi size={item.size} mood={mood} art={art}
          pose={item.size<=48?"avatar":"full"}/></div>
        <strong>{item.name}</strong><span>{item.use}</span>
       </div>)}
   </div>
   <div className={styles.sectionTitle}><span>05 / COMPONENT APPLICATION</span><h2>它如何融入学习体验？</h2></div>
   <div className={styles.cards}>
     <div className={styles.success}><Xiaozhi size={72} mood="celebrate" motion="idle"/>
       <div><b>答对了！</b><p>你已经理解后进先出的原理。</p></div></div>
     <div className={styles.retry}><Xiaozhi size={72} mood="encourage"/>
       <div><b>再试一次！</b><p>可以回到动画中观察栈顶变化。</p></div></div>
     <div className={styles.hint}><Xiaozhi size={72} mood="thinking"/>
       <div><b>小知提示</b><p>最后放入栈的元素，将最先出栈。</p></div></div>
   </div>
  </section>
  <footer className={styles.footer}>展示的是统一 SVG 角色组件；所有表情与动作由代码控制，不需要重新生成图片。</footer>
 </div>;
}
