"use client";

import {useEffect,useState} from "react";
import {ChapterOutline,LessonContent,SourceCitation} from "./reader";
import type {CitationRecord,LessonData,OutlineChapter,ReaderBlock} from "./reader";
import {adaptCoursePackV01} from "./coursepack-adapter.mjs";
import "../../pixel-pop.css";
import s from "./reader.module.css";
import {StudyDiagram} from "./StudyDiagram";

const chapters:readonly OutlineChapter[]=[
  {id:"ch3",label:"第 3 章 栈与队列",sections:[
    {id:"s31",label:"3.1 栈的基本概念",status:"done"},
    {id:"s32",label:"3.2 栈的 Push / Pop",status:"current"},
    {id:"s33",label:"3.3 栈的应用场景",status:"pending"},
    {id:"s34",label:"3.4 综合练习",status:"pending"},
    {id:"s35",label:"3.5 章节测验",status:"pending"}]},
  {id:"ch4",label:"第 4 章 链表及其操作",sections:[
    {id:"s41",label:"4.1 单链表的结构与常见操作（长标题测试）",status:"pending"},
    {id:"s42",label:"4.2 头节点与插入删除操作",status:"pending"}]},
  {id:"ch5",label:"第 5 章 树与二叉树",sections:[{id:"s51",label:"5.1 树的概念",status:"pending"}]}
];
const references:readonly CitationRecord[]=[
  {id:"cite-1",label:"1",title:"LIFO（后进先出）",description:"合成教学内容：用于演示栈操作原理、引用悬停和来源定位，尚未与原著核对。",
    sourceTitle:"数据结构示例讲义.pptx",location:"合成示例 · 第 12 页",provenance:"demo"},
  {id:"cite-2",label:"2",title:"Stack ADT 与 Push / Pop",description:"合成示意引用：Push 将元素放入栈顶，Pop 移除并返回栈顶元素。",
    sourceTitle:"算法课程样例笔记.md",location:"合成示例 · 第 3 节",provenance:"demo"}
];
function StackFigure(){return <div className={s.stackScene}>
  <div className={s.stackLabels}><span>栈顶 (Top) →</span><span>栈底 (Bottom) →</span></div>
  <div className={s.stackTower}><span>3</span><span>2</span><span>1</span></div>
  <div className={s.stackCallout}><strong>后进先出（LIFO）</strong><small>最后进入的元素，最先被取出。</small></div>
</div>;}
const lesson:LessonData={id:"demo-stack",title:"栈的 Push / Pop",breadcrumb:["数据结构","第 3 章 栈与队列","3.2 栈的 Push / Pop"],blocks:[
  {type:"paragraph",content:[{text:"栈（Stack）是一种 "},{text:"后进先出（LIFO）",mark:"yellow"},{text:" 的线性表，它的两个核心操作是 "},
    {text:"Push（入栈）",mark:"blue"},{text:" 和 "},{text:"Pop（出栈）",mark:"mint"},
    {text:"。通过这两个操作，我们可以高效地管理数据的插入和删除。",citationId:"cite-1"}]},
  {type:"heading",id:"s31",number:"1",title:"栈的基本概念"},
  {type:"paragraph",content:[{text:"栈只允许在一端进行插入和删除操作，这一端被称为 "},{text:"栈顶（Top）",mark:"yellow"},{text:"。最后进入栈的元素总是最先被取出。为了让学习过程更清晰，我们把定义、可视化和操作分开呈现。"}]},
  {type:"figure",id:"stack-figure",alt:"三层栈示意，从下到上依次是 1、2、3，顶部元素 3 先出栈",content:<StudyDiagram kind="stack"/>,caption:"图 1 · 后进先出操作示意（合成演示，不是 CoursePack 原图）"},
  {type:"paragraph",content:[{text:"如果用三个抽象方块从下往上模拟入栈过程，1 是最早进入的元素，而 3 是当前最晚进入的元素。观察箭头可以发现：栈并不要求我们遍历中间元素，而是每次只访问顶部。这既是栈的约束，也是它在某些场景下非常高效的原因。"}]},
  {type:"heading",id:"s32",number:"2",title:"Push（入栈）操作"},
  {type:"paragraph",content:[{text:"Push 将元素放入栈顶；使用数组动态追加时，均摊时间复杂度通常为 O(1)。",citationId:"cite-2"}]},
  {type:"code",id:"demo-code",language:"Python",code:"# 使用列表实现栈\nclass Stack:\n    def __init__(self):\n        self.stack = []\n\n    def push(self, x):\n        self.stack.append(x)  # 均摊 O(1)"},
  {type:"paragraph",content:[{text:"当新的元素被追加到栈顶时，原有元素的相对顺序不会改变。例如，从 [1, 2, 3] 依次操作 Push(4) 和 Pop()，你最终仍然得到 [1, 2, 3]。对于 Python 列表，这种追加操作的复杂度更准确地说是均摊 O(1)。"}]},
  {type:"heading",id:"demo-pop",number:"3",title:"Pop（出栈）操作"},
  {type:"paragraph",content:[{text:"Pop 取走当前栈顶并返回它。如果栈已经为空，出栈必须给出明确的失败反馈；否则调用方就无法判断返回值是否有效。执行连续操作时，不妨自己写下栈的变化：Push(2) → Push(5) → Pop()，先离开的是 5。"}]},
  {type:"keyPoints",id:"key-stack",title:"本节知识点总结",items:["Push 总是在栈顶插入元素，Pop 从栈顶移除元素。","后进先出（LIFO）决定了数据的实际访问顺序。","Python 列表的 append 通常是均摊 O(1)，并非每次必然恒定。","空栈、满栈等边界需要明确设计。"]},
  {type:"heading",id:"s33",number:"4",title:"栈的应用场景"},
  {type:"paragraph",content:[{text:"函数调用栈、表达式求值和撤销操作，都可以利用栈的后进先出性质。当你在编辑器里连续输入、删除和修改内容时，撤销通常要优先撤销最后一次操作，因此栈比队列更自然。"}]},
  {type:"paragraph",content:[{text:"括号匹配是另一个典型例子：读到左括号就入栈；遇到右括号时，检查最近一个未关闭的左括号。如果出现空栈或者类型不匹配，就说明表达式存在问题。"}]},
  {type:"heading",id:"s34",number:"5",title:"综合练习"},
  {type:"paragraph",content:[{text:"尝试自己写出三次 Push 后执行 Pop 的结果，并解释元素顺序为什么改变。"}]},
  {type:"heading",id:"s35",number:"6",title:"章节测验"},
  {type:"activity",id:"demo-quiz",kind:"quiz",label:"练习内容由 CoursePack 交互组件负责渲染。"},
  {type:"heading",id:"s41",number:"6",title:"单链表结构（跨章示意）"},
  {type:"paragraph",content:[{text:"链表通过节点之间的引用组织数据，与栈、队列所描述的访问规则是两个不同维度。一个栈可以使用数组实现，也可以使用链表实现。读者应该先区分数据结构的抽象行为与具体存储方式。"}]},
  {type:"paragraph",content:[{text:"链表的每个节点保存数据与指向下一节点的引用。这样的设计使得某些位置的插入和删除无需整体移动元素，但查找指定位置仍可能需要遍历。"}]},
  {type:"heading",id:"s42",number:"7",title:"插入删除操作"},
  {type:"paragraph",content:[{text:"如果已经拿到目标节点或其前驱节点，可以在局部修改引用关系；不过需要特别注意空链表、首尾节点与断链等边界。对读者来说，画出引用前后的结构，比单纯背诵函数名更有效。"}]},
  {type:"heading",id:"s51",number:"8",title:"树的概念"},
  {type:"paragraph",content:[{text:"树的层级关系可以刻画文件夹、组织结构和语法表达式。与线性表不同，树节点可以拥有多个子节点；因此遍历树时，前序、后序和层序策略呈现不同的观察顺序。"}]},
  {type:"paragraph",content:[{text:"本节只是用于检查跨章目录与长文本布局，不代表真实教材内容。正式课程将依据 CoursePack 章节数据生成阅读块，并保存到用户账号。"}]}
]};
/** Actual v0.1 fields, but the instance is synthetic and never persisted. */
const coursePackDemo={schemaVersion:"0.1",title:"数据结构 · 安静阅读样例",description:"合成示例",version:1,
  sourceRefs:[{id:"mock-12",fileName:"虚拟教材讲义.pptx",locator:"第12页"}],
  chapters:[{id:"stack",title:"Push、Pop 与栈",blocks:[
    {id:"concept",type:"explanation",markdown:"栈遵循后进先出（LIFO）。它有严格的操作位置限制。",sourceRefIds:["mock-12"]},
    {id:"more",type:"explanation",markdown:"Push 是入栈，Pop 是出栈。\n\n学习内容由 JSON 字段安全转换为文本，不解析 HTML。"},
    {id:"sourcecode",type:"code",language:"python",source:"stack = []\nstack.append(3)\nprint(stack.pop())"},
    {id:"simulator",type:"stack-simulator",initial:[3,7],capacity:6},
    {id:"quiz",type:"quiz",prompt:"最后放入栈中的元素是否最先弹出？",options:["是","否"],answerIndex:0}]}]};

