"use client";

import {useState} from "react";
import type {ReactNode} from "react";
import {BookOpen,Check,CheckCircle2,ChevronDown,ChevronRight,Clipboard,ExternalLink,FileText,Play} from "lucide-react";
import {PopButton,PopPanel} from "../../primitives";
import s from "./reader.module.css";

/** Supplied by a trusted CoursePack adapter; user/source text is rendered as text, never HTML. */
export type ReaderInline={text:string;mark?:"yellow"|"blue"|"mint"|"strong";citationId?:string};
export type ReaderBlock=
  |{type:"paragraph";id?:string;content:readonly ReaderInline[]}
  |{type:"heading";id:string;number:string;title:string}
  |{type:"figure";id?:string;alt:string;caption?:string;content:ReactNode}
  |{type:"code";id?:string;language:string;code:string}
  |{type:"keyPoints";id?:string;title:string;items:readonly string[]};
export type LessonData={id:string;title:string;breadcrumb:readonly string[];blocks:readonly ReaderBlock[]};
export type OutlineSection={id:string;label:string;status:"done"|"current"|"pending"};
export type OutlineChapter={id:string;label:string;sections:readonly OutlineSection[]};
export type CitationRecord={id:string;label:string;title:string;description:string;sourceTitle?:string;
  author?:string;publisher?:string;year?:string;location?:string;href?:string};

function NumberBadge({number}:{number:string}){return <span className={s.numberBadge} aria-hidden="true">{number}</span>;}
function Caption({number,title,description}:{number:string;title:string;description:string}){
  return <div className={s.componentCaption}><NumberBadge number={number}/><div className={s.captionWords}>
    <h2>{title}</h2><p>{description}</p></div></div>;
}
function InlineText({items,activeCitationId,onCitationSelect}:{items:readonly ReaderInline[];
  activeCitationId?:string|null;onCitationSelect?:(id:string)=>void}){
  return <>{items.map((item,i)=>{
    const value=item.mark?<strong className={s["mark"+item.mark]}>{item.text}</strong>:item.text;
    return <span key={i}>{value}{item.citationId&&<button type="button" className={s.citationTag}
      aria-label={`查看引用 ${item.citationId.replace(/^[^0-9]+/, "")||item.citationId}`} aria-pressed={activeCitationId===item.citationId}
      onClick={()=>onCitationSelect?.(item.citationId!)}>{item.citationId.replace(/^[^0-9]+/, "")||item.citationId}</button>}</span>;
  })}</>;
}

