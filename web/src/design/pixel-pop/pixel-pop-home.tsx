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
import {PopButton,PopPanel,PixelCat,ProgressRing} from "@/design/pixel-pop/primitives";
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
      <PixelCat size={50} cheer={selected===1}/>
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
          <MiniBadge><Sparkles size={15}/> 继续学习 · 示例课程</MiniBadge>
          <div className="pp-hero-route">数据结构 <b>›</b> 第 3 章 · 栈与队列</div>
          <h1>栈的 <em>Push / Pop</em></h1>
          <p>把资料变成可阅读、可操作、可练习的课程。今天从一个栈开始，理解后进先出。</p>
          <div className="pp-hero-ctas">
            <PopButton onClick={()=>go("reader")}>继续学习 <ArrowRight size={17}/></PopButton>
            <span className="pp-soft-text">这是一份交互演示，不代表真实学习进度</span>
          </div>
        </div>
        <div className="pp-hero-art" aria-hidden="true">
          <span className="pp-floating-label">PUSH!</span>
          <div className="pp-hero-block pp-hero-block--a">Push</div>
          <div className="pp-hero-block pp-hero-block--b">Pop</div>
          <div className="pp-hero-block pp-hero-block--c">Stack</div>
          <div className="pp-hero-cat"><PixelCat size={92}/></div>
        </div>
        <div className="pp-hero-dots pp-decoration" aria-hidden="true"/>
      </PopPanel>
      <PopPanel title="学习进度" eyebrow="DEMO PROGRESS" className="pp-progress-panel"
        actions={<Trophy size={23} color="#7440FF"/>}>
        <div className="pp-progress-layout">
          <ProgressRing value={40} label="示例进度"/>
          <div className="pp-lessons">
            {DEMO_LESSONS.map((lesson,i)=><div key={lesson.name}>
              <span className={lesson.done?"pp-dot pp-dot--done":"pp-dot"}>{lesson.done?"✓":i+1}</span>{lesson.name}
            </div>)}
          </div>
        </div>
        <small className="pp-quiet">正式学习记录将在私人 CoursePack 中保存。</small>
      </PopPanel>
    </div>
    <div className="pp-home-panels">
      <PopPanel title="今日学习" eyebrow="YOUR NEXT STEP" className="pp-today"
        actions={<Clock3 size={20}/>}>
        <button type="button" className="pp-task" onClick={()=>go("reader")}>
          <span className="pp-task-play"><Play size={21} fill="currentColor"/></span><span><strong>栈的 Push / Pop</strong><small>8 分钟 · 继续上次演示</small></span><ArrowRight size={18}/>
        </button>
        <button type="button" className="pp-task" onClick={()=>go("quiz")}>
          <span className="pp-task-play pp-task-play--yellow"><ListChecks size={22}/></span><span>
          <strong>章节练习</strong><small>理解检测 · 随时开始</small></span><ArrowRight size={18}/>
        </div>
        <div className="pp-home-cat pp-decoration"><PixelCat size={55} cheer/> <span>知识是一场冒险！</span></div>
      </PopPanel>
      <PopPanel title="我的学习资料" eyebrow="PRIVATE FEISHU LIBRARY" className="pp-library"
        actions={<Link href="/library" className="pp-inline-link">进入资料库 <ArrowRight size={15}/></Link>}>
        <p className="pp-quiet">连接自己的飞书空间，把原始资料转换成私人学习课程。</p>
        <div className="pp-file"><FileText size={20}/><div><strong>资料读取</strong><small>从飞书文档与 Office 资料开始</small></div><span>私有</span></div>
        <div className="pp-file"><BookOpenCheck size={20}/><div><strong>CoursePack</strong><small>导入结构化互动课程包</small></div><span>学习</span></div>
        <Link className="pp-library-cta" href="/library"><LibraryBig size={17}/> 打开我的飞书资料 <ArrowRight size={17}/></Link>
      </PopPanel>
      <PopPanel title="交互实验" eyebrow="TRY IT NOW" className="pp-small-lab"
        actions={<button className="pp-icon-action" type="button" onClick={()=>go("lab")} aria-label="打开完整实验"><ArrowRight size={20}/></button>}>
        <StackPlayground/>
      </PopPanel>
      <PopPanel title="练习检测" eyebrow="CHECK UNDERSTANDING" className="pp-small-quiz"
        actions={<button className="pp-icon-action" type="button" onClick={()=>go("quiz")} aria-label="打开练习"><ArrowRight size={20}/></button>}>
        <QuizCard compact/>
      </PopPanel>
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
          <div className="pp-avatar"><PixelCat size={42}/><span>小知</span></div>
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