function editorialLesson(chapterId:string):LessonData{
  const split=(id:string)=>lesson.blocks.findIndex(x=>x.type==="heading"&&x.id===id);
  const start=chapterId==="ch4"?split("s41"):chapterId==="ch5"?split("s51"):0;
  const end=chapterId==="ch3"?split("s41"):chapterId==="ch4"?split("s51"):lesson.blocks.length;
  const title=chapterId==="ch4"?"链表与节点":chapterId==="ch5"?"树与层级结构":lesson.title;
  return {...lesson,title,breadcrumb:chapterId==="ch3"?lesson.breadcrumb:["数据结构",chapters.find(x=>x.id===chapterId)?.label||"课程内容"],blocks:lesson.blocks.slice(start,end)};
}
export function ReaderDemo({fullPage=false}:{fullPage?:boolean}={}){
  const [density,setDensity]=useState<"minimal"|"balanced"|"normal">("balanced");
  const [sourceMode,setSourceMode]=useState<"editorial"|"coursepack">("editorial");
  const [selectedChapterId,setSelectedChapterId]=useState("ch3");
  const [mobileOutlineOpen,setMobileOutlineOpen]=useState(false);
  const [mobileCitationOpen,setMobileCitationOpen]=useState(false);
  const [jumpId,setJumpId]=useState<string|null>(null);
  function navigateTo(id:string){
    setMobileOutlineOpen(false);
    setActiveSectionId(id);setJumpId(id);
    const targetChapter=chapters.find(c=>c.sections.some(section=>section.id===id));
    if(targetChapter&&sourceMode==="editorial"){setSelectedChapterId(targetChapter.id);if(targetChapter.id!=="ch3")setSelectedCitationId(null);}
  }
  useEffect(()=>{
    if(!jumpId)return;
    const frame=requestAnimationFrame(()=>{const node=document.getElementById(jumpId);
      if(node){node.scrollIntoView({block:"start",behavior:"auto"});node.focus({preventScroll:true});}
      setJumpId(null);
    });
    return ()=>cancelAnimationFrame(frame);
  },[jumpId,selectedChapterId,sourceMode]);
  const mapped=adaptCoursePackV01(coursePackDemo,{mode:"demo",completedBlockIds:["concept"],activeBlockId:"more"});
  const currentLesson=sourceMode==="editorial"?editorialLesson(selectedChapterId):mapped.lesson as LessonData;
  const currentChapters=sourceMode==="editorial"?chapters:mapped.chapters as OutlineChapter[];
  const currentCitations=sourceMode==="editorial"?(selectedChapterId==="ch3"?references:[]):mapped.citations as CitationRecord[];
  const [activeSectionId,setActiveSectionId]=useState("s32");
  const [selectedCitationId,setSelectedCitationId]=useState<string|null>("cite-1");
  useEffect(()=>{if(sourceMode==="coursepack"){setActiveSectionId("more");setSelectedCitationId("mock-12");}
    else {setSelectedChapterId("ch3");setActiveSectionId("s32");setSelectedCitationId("cite-1");}},[sourceMode]);
  const selectCitation=(id:string)=>{setSelectedCitationId(id);if(typeof window!=="undefined"&&window.innerWidth<=680)setMobileCitationOpen(true);};
  return <div className={`pp-root ${s.demoPage}`} data-density={density} data-session-c-live={fullPage?"true":undefined}>
    <div className={s.demoFrame}>
      <header className={s.demoTop}><div><p>知序 Learning Hub · Pixel Pop / Session C</p>
        <h1>{fullPage?"从栈理解后进先出":"深度阅读组件"} <span>{fullPage?"COURSE READER":"ISOLATED PREVIEW"}</span></h1>
        <small>{fullPage?"教学内容、来源定位和进度均为合成演示；正式课程由 CoursePack 载入。":"独立视觉验收 · 以下内容、来源和进度均为合成演示，不代表真实飞书和 CoursePack。"}</small></div>
        <div><fieldset className={s.demoModes}><legend>内容来源</legend>
          <button aria-pressed={sourceMode==="editorial"} type="button" onClick={()=>setSourceMode("editorial")}>完整排版</button>
          <button aria-pressed={sourceMode==="coursepack"} type="button" onClick={()=>setSourceMode("coursepack")}>CoursePack v0.1 映射</button>
        </fieldset><fieldset className={s.demoModes}><legend>视觉密度</legend>
          {(["minimal","balanced","normal"] as const).map(mode=><button type="button" key={mode} aria-pressed={density===mode}
            onClick={()=>setDensity(mode)}>{({minimal:"极简",balanced:"较简",normal:"正常"})[mode]}</button>)}
        </fieldset></div></header>
      <main className={s.demoGrid}>
        <div className={s.mobileReaderBar} aria-label="移动端阅读导航">
          <div className={s.mobileReaderControls}>
            <button type="button" aria-expanded={mobileOutlineOpen} aria-controls="session-c-mobile-outline"
              onClick={()=>setMobileOutlineOpen(v=>!v)}>章节目录</button>
            <strong>{currentLesson.title}</strong>
            <button type="button" aria-expanded={mobileCitationOpen} onClick={()=>setMobileCitationOpen(true)}>查看来源</button>
          </div>
          {mobileOutlineOpen&&<div className={s.mobileOutlinePanel} id="session-c-mobile-outline">
            <ChapterOutline chapters={currentChapters} activeSectionId={activeSectionId}
              onNavigate={navigateTo}/>
          </div>}
        </div>
        <div className={s.demoColumn}>{!fullPage&&<h2 className={s.demoBlockLabel}><span>01</span> LessonContent · Demo 说明</h2>}
          <LessonContent lesson={currentLesson} activeCitationId={selectedCitationId} onCitationSelect={selectCitation}/></div>
        <div className={`${s.demoColumn} ${s.desktopOutlineColumn}`}>{!fullPage&&<h2 className={s.demoBlockLabel}><span>02</span> ChapterOutline · Demo 说明</h2>}
          <ChapterOutline chapters={currentChapters} activeSectionId={activeSectionId} onNavigate={navigateTo}
            learningGoals={[{label:"理解栈的基本概念",done:true},{label:"掌握 Push / Pop 操作",done:false},{label:"了解栈的应用场景",done:false}]}/></div>
        <div className={`${s.demoColumn} ${s.mobileSourceColumn} ${mobileCitationOpen?s.mobileSourceOpen:""}`}>{mobileCitationOpen&&<button className={s.mobileSourceClose} type="button" onClick={()=>setMobileCitationOpen(false)}>关闭来源 ×</button>}{!fullPage&&<h2 className={s.demoBlockLabel}><span>03</span> SourceCitation · Demo 说明</h2>}
          <SourceCitation citations={currentCitations} selectedId={selectedCitationId} onSelect={setSelectedCitationId}/>
          <p className={s.demoNotice}>演示引用不会生成真实原文跳转。正式课程需要由资料库提供获授权的文件链接。</p>
        </div>
      </main>
    </div>
  </div>;
}
export default ReaderDemo;