export function LessonContent({lesson,activeCitationId,onCitationSelect,onCopyCode,figureFallback}:{
  lesson:LessonData;activeCitationId?:string|null;onCitationSelect?:(id:string)=>void;
  onCopyCode?:(code:string)=>void;figureFallback?:ReactNode;
}){
  const [copied,setCopied]=useState<string|null>(null);
  async function copyCode(code:string){
    try {
      if(onCopyCode)onCopyCode(code);
      else if(typeof navigator!=="undefined"&&navigator.clipboard)await navigator.clipboard.writeText(code);
      else throw new Error("clipboard unavailable");
      setCopied(code);
    }catch{setCopied(null);}
  }
  return <div className={s.component} data-reader-block="lesson">
    <Caption number="1" title="LessonContent · 课文内容区" description="核心的学习内容展示区域，注重可读性与学习体验。"/>
    <PopPanel className={s.lessonPanel}>
      <nav className={s.breadcrumb} aria-label="课程位置">{lesson.breadcrumb.map((crumb,i)=><span key={i}>
        {i>0&&<ChevronRight size={12} aria-hidden="true"/>}<span>{crumb}</span></span>)}</nav>
      <h1 className={s.lessonTitle}><span className={s.titleIndex} aria-hidden="true">{lesson.breadcrumb.length?lesson.breadcrumb.at(-1)?.match(/\d+(?:\.\d+)?/)?.[0]||"·":"·"}</span>{lesson.title}</h1>
      <div className={s.lessonFlow}>{lesson.blocks.map((block,i)=>{
        const key=block.id||`${block.type}-${i}`;
        if(block.type==="heading")return <h2 id={block.id} className={s.lessonHeading} key={key}>
          <span>{block.number}</span>{block.title}</h2>;
        if(block.type==="paragraph")return <p id={block.id} className={s.lessonParagraph} key={key}>
          <InlineText items={block.content} activeCitationId={activeCitationId} onCitationSelect={onCitationSelect}/></p>;
        if(block.type==="figure")return <figure id={block.id} className={s.figure} key={key}>
          <div role="img" aria-label={block.alt} className={s.figureBody}>{block.content||figureFallback}</div>
          {block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
        if(block.type==="code")return <div id={block.id} className={s.codeBox} key={key}>
          <div className={s.codeHead}><span>{block.language}</span><PopButton variant="outline" onClick={()=>void copyCode(block.code)}>
            {copied===block.code?<Check size={14}/>:<Clipboard size={14}/>} {copied===block.code?"已复制":"复制"}</PopButton></div>
          <pre><code>{block.code}</code></pre></div>;
        return <div id={block.id} className={s.keyPoints} key={key}><BookOpen size={18} aria-hidden="true"/>
          <strong>{block.title}</strong><ul>{block.items.map((item,j)=><li key={j}>{item}</li>)}</ul></div>;
      })}</div>
    </PopPanel>
  </div>;
}

export function ChapterOutline({chapters,activeSectionId,onNavigate,defaultExpandedChapterIds,learningGoals}:{
  chapters:readonly OutlineChapter[];activeSectionId:string;onNavigate?:(id:string)=>void;
  defaultExpandedChapterIds?:readonly string[];learningGoals?:readonly {label:string;done:boolean}[];
}){
  const [expanded,setExpanded]=useState<ReadonlySet<string>>(()=>new Set(defaultExpandedChapterIds??chapters.slice(0,1).map(c=>c.id)));
  function toggle(id:string){setExpanded(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  return <div className={s.component} data-reader-block="outline">
    <Caption number="2" title="ChapterOutline · 章节大纲" description="展示课程结构，支持章节切换和阅读进度。"/>
    <PopPanel className={s.outlinePanel}>
      <div className={s.cardHeading}><strong>章节目录</strong><span className={s.eyebrow}>OUTLINE</span></div>
      <nav aria-label="章节目录">{chapters.map(chapter=>{
        const done=chapter.sections.filter(x=>x.status==="done").length;
        const total=chapter.sections.length;
        const open=expanded.has(chapter.id);
        return <div className={s.chapter} key={chapter.id}>
          <button type="button" className={s.chapterToggle} aria-expanded={open}
            aria-controls={`outline-${chapter.id}`} onClick={()=>toggle(chapter.id)}>
            {open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}<strong>{chapter.label}</strong>
            <span>{done} / {total}</span></button>
          {open&&<div className={s.chapterContents} id={`outline-${chapter.id}`}>
            <div className={s.progressTrack} role="progressbar" aria-label={`${chapter.label} 已完成进度`}
              aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <span style={{width:`${total?100*done/total:0}%`}}/></div>
            <ol>{chapter.sections.map(section=><li key={section.id}>
              <button type="button" onClick={()=>onNavigate?.(section.id)}
                aria-current={section.id===activeSectionId?"location":undefined}
                className={s.sectionLink} data-status={section.status}>
                <span className={s.statusIcon} aria-hidden="true">{section.status==="done"?<Check size={12}/>:section.status==="current"?<Play size={11} fill="currentColor"/>:null}</span>
                <span>{section.label}</span></button></li>)}</ol>
          </div>}</div>;
      })}</nav>
    </PopPanel>
    {learningGoals&&<PopPanel className={s.goalsPanel}><h3><span aria-hidden="true">🎯</span> 本章学习目标</h3>
      <ul>{learningGoals.map((goal,i)=><li key={i}><span className={goal.done?s.goalDone:s.goalPending} aria-hidden="true">
        {goal.done?<Check size={12}/>:null}</span>{goal.label}</li>)}</ul>
    </PopPanel>}
  </div>;
}

function safeHref(url?:string){return url&&(/^(https?:\/\/)/i.test(url)||(url.startsWith("/")&&!url.startsWith("//")))?url:undefined;}
export function SourceCitation({citations,selectedId,onSelect}:{
  citations:readonly CitationRecord[];selectedId?:string|null;onSelect?:(id:string)=>void;
}){
  const [localId,setLocalId]=useState<string|null>(null);
  const chosen=selectedId===undefined?localId:selectedId;
  const active=citations.find(c=>c.id===chosen)||citations[0];
  function select(id:string){if(selectedId===undefined)setLocalId(id);onSelect?.(id);}
  return <div className={s.component} data-reader-block="citation">
    <Caption number="3" title="SourceCitation · 来源引用" description="知识点溯源，支持悬停预览和跳转原文。"/>
    <PopPanel className={s.sourcePanel}>
      <div className={s.cardHeading}><strong>在正文中的引用标记</strong></div>
      <p className={s.sourceHint}>点击正文中的引用编号，或使用下面的引用列表，查看相应来源。</p>
      {active?<div className={s.citationDetail} aria-live="polite">
        <div className={s.detailTitle}><span className={s.sourceNumber}>{active.label}</span><strong>{active.title}</strong>
          {safeHref(active.href)&&<a href={safeHref(active.href)} target="_blank" rel="noopener noreferrer" aria-label={`打开 ${active.title} 的原始资料`}>
            <ExternalLink size={16}/></a>}</div>
        <p>{active.description}</p>
        {(active.sourceTitle||active.location)&&<div className={s.sourceDocument}><FileText size={26} aria-hidden="true"/>
          <div><strong>{active.sourceTitle||"来源资料"}</strong><small>{[active.author,active.publisher,active.year,active.location].filter(Boolean).join(" · ")}</small></div></div>}
      </div>:<p className={s.emptyCitations}>此课程尚未提供可核实的来源引用。</p>}
    </PopPanel>
    <PopPanel className={s.sourceListPanel}><div className={s.cardHeading}><strong>引用列表（文本）</strong><span>{citations.length} 条</span></div>
      <ol className={s.sourceList}>{citations.map(item=><li key={item.id}>
        <button className={s.sourceListButton} data-active={active?.id===item.id} aria-pressed={active?.id===item.id}
          type="button" onClick={()=>select(item.id)} onMouseEnter={()=>select(item.id)} onFocus={()=>select(item.id)}>
          <span className={s.sourceNumber}>{item.label}</span><span><strong>{item.sourceTitle||item.title}</strong>
            <small>{[item.author,item.year,item.location].filter(Boolean).join(" · ")}</small>
            {safeHref(item.href)&&<span className={s.openText}>查看原文 <ChevronRight size={12}/></span>}</span></button>
        </li>)}</ol>
    </PopPanel>
  </div>;
}
