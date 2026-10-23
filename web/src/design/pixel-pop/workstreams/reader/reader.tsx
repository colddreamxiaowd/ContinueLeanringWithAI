"use client";

import {useEffect,useId,useState} from "react";
import type {ReactNode} from "react";
import {BookOpen,Check,CheckCircle2,ChevronDown,ChevronRight,Clipboard,ExternalLink,FileText,ImageOff,Play} from "lucide-react";
import {PopButton,PopPanel} from "../../primitives";
import s from "./reader.module.css";

/** Presentation types only. Import-time validation remains CoursePack's responsibility. */
export type ReaderInline={text:string;mark?:"yellow"|"blue"|"mint"|"strong";citationId?:string};
export type ReaderBlock=
  |{type:"paragraph";id?:string;content:readonly ReaderInline[]}
  |{type:"heading";id:string;number:string;title:string}
  |{type:"figure";id?:string;alt:string;caption?:string;content?:ReactNode;imageSrc?:string}
  |{type:"code";id?:string;language:string;code:string}
  |{type:"keyPoints";id?:string;title:string;items:readonly string[]}
  |{type:"activity";id:string;kind:"quiz"|"stack-simulator";label:string};
export type LessonData={id:string;title:string;breadcrumb:readonly string[];blocks:readonly ReaderBlock[]};
export type OutlineSection={id:string;label:string;status:"done"|"current"|"pending"};
export type OutlineChapter={id:string;label:string;sections:readonly OutlineSection[]};
/** Provenance is explicitly separate from the presence of a URL. */
export type CitationRecord={id:string;label:string;title:string;description:string;sourceTitle?:string;
  author?:string;publisher?:string;year?:string;location?:string;href?:string;
  provenance?:"demo"|"private"|"unverified"};

export function safeReaderHref(value?:string){
  if(!value||/[\u0000-\u001f\s]/.test(value))return undefined;
  if(value.startsWith("/")&&!value.startsWith("//")&&!value.startsWith("/\\"))return value;
  try{const url=new URL(value);return ["https:","http:"].includes(url.protocol)?url.href:undefined;}catch{return undefined;}
}
function safeFigurePath(value?:string){return value&&value.startsWith("/")&&!value.startsWith("//")&&!/[\\\u0000-\u001f\s]/.test(value)?value:undefined;}
function InlineText({items,activeCitationId,onCitationSelect}:{items:readonly ReaderInline[];
  activeCitationId?:string|null;onCitationSelect?:(id:string)=>void}){
  return <>{items.map((item,i)=>{
    const value=item.mark?<strong className={s["mark"+item.mark]}>{item.text}</strong>:item.text;
    return <span key={i}>{value}{item.citationId&&<button type="button" className={s.citationTag}
      title={`查看来源 ${item.citationId}`} aria-label={`查看引用 ${item.citationId}`}
      aria-controls="reader-citation-detail" aria-pressed={activeCitationId===item.citationId}
      onClick={()=>onCitationSelect?.(item.citationId!)}>{item.citationId.replace(/^[^0-9]+/, "")||item.citationId}</button>}</span>;
  })}</>;
}

