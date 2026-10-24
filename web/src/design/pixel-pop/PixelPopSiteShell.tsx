"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {BookOpen,FlaskConical,FolderOpen,GraduationCap,Home,LibraryBig,Menu,Moon,Search,Settings2,Sun,X} from "lucide-react";
import {PixelCat,PopButton} from "./primitives";
import "./pixel-pop.css";
import "./site-shell.css";

export type PixelDensity="minimal"|"balanced"|"normal";
const NAV=[
 {href:"/",label:"首页",icon:Home},
 {href:"/learn",label:"私人学习",icon:GraduationCap},
 {href:"/learn/plans",label:"三模式制课",icon:BookOpen},
 {href:"/learn/gpt-handoff",label:"ChatGPT 制课交接",icon:BookOpen},
 {href:"/coursepacks",label:"互动课程",icon:GraduationCap},
 {href:"/courses",label:"课程体系",icon:BookOpen},
 {href:"/library",label:"我的飞书资料",icon:LibraryBig},
 {href:"/experiments",label:"交互实验",icon:FlaskConical},
 {href:"/sources",label:"来源资料",icon:FolderOpen}
] as const;
const DENSITIES:{id:PixelDensity;label:string}[]=[
 {id:"minimal",label:"极简"},{id:"balanced",label:"较简"},{id:"normal",label:"正常"}
];
export function PixelPopSiteShell({children,title="个人学习空间",toolbar,density,onDensityChange}:{
 children:ReactNode;title?:string;toolbar?:ReactNode;density?:PixelDensity;
 onDensityChange?:(next:PixelDensity)=>void
}){
 const pathname=usePathname();
 const [storedDensity,setStoredDensity]=useState<PixelDensity>("balanced");
 const [menuOpen,setMenuOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [mobileSearchOpen,setMobileSearchOpen]=useState(false);
 const searchInput=useRef<HTMLInputElement>(null);
 const [dark,setDark]=useState(false);
 const [hydrated,setHydrated]=useState(false);
 const currentDensity=density??storedDensity;
 useEffect(()=>{
  try{
   const prior=localStorage.getItem("zhixu_pixel_pop_density");
   if(prior==="minimal"||prior==="balanced"||prior==="normal"){
    setStoredDensity(prior);onDensityChange?.(prior);
   }
   setDark(localStorage.getItem("learninghub.theme")==="dark");
  }catch{}
  setHydrated(true);
 },[]);
 useEffect(()=>{if(mobileSearchOpen)searchInput.current?.focus();},[mobileSearchOpen]);
 function switchDensity(value:PixelDensity){
  setStoredDensity(value);onDensityChange?.(value);
  try{localStorage.setItem("zhixu_pixel_pop_density",value)}catch{}
 }
 function switchTheme(){
  setDark(previous=>{
   try{localStorage.setItem("learninghub.theme",previous?"light":"dark")}catch{}
   return !previous;
  });
 }
 function active(href:string){
  if(href==="/")return pathname==="/";
  if(href==="/learn")return pathname==="/learn";
  return pathname===href||pathname.startsWith(href+"/");
 }
 return <div className="pp-root pp-site-shell" data-density={currentDensity}
   data-pp-theme={dark?"dark":"light"} data-site-shell-ready={hydrated?"true":"false"}>
  <a className="pp-skip" href="#pp-main">跳转到主要内容</a>
  <div className="pp-frame">
   <header className="pp-topbar">
    <Link href="/" className="pp-brand" aria-label="知序 Learning Hub 首页">
     <div className="pp-brand-icon"><GraduationCap size={25}/></div>
     <strong>知序 <span>Learning Hub</span></strong>
    </Link>
    <button type="button" className="pp-site-search-toggle" aria-label={mobileSearchOpen?"收起搜索":"展开课程搜索"} aria-expanded={mobileSearchOpen}
      onClick={()=>setMobileSearchOpen(x=>!x)}><Search size={18}/></button>
    <form className={"pp-search pp-site-search"+(mobileSearchOpen?" pp-site-search--open":"")} action="/courses" role="search">
     <Search size={19}/>
     <input ref={searchInput} name="q" type="search" aria-label="搜索课程" placeholder="搜索课程或知识点…"
      value={query} onChange={e=>setQuery(e.target.value)}/>
     <kbd>↵</kbd>
    </form>
    <div className="pp-top-right">
     <span className="pp-demo-label">知序 · LEARNING HUB</span>
     <button type="button" className="pp-site-theme" aria-label={dark?"切换浅色主题":"切换深色主题"}
      title={dark?"切换浅色主题":"切换深色主题"} onClick={switchTheme}>
      {dark?<Sun size={19}/>:<Moon size={19}/>}
     </button>
     <div className="pp-avatar"><PixelCat size={42}/><span>小知</span></div>
     <button type="button" className="pp-mobile-menu" aria-label={menuOpen?"关闭导航":"打开导航"}
      aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>
      {menuOpen?<X size={21}/>:<Menu size={21}/>}
     </button>
    </div>
   </header>
   <div className="pp-workspace">
    <aside className={"pp-sidebar"+(menuOpen?" pp-sidebar--open":"")}>
     <span className="pp-sidebar-caption">LEARNING SPACE</span>
     <nav aria-label="主导航">
      {NAV.map(({href,label,icon:Icon})=><Link key={href} href={href}
       aria-current={active(href)?"page":undefined} onClick={()=>setMenuOpen(false)}
       className={"pp-nav-item"+(active(href)?" pp-nav-item--active":"")}>
       <Icon size={20}/><span>{label}</span>
      </Link>)}
     </nav>
     <div className="pp-sidebar-bottom">
      <div className="pp-mascot-scene pp-decoration"><PixelCat size={102} cheer/></div>
      <div className="pp-sidebar-quote">把知识变成<br/><strong>真正的理解。</strong></div>
      <PopButton variant="yellow" href="/learn">打开私人学习</PopButton>
      <Link href="/library" className="pp-side-link"><Settings2 size={16}/> 我的资料设置</Link>
     </div>
    </aside>
    <main id="pp-main" className="pp-main">
     {toolbar??<header className="pp-toolbar pp-site-toolbar">
      <div><span className="pp-toolbar-overline">PIXEL POP / {title}</span>
       <strong>{title}</strong>
      </div>
      <fieldset className="pp-density-switch"><legend>布局密度</legend>
       {DENSITIES.map(item=><button type="button" key={item.id}
        aria-pressed={currentDensity===item.id} onClick={()=>switchDensity(item.id)}>{item.label}</button>)}
      </fieldset>
     </header>}
     {children}
     <footer className="pp-footer"><span>知序 Learning Hub · Pixel Pop</span>
      <span>课程来源与学习记录以当前账号权限为准；演示内容会明确标记。</span>
     </footer>
    </main>
   </div>
  </div>
 </div>;
}
