"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen, Layers2, LayoutDashboard, GraduationCap, LibraryBig,
  FlaskConical, FolderOpen, History, Menu, X, Search, Command, CircleHelp, ArrowRight,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { courses } from '@/data/catalog';

const primary = [
  {href: '/', label: '学习总览', icon: LayoutDashboard},
  {href: '/courses', label: '课程体系', icon: Layers2},
  {href: '/read/circular-queue', label: '技术文章', icon: BookOpen},
  {href: '/experiments', label: '交互实验', icon: FlaskConical},
  {href: '/sources', label: '资料管理', icon: FolderOpen},
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const matches = courses.filter(c => `${c.title} ${c.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="app-frame">
    <a className="skip-link" href="#main">跳转到正文</a>
    {drawer && <button className="backdrop" aria-label="关闭导航" onClick={() => setDrawer(false)}/>}
    <aside className={`sidebar ${drawer ? 'sidebar--open' : ''}`}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><BookOpen size={23}/></div>
        <div><strong>知序 <span>Learning Hub</span></strong><small>把资料变成真正的理解</small></div>
        <button className="mobile-close" aria-label="关闭导航" onClick={() => setDrawer(false)}><X size={20}/></button>
      </div>
      <div className="sidebar-group-title">学习空间</div>
      <nav className="nav-items" aria-label="主导航">
        {primary.map(item => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          return <Link key={item.href} className={`nav-link ${active ? 'nav-link--active' : ''}`} href={item.href} aria-current={active ? 'page' : undefined} onClick={() => setDrawer(false)}><Icon size={18} strokeWidth={1.9}/>{item.label}</Link>;
        })}
      </nav>
      <div className="sidebar-group-title sidebar-group-title--space">我的课程</div>
      <nav className="nav-items" aria-label="课程快速入口">
        {courses.map(c => <Link href={`/courses/${c.slug}`} key={c.id} className={`nav-link ${pathname === `/courses/${c.slug}` ? 'nav-link--active' : ''}`} onClick={() => setDrawer(false)}><span className={`course-dot dot-${c.accent}`} />{c.title}</Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-notice"><GraduationCap size={17}/><div><strong>V4 审查版本</strong><span>V3 实验 + V4 日检审查</span></div></div>
        <div className="sidebar-footnote"><History size={15}/> 本阶段不记录真实学习进度</div>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-leading"><button className="icon-button menu-button" aria-label="打开导航" onClick={() => setDrawer(true)}><Menu size={21}/></button><span className="topbar-crumb">个人学习空间</span></div>
        <div className="topbar-search-wrap">
          <div className="topbar-search"><Search size={17}/><input type="search" aria-label="查找课程" placeholder="搜索课程…" value={search} onFocus={() => setSearchOpen(true)} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} onKeyDown={e => {if(e.key==='Escape')setSearchOpen(false)}}/><kbd>⌘ K</kbd></div>
          {searchOpen && search && <div className="search-results" role="region" aria-label="课程搜索结果">{matches.length ? matches.map(c=><Link href={`/courses/${c.slug}`} key={c.slug} onClick={()=>{setSearchOpen(false);setSearch('')}}><LibraryBig size={16}/>{c.title}<ArrowRight size={15}/></Link>):<div className="search-empty">没有匹配的课程</div>}</div>}
        </div>
        <div className="topbar-actions"><span className="demo-pill">V4 Preview</span><ThemeToggle/><span className="avatar" aria-label="个人空间">学</span></div>
      </header>
      <main id="main" className="page-content">{children}</main>
      <footer className="footer"><span>知序 Learning Hub · V4 自动检查审查</span><span><CircleHelp size={14}/> 数据为演示；未发布任何学习内容</span></footer>
    </div>
  </div>;
}
