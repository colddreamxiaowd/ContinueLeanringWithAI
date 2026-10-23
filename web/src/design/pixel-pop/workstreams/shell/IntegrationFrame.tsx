"use client";

import {useEffect,useState,type ReactNode} from "react";
import {BrandHeader} from "../../blocks/lego";
import "../../pixel-pop.css";
import {SidebarMenuTrigger,SidebarNav,type ShellNavItem,type ShellNavIcon} from "./SidebarNav";
import {DensitySwitch,type PixelPopDensity} from "./DensitySwitch";
import {BreadcrumbTrail,type BreadcrumbItem,type BreadcrumbAction} from "./BreadcrumbTrail";
import styles from "./integration.module.css";

/**
 * Session A's integration boundary. Accepts B/C/D through children — never
 * imports or rewrites other owners' components. One parent .pp-root controls
 * density across the full page; the integrator supplies real route URLs.
 */
export type IntegrationSurface = "home" | "courses" | "reader" | "practice";
export type IntegrationNavigation = {
  id:IntegrationSurface;
  label:string;
  href:string;
  icon:ShellNavIcon;
};
export function ShellIntegrationFrame({
  surface, navigation, crumbs, back, previous, next,
  presentation="demo", showBrandHeader=true, children,
}:{
  surface:IntegrationSurface;
  navigation:readonly IntegrationNavigation[];
  crumbs:readonly BreadcrumbItem[];
  /** The real course parent route; never infer it from nav item order. */
  back?:BreadcrumbAction;
  /** Demo remains unchanged; I uses app for the three production routes. */
  presentation?:"demo"|"app";
  /** Prevent duplicate headers when I mounts one at the shared layout level. */
  showBrandHeader?:boolean;
  previous?:BreadcrumbAction;
  next?:BreadcrumbAction;
  children:ReactNode;
}){
  const [density,setDensity]=useState<PixelPopDensity>("balanced");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    try {
      const stored=localStorage.getItem("zhixu_pixel_pop_density");
      if(stored==="minimal"||stored==="balanced"||stored==="normal")setDensity(stored);
      setCollapsed(sessionStorage.getItem("zhixu_shell_collapsed")==="true");
    } catch {}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try {localStorage.setItem("zhixu_pixel_pop_density",density);} catch {}
  },[density,ready]);
  useEffect(()=>{
    if(!ready)return;
    try {sessionStorage.setItem("zhixu_shell_collapsed",String(collapsed));} catch {}
  },[collapsed,ready]);

  const primary:readonly ShellNavItem[]=navigation.map(({id,label,href,icon})=>({
    id,label,href,icon,subtitle:id==="home"?"HOME":id==="courses"?"MY COURSES":id==="reader"?"READING":"PRACTICE"
  }));
  const account:readonly ShellNavItem[]=[
    {id:"settings",label:"设置",subtitle:"SETTINGS",icon:"settings"}
  ];
  const current=navigation.find(item=>item.id===surface);
  return <div className={"pp-root "+styles.root} data-density={density}
    data-integration-surface={surface} data-shell-ready={ready?"true":"false"}>
    {showBrandHeader&&<BrandHeader/>}
    <main className={styles.main} aria-label={presentation==="demo"?"知序真实组件拼装验收":"知序学习工作台"}>
      <header className={styles.header}>
        <div className={styles.heading}>
          {presentation==="demo"&&<span className={styles.eyebrow}>SESSION A × B/C/D · REAL COMPONENT QA · DEMO</span>}
          <h1>{current?.label||"学习中心"}</h1>
          {presentation==="demo"&&<p>课程资料与进度仅为演示，导航为真实路由，所有页面共享同一密度设置。</p>}
        </div>
        <div className={styles.actions}>
          <DensitySwitch value={density} onChange={setDensity}/>
          <button type="button" className={styles.collapse} onClick={()=>setCollapsed(x=>!x)}>
            {collapsed?"展开侧栏":"折叠侧栏"}
          </button>
          <SidebarMenuTrigger onClick={()=>setMobileOpen(true)}/>
        </div>
      </header>
      <div className={styles.layout}>
        <SidebarNav activeId={surface} mainItems={primary} accountItems={account}
          collapsed={collapsed} mobileOpen={mobileOpen}
          onMobileClose={()=>setMobileOpen(false)}/>
        <section className={styles.content} aria-label={current?.label||"学习内容"}>
          <BreadcrumbTrail items={crumbs}
            back={back??(presentation==="demo"?{label:"返回课程",href:navigation[0]?.href}:undefined)}
            previous={previous} next={next}/>
          <div className={styles.slot}>{children}</div>
        </section>
      </div>
    </main>
  </div>;
}
