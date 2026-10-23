"use client";

import {useEffect,useState} from "react";
import {BookOpen,FileText,FolderOpen} from "lucide-react";
import {BrandHeader} from "../../blocks/lego";
import {PopButton,PopPanel} from "../../primitives";
import {BreadcrumbTrail} from "./BreadcrumbTrail";
import {DensitySwitch} from "./DensitySwitch";
import type {PixelPopDensity} from "./DensitySwitch";
import {DEFAULT_SHELL_MAIN_ITEMS,DEFAULT_SHELL_ACCOUNT_ITEMS,SidebarMenuTrigger,SidebarNav} from "./SidebarNav";
import "./../../pixel-pop.css";
import styles from "./demo.module.css";

/**
 * Mount this exported workstream-only demo in the central /ui-lab router later.
 * No shared routes, home page, global CSS or real course records are modified here.
 */
export function ShellDemo(){
  const [density,setDensity]=useState<PixelPopDensity>("balanced");
  const [ready,setReady]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [active,setActive]=useState("home");
  const [lesson,setLesson]=useState(1);
  const [longTitle,setLongTitle]=useState(false);

  useEffect(()=>{
    const stored=localStorage.getItem("zhixu_pixel_pop_density");
    if(stored==="minimal"||stored==="balanced"||stored==="normal")setDensity(stored);
    setReady(true);
  },[]);
  useEffect(()=>{
    if(ready)localStorage.setItem("zhixu_pixel_pop_density",density);
  },[density,ready]);

  // Workbench-only navigation: click changes selected state without pretending routes exist.
  const demoItems=DEFAULT_SHELL_MAIN_ITEMS.map(item=>({
    ...item,href:undefined,onSelect:()=>setActive(item.id)
  }));
  const demoAccount=DEFAULT_SHELL_ACCOUNT_ITEMS.map(item=>({
    ...item,onSelect:()=>setActive(item.id)
  }));
  return <div className={["pp-root",styles.root].join(" ")} data-density={density}>
    <BrandHeader/>
    <main className={styles.main} id="shell-demo">
      <div className={styles.titleRow}>
        <div><span className={styles.eyebrow}>SESSION A · SHELL BLOCK LAB / 演示数据</span>
          <h1>框架与导航积木</h1>
          <p>独立预览：侧栏默认 / 折叠 / 移动端，三档密度，以及层级面包屑。</p></div>
        <SidebarMenuTrigger onClick={()=>setMobileOpen(true)}/>
      </div>
      <div className={styles.workspace}>
        <SidebarNav activeId={active} collapsed={collapsed} mobileOpen={mobileOpen}
          onMobileClose={()=>setMobileOpen(false)} mainItems={demoItems} accountItems={demoAccount}/>
        <div className={styles.content}>
          <PopPanel eyebrow="01 / NAVIGATION" title="SidebarNav · 侧边导航栏"
            actions={<PopButton variant="outline" onClick={()=>setCollapsed(v=>!v)}>
              {collapsed?"展开侧栏":"折叠侧栏"}</PopButton>}>
            <p className={styles.helper}>点击导航项目会更新当前选中状态。手机端用左上角菜单按钮打开抽屉。</p>
            <span className={styles.readout} role="status">当前导航：{active} · {collapsed?"收起":"展开"}</span>
          </PopPanel>
          <PopPanel eyebrow="02 / DENSITY" title="DensitySwitch · 页面密度">
            <div className={styles.densityRow}>
              <DensitySwitch value={density} onChange={setDensity}/>
              <span className={styles.helper}>真实切换 data-density：<b>{density==="minimal"?"舒适":density==="balanced"?"标准":"紧凑"}</b>。观察下方卡片行高、间距及边栏尺寸。</span>
            </div>
            <div className={styles.densityExamples} aria-label="相同内容的密度变化示例">
              <div className={styles.densitySample}><BookOpen size={21} aria-hidden="true"/><span><strong>数据结构：栈与队列</strong><small>相同学习条目 · 只改变排版密度</small></span></div>
              <div className={styles.densitySample}><FolderOpen size={21} aria-hidden="true"/><span><strong>我的飞书资料</strong><small>课程内容与保存状态保持不变</small></span></div>
              <div className={styles.densitySample}><FileText size={21} aria-hidden="true"/><span><strong>学习笔记：Push / Pop</strong><small>菜单、卡片、路径共同响应密度</small></span></div>
            </div>
          </PopPanel>
          <PopPanel eyebrow="03 / BREADCRUMBS" title="BreadcrumbTrail · 面包屑导航">
            <p className={styles.helper}>以下是明确标记的课程层级演示，不读取 CoursePack。</p>
            <div className={styles.trailTools}><PopButton variant="outline" onClick={()=>setLongTitle(v=>!v)}>{longTitle?"使用普通标题":"测试长中文标题"}</PopButton></div>
            <BreadcrumbTrail
              items={[
                {label:"首页",href:"#shell-demo"},
                {label:"数据结构",href:"#shell-demo"},
                {label:"第 3 章 栈与队列",href:"#shell-demo"},
                {label:longTitle?"3."+lesson+" 栈的 Push / Pop 操作与复杂数据结构算法实现原理讲解、课堂练习及学习笔记（长中文溢出测试）":"3."+lesson+" 栈的 "+(lesson===1?"基本概念":lesson===2?"Push / Pop":"应用")}
              ]}
              back={{label:"返回课程",onClick:()=>setLesson(1)}}
              previous={{label:"上一节",onClick:()=>setLesson(n=>Math.max(1,n-1)),disabled:lesson===1}}
              next={{label:"下一节",onClick:()=>setLesson(n=>Math.min(3,n+1)),disabled:lesson===3}}
            />
            <span className={styles.readout} role="status">演示章节：第 {lesson} / 3 节</span>
          </PopPanel>
          <section className={styles.visualNotes} aria-label="视觉验证项目">
            <strong>本批检查点</strong>
            <span>3px 粗描边 · 硬阴影 · 黑/黄/紫/蓝 · 键盘聚焦 · 390 / 768 / 1440</span>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
