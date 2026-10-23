"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {ReactNode} from "react";
import {
  ArrowLeft,ArrowRight,BookOpen,BookOpenCheck,CheckCircle2,
  ChevronDown,Clock3,FileText,FlaskConical,FolderOpen,GraduationCap,
  Home,LibraryBig,ListChecks,Menu,Play,RefreshCcw,Search,Settings2,
  Sparkles,Star,Trophy,X
} from "lucide-react";
import {PopButton,PopPanel,PixelCat,Xiaozhi,ProgressRing} from "@/design/pixel-pop/primitives";
import "./pixel-pop.css";

type Density="minimal"|"balanced"|"normal";
type View="home"|"reader"|"lab"|"quiz";
const DENSITIES:{id:Density;label:string;description:string}[]=[
  {id:"minimal",label:"极简",description:"专注内容"},
  {id:"balanced",label:"较简",description:"平衡体验"},
  {id:"normal",label:"正常",description:"丰富探索"},
];
const SIDE_LINKS=[
  {href:"/",label:"首页",icon:Home},
  {href:"/coursepacks",label:"互动课程",icon:GraduationCap},
  {href:"/courses",label:"课程体系",icon:BookOpen},
  {href:"/library",label:"我的飞书资料",icon:LibraryBig},
  {href:"/experiments",label:"互动实验",icon:FlaskConical},
  {href:"/sources",label:"来源资料",icon:FolderOpen},
];
const DEMO_LESSONS=[
  {name:"栈的基本概念",done:true},
  {name:"Push / Pop 操作",done:true},
  {name:"栈的应用场景",done:false},
  {name:"综合练习",done:false},
];
const NAV_VIEWS:{id:View;label:string}[]=[
  {id:"home",label:"学习首页"},{id:"reader",label:"阅读"},{id:"lab",label:"实验"},{id:"quiz",label:"做题"}
];
function MiniBadge({children}:{children:ReactNode}){return <span className="pp-badge">{children}</span>;}
function StackPlayground(){
  const [stack,setStack]=useState<number[]>([1,2,3]);
  const [input,setInput]=useState("7");
  const [last,setLast]=useState("可进行 Push、Pop，观察栈顶变化。");
  const push=()=>{
    const value=Number(input);
    if(!input.trim()||!Number.isSafeInteger(value)){setLast("请输入有效整数");return;}
    if(stack.length>=6){setLast("栈已满（容量 6）");return;}
    setStack(prev=>[...prev,value]);setLast("Push("+value+") 成功：栈顶变为 "+value);
  };
  const pop=()=>{
    if(!stack.length){setLast("空栈不能 Pop");return;}
    const top=stack[stack.length-1];setStack(prev=>prev.slice(0,-1));setLast("Pop() 返回 "+top);
  };
  return <div className="pp-lab">
    <div className="pp-lab-stage">
      <div className="pp-grid-pattern" aria-hidden="true"/>
      <div className="pp-stack-axis">TOP →</div>
      <div className="pp-stack" aria-label={"栈顶元素 "+(stack.at(-1)??"空")}>
        {stack.map((n,i)=><div className={"pp-stack-item pp-stack-tone-"+(i%4)} key={i}>{n}</div>)}
        {!stack.length&&<span className="pp-empty-stack">空栈</span>}
      </div>
      <PixelCat size={82} cheer={last.includes("成功")}/>
    </div>
    <div className="pp-lab-controls">
      <label htmlFor="pp-value">入栈元素</label>
      <div className="pp-control-row">
        <input id="pp-value" inputMode="numeric" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")push();}} placeholder="例如 7"/>
        <PopButton variant="blue" onClick={push}>＋ Push</PopButton>
        <PopButton variant="coral" onClick={pop}>－ Pop</PopButton>
        <PopButton variant="outline" onClick={()=>{setStack([1,2,3]);setLast("栈已重置");}}><RefreshCcw size={15}/>重置</PopButton>
      </div>
      <div className="pp-lab-status" role="status">{last} <span>当前栈：[ {stack.join(", ")} ]</span></div>
    </div>
  </div>;
}
function QuizCard({compact=false}:{compact?:boolean}){
  const [selected,setSelected]=useState<number|null>(null);
  const options=["先进先出（FIFO）","后进先出（LIFO）","随机弹出","按大小排序"];
  return <div className="pp-quiz">
    <div className="pp-quiz-top"><MiniBadge>知识检测 · 单选</MiniBadge><span>1 / 1 · 演示题目</span></div>
    <h3>栈是一种什么样的线性表？</h3>
    <div className={"pp-options"+(compact?" pp-options--compact":"")}>
      {options.map((o,i)=><button type="button" key={o} aria-pressed={selected===i}
        className={"pp-option"+(selected===i?" pp-option--chosen":"")+
          (selected!==null&&i===1?" pp-option--correct":"")+
          (selected===i&&i!==1?" pp-option--incorrect":"")}
        onClick={()=>setSelected(i)}>
        <b>{String.fromCharCode(65+i)}</b><span>{o}</span>
        {selected!==null&&i===1&&<CheckCircle2 size={19}/>}
      </button>)}
    </div>
    {selected!==null&&<div className={"pp-feedback "+(selected===1?"pp-feedback--good":"pp-feedback--retry")} role="status">
      <Xiaozhi size={50} mood={selected===1?"celebrate":"encourage"}/>
      <span><strong>{selected===1?"答对了！":"再想一下"}</strong>
      栈遵循后进先出（LIFO）；最后入栈的元素最先出栈。这是演示练习，尚不保存到账号。</span>
    </div>}
  </div>;
}
function DashboardContent({go}:{go:(v:View)=>void}){
  return <>
    <div className="pp-main-grid">
      <PopPanel tone="yellow" className="pp-hero">
        <div className="pp-hero-content">
          <div className="pp-hero-topline"><MiniBadge><Star size={15} fill="currentColor"/> 继续学习</MiniBadge>
            <span>数据结构 <b>›</b> 第 3 章 · 栈与队列</span></div>
          <h1><span>栈的 Push / Pop</span></h1>
          <div className="pp-hero-subtitle">基于 CoursePack 的互动式学习体验</div>
          <p>把飞书资料转化成可视化学习内容，结合动手操作、随堂练习与即时反馈，真正理解「栈」的原理。</p>
          <div className="pp-hero-ctas">
            <PopButton onClick={()=>go("reader")}><Play size={18} fill="currentColor"/> 继续学习 <ArrowRight size={17}/></PopButton>
            <span className="pp-soft-text">上次学习：栈的基本操作 · 示例</span>
          </div>
        </div>
        <div className="pp-hero-art" aria-hidden="true">
          <img src="/pixel-pop/stack-hero.svg" width="550" height="420" alt="" />
          <span className="pp-hero-callout">后进先出<br/>LIFO</span>
          <div className="pp-hero-cat"><PixelCat size={72}/></div>
        </div>
        <div className="pp-hero-dots pp-decoration" aria-hidden="true"/>
      </PopPanel>
      <PopPanel title="学习进度" eyebrow="DEMO · 示例数据" className="pp-progress-panel"
        actions={<Trophy size={23} color="#F2B818"/>}>
        <div className="pp-progress-layout">
          <ProgressRing value={68} label="示例进度"/>
          <div className="pp-lessons">
            <strong className="pp-lessons-count">3 / 5 章节已完成</strong>
            {["栈的基本概念","Push / Pop 操作","栈的应用场景","综合练习","章节测验"].map((name,i)=><div key={name}>
              <span className={i<3?"pp-dot pp-dot--done":"pp-dot"}>{i<3?"✓":""}</span>{name}
            </div>)}
          </div>
        </div>
        <small className="pp-quiet">演示数据；私人 CoursePack 将独立保存真实进度。</small>
      </PopPanel>
    </div>
    <div className="pp-home-panels">
      <PopPanel title="我的资料库" eyebrow="FEISHU & COURSEPACK" className="pp-library"
        actions={<Link href="/library" className="pp-inline-link">查看全部 <ArrowRight size={15}/></Link>}>
        <p className="pp-quiet">从飞书同步资料，并生成属于自己的互动课程。</p>
        {[
          ["P","数据结构.pptx","课程主讲内容 · 示例","橙"],
          ["PDF","栈与队列_课后习题.pdf","习题与参考答案 · 示例","红"],
          ["M↓","笔记：栈的实现与应用.md","个人补充资料 · 示例","灰"],
          ["↗","面试高频：栈的常见题型","飞书云文档 · 示例","紫"]
        ].map(([ext,name,desc,color])=><div className="pp-file pp-file--sample" key={name}>
          <span className={"pp-file-icon pp-file-icon--"+color}>{ext}</span>
          <div><strong>{name}</strong><small>{desc}</small></div><span className="pp-file-tag">演示</span><ArrowRight size={15}/>
        </div>)}
      </PopPanel>
      <PopPanel title="互动实验" eyebrow="TRY THE STACK" className="pp-small-lab"
        actions={<button className="pp-icon-action" type="button" onClick={()=>go("lab")}>完整实验 <ArrowRight size={17}/></button>}>
        <p className="pp-quiet">在这里操作栈，直观理解后进先出（LIFO）的过程。</p>
        <StackPlayground/>
      </PopPanel>
      <PopPanel title="练习检测" eyebrow="QUICK CHECK" className="pp-small-quiz"
        actions={<button className="pp-icon-action" type="button" onClick={()=>go("quiz")}>1 / 1 <ArrowRight size={16}/></button>}>
        <QuizCard compact/>
      </PopPanel>
      <PopPanel title="今日学习" eyebrow="YOUR NEXT STEP" className="pp-today"
        actions={<Clock3 size={20}/>}>
        <button type="button" className="pp-task" onClick={()=>go("reader")}>
          <span className="pp-task-play"><Play size={21} fill="currentColor"/></span>
          <span><strong>栈的 Push / Pop</strong><small>8 分钟 · 阅读演示</small></span><ArrowRight size={18}/>
        </button>
        <button type="button" className="pp-task" onClick={()=>go("lab")}>
          <span className="pp-task-play pp-task-play--yellow"><FlaskConical size={22}/></span>
          <span><strong>栈的应用场景</strong><small>12 分钟 · 动手实践</small></span><ArrowRight size={18}/>
        </button>
        <button type="button" className="pp-task" onClick={()=>go("quiz")}>
          <span className="pp-task-play pp-task-play--mint"><ListChecks size={21}/></span>
          <span><strong>章节测验</strong><small>10 分钟 · 检测理解</small></span><ArrowRight size={18}/>
        </button>
      </PopPanel>
      <PopPanel title="最近课程" eyebrow="COURSE COLLECTION" className="pp-recent"
        actions={<Link href="/courses" className="pp-inline-link">查看全部 <ArrowRight size={15}/></Link>}>
        {[
          ["数据结构","5 章 · 32 个知识点",68,"#7440FF"],
          ["算法基础","6 章 · 28 个知识点",42,"#15C69B"],
          ["计算机组成原理","4 章 · 18 个知识点",12,"#FFA553"]
        ].map(([name,detail,val,color])=><div className="pp-recent-item" key={name as string}>
          <span className="pp-recent-glyph" style={{background:String(color)}}><BookOpen size={20}/></span>
          <div><strong>{name}</strong><small>{detail}</small>
            <div className="pp-recent-track"><span style={{width:String(val)+"%",background:String(color)}}/></div></div>
          <span className="pp-recent-percent">{String(val)}%*</span>
        </div>)}
        <small className="pp-quiet">* 数值为视觉演示，不代表用户的真实进度</small>
      </PopPanel>
      <div className="pp-last-column">
        <PopPanel title="来源追溯" eyebrow="PROVENANCE" className="pp-source"
          actions={<Link href="/library" className="pp-inline-link">查看来源 <ArrowRight size={15}/></Link>}>
          <p className="pp-quiet">真实课程的知识点可以回到原始飞书资料。</p>
          <div className="pp-source-document"><span>P</span><div>
            <strong>数据结构.pptx（示例）</strong><small>第 12 页 · 栈的定义与操作</small></div><FileText size={18}/></div>
        </PopPanel>
        <PopPanel title="课程设置" eyebrow="PRIVATE BY DEFAULT" className="pp-source">
          <div className="pp-private-row"><Settings2 size={19}/><span><strong>私人课程</strong>
            <small>仅你可见，课程内容源自你授权的资料</small></span>
            <Link href="/coursepacks" className="pp-inline-link">设置 <ArrowRight size={15}/></Link></div>
        </PopPanel>
      </div>
    </div>
  </>;
}
function ReaderContent({go}:{go:(v:View)=>void}){
  return <div className="pp-detail-layout">
    <PopPanel className="pp-reader-panel" eyebrow="CHAPTER 03 · DATA STRUCTURES">
      <div className="pp-section-meta"><MiniBadge>阅读模式 · 示例课程</MiniBadge> 预计阅读 8 分钟</div>
      <h1>栈的 Push / Pop</h1>
      <p className="pp-intro">栈是一种限制操作位置的线性表。我们先看定义，再通过动手实验理解。</p>
      <div className="pp-reader-illustration pp-decoration"><div className="pp-mini-stack">3<br/>2<br/>1</div>
        <PixelCat size={84}/><span>LAST IN, FIRST OUT</span></div>
      <div className="pp-reading-text">
        <h2><span>01</span> 什么是栈？</h2>
        <p>栈（Stack）遵守<strong>后进先出（LIFO）</strong>原则：数据只能从栈顶进入，也只能从栈顶离开。</p>
        <div className="pp-definition"><strong>Push（入栈）</strong> 把一个元素放到栈顶。<br/>
          <strong>Pop（出栈）</strong> 移除并返回栈顶的元素。</div>
        <h2><span>02</span> 自己验证一下</h2>
        <p>试着把 7 放入栈顶，再执行一次 Pop，看看发生什么。</p>
      </div>
      <div className="pp-reader-actions"><PopButton variant="blue" onClick={()=>go("lab")}>打开互动实验 <ArrowRight size={16}/></PopButton>
        <PopButton variant="outline" onClick={()=>go("quiz")}>去做练习</PopButton></div>
    </PopPanel>
    <aside className="pp-reading-side"><PopPanel title="本节目录" eyebrow="OUTLINE">
      <ol className="pp-outline"><li>栈的基本概念</li><li>Push / Pop 操作</li><li>动手实验</li><li>理解检测</li></ol></PopPanel>
      <PopPanel title="来源说明" eyebrow="PROVENANCE"><p className="pp-quiet">
        本页使用合成示例内容展示设计。真实 CoursePack 会记录来源文档与页码。</p>
      </PopPanel>
    </aside>
  </div>;
}
function LabContent(){
  return <div className="pp-detail-layout">
    <PopPanel eyebrow="INTERACTIVE LAB" className="pp-lab-panel">
      <div className="pp-section-meta"><MiniBadge><FlaskConical size={15}/> 真实可操作的模拟器</MiniBadge> 仅在浏览器内演示</div>
      <h1>动手理解 Push / Pop</h1><p className="pp-intro">观察栈顶，执行操作，理解后进先出的行为。</p>
      <StackPlayground/>
    </PopPanel>
    <aside className="pp-reading-side"><PopPanel title="实验目标" eyebrow="CHECKLIST">
      <ol className="pp-outline"><li>识别栈顶位置</li><li>尝试 Push</li><li>尝试 Pop</li><li>观察栈已空时的状态</li></ol></PopPanel>
      <PopPanel title="学习提示" eyebrow="TIP"><p className="pp-quiet">
        每次操作后，注意上方的栈顶与操作反馈。</p><div className="pp-side-cat"><PixelCat size={70}/></div>
      </PopPanel>
    </aside>
  </div>;
}
function QuizContent(){
  return <div className="pp-detail-layout">
    <PopPanel eyebrow="PRACTICE · SELF CHECK" className="pp-quiz-panel">
      <div className="pp-section-meta"><MiniBadge>练习模式</MiniBadge> 理解一题，比刷十题更重要</div>
      <h1>检测你的理解</h1><p className="pp-intro">先独立选择，再看解释；答错也能重新尝试。</p><QuizCard/>
    </PopPanel>
    <aside className="pp-reading-side"><PopPanel title="练习进度" eyebrow="PRACTICE PROGRESS">
      <ProgressRing value={0} label="正式记录"/><p className="pp-quiet">这里是设计演示。正式课程答题数据由账号保存。</p>
    </PopPanel><PopPanel title="学习闭环" eyebrow="NEXT STEP">
      <p className="pp-quiet">阅读原理 → 动手验证 → 独立练习 → 返回来源。</p></PopPanel></aside>
  </div>;
}
export default function PixelPopHome(){
  const [density,setDensity]=useState<Density>("balanced");
  const [view,setView]=useState<View>("home");
  const [menuOpen,setMenuOpen]=useState(false);
  const [search,setSearch]=useState("");
  useEffect(()=>{
    try{const saved=localStorage.getItem("zhixu_pixel_pop_density");
      if(saved==="minimal"||saved==="balanced"||saved==="normal")setDensity(saved);}catch{/* storage unavailable */}
  },[]);
  function changeMode(mode:Density){setDensity(mode);try{localStorage.setItem("zhixu_pixel_pop_density",mode);}catch{/* storage unavailable */}}
  const title={home:"学习首页",reader:"沉浸阅读",lab:"交互实验",quiz:"理解练习"}[view];
  return <div className="pp-root" data-density={density}>
    <a className="pp-skip" href="#pp-main">跳转到主要内容</a>
    <div className="pp-frame">
      <header className="pp-topbar">
        <Link href="/" className="pp-brand" onClick={()=>setView("home")}><div className="pp-brand-icon"><GraduationCap size={25}/></div>
          <strong>知序 <span>Learning Hub</span></strong></Link>
        <div className="pp-search"><Search size={19}/><input type="search" aria-label="搜索演示页面" placeholder="搜索页面或知识点…"
          value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd>
          {!!search&&<div className="pp-search-result" role="status">试用入口：<Link href="/courses">查看正式课程列表</Link></div>}
        </div>
        <div className="pp-top-right">
          <span className="pp-demo-label">UI PREVIEW v1</span>
          <div className="pp-avatar"><Xiaozhi size={42} pose="avatar" mood="idle"/><span>小知</span></div>
          <button type="button" className="pp-mobile-menu" aria-label={menuOpen?"关闭导航":"打开导航"} onClick={()=>setMenuOpen(!menuOpen)}>
            {menuOpen?<X size={21}/>:<Menu size={21}/>}
          </button>
        </div>
      </header>
      <div className="pp-workspace">
        <aside className={"pp-sidebar"+(menuOpen?" pp-sidebar--open":"")}>
          <span className="pp-sidebar-caption">LEARNING SPACE</span>
          <nav aria-label="主导航">
            {SIDE_LINKS.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setMenuOpen(false)}
              className={"pp-nav-item"+(href==="/"?" pp-nav-item--active":"")}><Icon size={20}/><span>{label}</span></Link>)}
          </nav>
          <div className="pp-sidebar-bottom">
            <div className="pp-mascot-scene pp-decoration"><PixelCat size={102} cheer/></div>
            <div className="pp-sidebar-quote">把知识变成<br/><strong>真正的理解。</strong></div>
            <PopButton variant="yellow" href="/coursepacks">打开 CoursePack</PopButton>
            <Link href="/library" className="pp-side-link"><Settings2 size={16}/> 我的资料设置</Link>
          </div>
        </aside>
        <main id="pp-main" className="pp-main">
          <div className="pp-toolbar">
            <div><span className="pp-toolbar-overline">PIXEL POP DESIGN SYSTEM / {title}</span>
              <div className="pp-view-tabs" aria-label="页面演示">
                {NAV_VIEWS.map(v=><button type="button" key={v.id} aria-pressed={view===v.id}
                  className={view===v.id?"pp-tab pp-tab--current":"pp-tab"} onClick={()=>setView(v.id)}>{v.label}</button>)}
              </div>
            </div>
            <fieldset className="pp-density-switch"><legend>布局密度</legend>
              {DENSITIES.map(m=><button type="button" key={m.id}
                title={m.description} aria-pressed={density===m.id} onClick={()=>changeMode(m.id)}>{m.label}</button>)}
            </fieldset>
          </div>
          {view==="home"&&<DashboardContent go={setView}/>}
          {view==="reader"&&<ReaderContent go={setView}/>}
          {view==="lab"&&<LabContent/>}
          {view==="quiz"&&<QuizContent/>}
          <footer className="pp-footer">
            <span>知序 Pixel Pop v1 · 65% 新粗野主义 / 25% 像素学院 / 10% 留白</span>
            <span>当前为可交互 UI 概念页，所有进度与例题均为演示。</span>
          </footer>
        </main>
      </div>
    </div>
  </div>;
}