/** The component contains only lesson UI; explanatory component labels belong to Demo. */
export function LessonContent({lesson,activeCitationId,onCitationSelect,onCopyCode,onOpenActivity,figureFallback}:{
  lesson:LessonData;activeCitationId?:string|null;onCitationSelect?:(id:string)=>void;
  onCopyCode?:(code:string)=>void|Promise<void>;onOpenActivity?:(id:string)=>void;figureFallback?:ReactNode;
}){
  const [copyState,setCopyState]=useState<{id:string;kind:"success"|"error"}|null>(null);
  async function copyCode(id:string,code:string){
    try{
      if(onCopyCode)await onCopyCode(code);
      else if(typeof navigator!=="undefined"&&navigator.clipboard)await navigator.clipboard.writeText(code);
      else throw new Error("clipboard unavailable");
      setCopyState({id,kind:"success"});
    }catch{setCopyState({id,kind:"error"});}
  }
  return <article className={s.component} data-reader-block="lesson" aria-label={lesson.title}>
    <PopPanel className={s.lessonPanel}>
      <nav className={s.breadcrumb} aria-label="课程位置">{lesson.breadcrumb.map((crumb,i)=><span key={i}>
        {i>0&&<ChevronRight size={13} aria-hidden="true"/>}<span>{crumb}</span></span>)}</nav>
      <h1 className={s.lessonTitle}><span className={s.titleIndex} aria-hidden="true">
        {lesson.breadcrumb.at(-1)?.match(/\d+(?:\.\d+)?/)?.[0]||"·"}</span><span>{lesson.title}</span></h1>
      <div className={s.lessonFlow}>{lesson.blocks.map((block,i)=>{
        const key=block.id||`${block.type}-${i}`;
        if(block.type==="heading")return <h2 tabIndex={-1} id={block.id} className={s.lessonHeading} key={key}>
          <span aria-hidden="true">{block.number}</span>{block.title}</h2>;
        if(block.type==="paragraph")return <p tabIndex={block.id?-1:undefined} id={block.id} className={s.lessonParagraph} key={key}>
          <InlineText items={block.content} activeCitationId={activeCitationId} onCitationSelect={onCitationSelect}/></p>;
        if(block.type==="figure")return <figure tabIndex={block.id?-1:undefined} id={block.id} className={s.figure} key={key}>
          <div className={s.figureBody} role="img" aria-label={block.alt}>
            {block.content??(safeFigurePath(block.imageSrc)?<img src={safeFigurePath(block.imageSrc)} alt="" loading="lazy"/>:
              (figureFallback??<span className={s.figureMissing}><ImageOff size={20}/>图示尚未提供</span>))}</div>
          {block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
        if(block.type==="code")return <section tabIndex={block.id?-1:undefined} id={block.id} className={s.codeBox} key={key} aria-label={`${block.language} 代码`}>
          <div className={s.codeHead}><span>{block.language} · 仅阅读，不执行代码</span>
            <PopButton variant="outline" onClick={()=>void copyCode(key,block.code)}>
              {copyState?.id===key&&copyState.kind==="success"?<Check size={14}/>:<Clipboard size={14}/>}
              {copyState?.id===key&&copyState.kind==="success"?"已复制":"复制"}</PopButton></div>
          <pre><code>{block.code}</code></pre>
          {copyState?.id===key&&<small role="status" className={s.copyStatus}>
            {copyState.kind==="success"?"代码已复制到剪贴板":"复制失败，请选择代码后手动复制"}</small>}</section>;
        if(block.type==="activity")return <section tabIndex={-1} id={block.id} key={key} className={s.activity}>
          <div><strong>{block.kind==="quiz"?"理解检测":"互动实验"}</strong><p>{block.label}</p></div>
          {onOpenActivity?<PopButton variant="blue" onClick={()=>onOpenActivity(block.id)}>进入活动</PopButton>:<span>请在课程学习区完成此活动</span>}</section>;
        return <aside tabIndex={block.id?-1:undefined} id={block.id} className={s.keyPoints} key={key}>
          <BookOpen size={19} aria-hidden="true"/><strong>{block.title}</strong>
          <ul>{block.items.map((item,j)=><li key={j}>{item}</li>)}</ul></aside>;
      })}</div>
    </PopPanel>
  </article>;
}

export function ChapterOutline({chapters,activeSectionId,onNavigate,defaultExpandedChapterIds,learningGoals}:{
  chapters:readonly OutlineChapter[];activeSectionId:string;onNavigate?:(id:string)=>void;
  defaultExpandedChapterIds?:readonly string[];learningGoals?:readonly {label:string;done:boolean}[];
}){
  const uid=useId().replace(/:/g,"-");
  const [expanded,setExpanded]=useState<ReadonlySet<string>>(()=>new Set(defaultExpandedChapterIds??chapters.slice(0,1).map(c=>c.id)));
  const [notice,setNotice]=useState("");
  useEffect(()=>{const chapter=chapters.find(c=>c.sections.some(x=>x.id===activeSectionId));
    if(chapter)setExpanded(old=>old.has(chapter.id)?old:new Set([...old,chapter.id]));
  },[activeSectionId,chapters]);
  function toggle(id:string){setExpanded(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  function navigate(id:string){
    onNavigate?.(id);
    const target=typeof document!=="undefined"?document.getElementById(id):null;
    if(target){target.scrollIntoView({block:"start",behavior:"auto"});target.focus({preventScroll:true});setNotice("");}
    else if(onNavigate)setNotice("");
    else setNotice("这一节尚未加载到当前正文，请通过课程导航打开后阅读。");
  }
  return <aside className={s.component} data-reader-block="outline" aria-label="章节大纲">
    <PopPanel className={s.outlinePanel}>
      <div className={s.cardHeading}><strong>章节目录</strong><span>OUTLINE</span></div>
      <nav className={s.outlineScroll} aria-label="章节目录">{chapters.map(chapter=>{
        const done=chapter.sections.filter(x=>x.status==="done").length;
        const total=chapter.sections.length;
        const open=expanded.has(chapter.id);
        return <div className={s.chapter} key={chapter.id}>
          <button type="button" className={s.chapterToggle} aria-expanded={open}
            aria-controls={`${uid}-outline-${chapter.id}`} onClick={()=>toggle(chapter.id)}>
            {open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}<strong>{chapter.label}</strong>
            <span>{done} / {total}</span></button>
          <div className={s.chapterContents} id={`${uid}-outline-${chapter.id}`} hidden={!open}>
            <div className={s.progressTrack} role="progressbar" aria-label={`${chapter.label} 已完成进度`}
              aria-valuemin={0} aria-valuemax={total||1} aria-valuenow={done}>
              <span style={{width:`${total?100*done/total:0}%`}}/></div>
            <ol>{chapter.sections.map(section=>{
              const isActive=section.id===activeSectionId;
              const visualStatus=isActive?"current":section.status==="done"?"done":"pending";
              return <li key={section.id}><button type="button" onClick={()=>navigate(section.id)}
                aria-current={isActive?"location":undefined} className={s.sectionLink} data-status={visualStatus}>
                <span className={s.statusIcon} aria-hidden="true">{visualStatus==="done"?<Check size={12}/>:visualStatus==="current"?<Play size={11} fill="currentColor"/>:null}</span>
                <span>{section.label}</span></button></li>;})}</ol>
          </div></div>;
      })}</nav>
      {notice&&<p className={s.outlineNotice} role="status">{notice}</p>}
    </PopPanel>
    {learningGoals&&<PopPanel className={s.goalsPanel}><h3>本章学习目标</h3>
      <ul>{learningGoals.map((goal,i)=><li key={i}><span className={goal.done?s.goalDone:s.goalPending} aria-hidden="true">
        {goal.done?<Check size={12}/>:null}</span>{goal.label}</li>)}</ul>
    </PopPanel>}
  </aside>;
}

/** Selection and hover-preview are separate: moving the pointer never overwrites a chosen citation. */
export function SourceCitation({citations,selectedId,onSelect}:{
  citations:readonly CitationRecord[];selectedId?:string|null;onSelect?:(id:string)=>void;
}){
  const [localId,setLocalId]=useState<string|null>(null);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const chosen=selectedId===undefined?localId:selectedId;
  const shownId=hoveredId??chosen;
  const active=shownId?citations.find(c=>c.id===shownId):citations[0];
  const missing=Boolean(shownId&&!active);
  function select(id:string){if(selectedId===undefined)setLocalId(id);setHoveredId(null);onSelect?.(id);}
  const href=active?.provenance==="demo"?undefined:safeReaderHref(active?.href);
  const tag=active?.provenance==="demo"?"合成演示 · 非真实来源":active?.provenance==="private"?"私人课程 · 未核实原文":"来源信息待核实";
  return <aside className={s.component} data-reader-block="citation" aria-label="来源引用">
    <PopPanel className={s.sourcePanel}>
      <div className={s.cardHeading}><strong>来源溯源</strong><span>REFERENCES</span></div>
      <p className={s.sourceHint}>点击正文编号可查看对应资料；列表悬停只做临时预览。</p>
      {active?<div id="reader-citation-detail" className={s.citationDetail} aria-live="polite" data-citation-id={active.id}>
        <div className={s.detailTitle}><span className={s.sourceNumber}>{active.label}</span><strong>{active.title}</strong></div>
        <span className={s.provenance} data-kind={active.provenance||"unverified"}>{tag}</span>
        <p>{active.description}</p>
        <div className={s.sourceDocument}><FileText size={23} aria-hidden="true"/>
          <div><strong>{active.sourceTitle||"未提供来源文件名"}</strong>
            <small>{[active.author,active.publisher,active.year,active.location].filter(Boolean).join(" · ")||"未提供精确位置"}</small></div></div>
        {href?<a className={s.openSource} href={href} target="_blank" rel="noopener noreferrer">
          打开资料链接 <ExternalLink size={14} aria-hidden="true"/></a>:<div className={s.noLink}>
          {active.provenance==="demo"?"演示引用不提供原文跳转":"尚无可用原文链接；可依据文件名及位置在资料库查找"}</div>}
      </div>:<p id="reader-citation-detail" className={s.emptyCitations} role="status">{missing?`未找到引用 ${shownId} 对应的来源记录。请检查 sourceRefIds。`:"当前课程尚无来源记录，请勿将内容视为已核实引用。"}</p>}
    </PopPanel>
    <PopPanel className={s.sourceListPanel}><div className={s.cardHeading}><strong>引用列表</strong><span>{citations.length} 条</span></div>
      <ol className={s.sourceList}>{citations.map(item=><li key={item.id}>
        <button className={s.sourceListButton} data-active={chosen===item.id} aria-pressed={chosen===item.id}
          type="button" onClick={()=>select(item.id)} onMouseEnter={()=>setHoveredId(item.id)}
          onMouseLeave={()=>setHoveredId(null)} onFocus={()=>setHoveredId(item.id)} onBlur={()=>setHoveredId(null)}>
          <span className={s.sourceNumber}>{item.label}</span><span><strong>{item.sourceTitle||item.title}</strong>
            <small>{[item.author,item.year,item.location].filter(Boolean).join(" · ")||"未提供精确位置"}</small>
          </span></button></li>)}</ol>
      {citations.length===0&&<p className={s.emptyCitations}>暂无可显示的引用列表</p>}
    </PopPanel>
  </aside>;
}