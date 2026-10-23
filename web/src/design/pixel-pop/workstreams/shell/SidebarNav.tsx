"use client";

import Link from "next/link";
import {useEffect} from "react";
import {
  BookOpen, Bookmark, CalendarDays, ChevronRight, FileText, FolderOpen,
  Home, Menu, Settings, Star, Trash2, UserRound, X
} from "lucide-react";
import styles from "./shell.module.css";

export type ShellNavIcon = "home"|"courses"|"docs"|"plan"|"favorites"|"trash"|"profile"|"settings";
export type ShellNavItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: ShellNavIcon;
  href?: string;
  onSelect?: () => void;
};

const ICONS = {
  home: Home, courses: FileText, docs: FolderOpen, plan: CalendarDays,
  favorites: Bookmark, trash: Trash2, profile: UserRound, settings: Settings
} as const;

/** Missing routes deliberately stay disabled: no fictitious destination or learning data. */
export const DEFAULT_SHELL_MAIN_ITEMS: readonly ShellNavItem[] = [
  {id:"home",label:"首页",subtitle:"HOME",icon:"home",href:"/"},
  {id:"courses",label:"我的课程",subtitle:"MY COURSES",icon:"courses",href:"/courses"},
  {id:"docs",label:"飞书资料",subtitle:"FEISHU DOCS",icon:"docs",href:"/library"},
  {id:"plan",label:"学习计划",subtitle:"STUDY PLAN",icon:"plan"},
  {id:"favorites",label:"收藏夹",subtitle:"FAVORITES",icon:"favorites"},
  {id:"trash",label:"回收站",subtitle:"TRASH",icon:"trash"}
];
export const DEFAULT_SHELL_ACCOUNT_ITEMS: readonly ShellNavItem[] = [
  {id:"profile",label:"个人中心",subtitle:"PROFILE",icon:"profile"},
  {id:"settings",label:"设置",subtitle:"SETTINGS",icon:"settings"}
];

type Props = {
  activeId?: string;
  mainItems?: readonly ShellNavItem[];
  accountItems?: readonly ShellNavItem[];
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onNavigate?: (id:string) => void;
  className?: string;
};

export function SidebarNav({
  activeId="home",mainItems=DEFAULT_SHELL_MAIN_ITEMS,
  accountItems=DEFAULT_SHELL_ACCOUNT_ITEMS,collapsed=false,
  mobileOpen=false,onMobileClose,onNavigate,className=""
}:Props){
  useEffect(()=>{
    if(!mobileOpen)return;
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")onMobileClose?.();};
    window.addEventListener("keydown",key);
    return ()=>window.removeEventListener("keydown",key);
  },[mobileOpen,onMobileClose]);

  function links(items:readonly ShellNavItem[]){
    return items.map(item=>{
      const Icon=ICONS[item.icon]||BookOpen;
      const active=item.id===activeId;
      const cls=[styles.navLink,active?styles.active:""].filter(Boolean).join(" ");
      const children=<>
        <Icon size={22} strokeWidth={2.4} aria-hidden="true" className={styles.navIcon}/>
        <span className={styles.navText}><strong>{item.label}</strong>
          {item.subtitle&&<small>{item.subtitle}</small>}</span>
        <ChevronRight size={16} aria-hidden="true" className={styles.mobileChevron}/>
      </>;
      const done=()=>{item.onSelect?.();onNavigate?.(item.id);onMobileClose?.();};
      return <li key={item.id} className={styles.navEntry}>
        {item.href?
          <Link className={cls} href={item.href} aria-current={active?"page":undefined}
            title={collapsed?item.label:undefined} onClick={done}>{children}</Link>:
          item.onSelect?
            <button type="button" className={cls} aria-current={active?"page":undefined}
              title={collapsed?item.label:undefined} onClick={done}>{children}</button>:
            <span className={[cls,styles.disabled].join(" ")} aria-disabled="true"
              title={item.label+" · 暂未接入"}>{children}</span>}
      </li>;
    });
  }

  return <div className={[styles.navShell,className].filter(Boolean).join(" ")}
    data-collapsed={collapsed?"true":"false"} data-mobile-open={mobileOpen?"true":"false"}>
    {mobileOpen&&<button type="button" className={styles.scrim} aria-label="关闭侧边导航"
      onClick={onMobileClose}/>}
    <aside className={styles.sidebar} aria-label="学习中心侧边导航">
      <div className={styles.mobileHeading}>
        <strong>知序 <span>Learning Hub</span></strong>
        <button type="button" aria-label="关闭导航菜单" onClick={onMobileClose}><X size={22}/></button>
      </div>
      <nav aria-label="主要导航" className={styles.nav}>
        <ul className={styles.navList}>{links(mainItems)}</ul>
      </nav>
      <div className={styles.navDivider} aria-hidden="true"/>
      <nav aria-label="账户导航" className={styles.accountNav}>
        <ul className={styles.navList}>{links(accountItems)}</ul>
      </nav>
    </aside>
  </div>;
}

/** Header integration hook for mobile; the shared BrandHeader remains owned by integrator. */
export function SidebarMenuTrigger({onClick}:{onClick:()=>void}){
  return <button type="button" className={styles.menuTrigger} aria-label="打开侧边导航"
    onClick={onClick}><Menu size={22}/></button>;
}
