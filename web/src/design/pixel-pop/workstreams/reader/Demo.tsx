"use client";

import {useEffect,useState} from "react";
import {ChapterOutline,LessonContent,SourceCitation} from "./reader";
import type {CitationRecord,LessonData,OutlineChapter,ReaderBlock} from "./reader";
import {adaptCoursePackV01} from "./coursepack-adapter.mjs";
import "../../pixel-pop.css";
import s from "./reader.module.css";

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
  {type:"figure",id:"stack-figure",alt:"三层栈示意，从下到上依次是 1、2、3，顶部元素 3 先出栈",content:<StackFigure/>,caption:"图 1 · 后进先出操作示意（合成演示，不是 CoursePack 原图）"},
  {type:"heading",id:"s32",number:"2",title:"Push（入栈）操作"},
  {type:"paragraph",content:[{text:"Push 将元素放入栈顶；使用数组动态追加时，均摊时间复杂度通常为 O(1)。",citationId:"cite-2"}]},
  {type:"code",id:"demo-code",language:"Python",code:"# 使用列表实现栈\nclass Stack:\n    def __init__(self):\n        self.stack = []\n\n    def push(self, x):\n        self.stack.append(x)  # 均摊 O(1)"},
  {type:"keyPoints",id:"key-stack",title:"关键点",items:["Push 操作总是在栈顶插入元素。","插入元素后，新元素成为栈顶元素。"]},
  {type:"heading",id:"s33",number:"3",title:"栈的应用场景"},
  {type:"paragraph",content:[{text:"函数调用栈、表达式求值和撤销操作，都可以利用栈的后进先出性质。"}]},
  {type:"heading",id:"s34",number:"4",title:"综合练习"},
  {type:"paragraph",content:[{text:"尝试自己写出三次 Push 后执行 Pop 的结果，并解释元素顺序为什么改变。"}]},
  {type:"heading",id:"s35",number:"5",title:"章节测验"},
  {type:"activity",id:"demo-quiz",kind:"quiz",label:"练习内容由 CoursePack 交互组件负责渲染。"},
  {type:"heading",id:"s41",number:"6",title:"单链表结构（跨章示意）"},
  {type:"heading",id:"s42",number:"7",title:"插入删除操作"},
  {type:"heading",id:"s51",number:"8",title:"树的概念"}
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

export function ReaderDemo(){
  const [density,setDensity]=useState<"minimal"|"balanced"|"normal">("balanced");
  const [sourceMode,setSourceMode]=useState<"editorial"|"coursepack">("editorial");
  const mapped=adaptCoursePackV01(coursePackDemo,{mode:"demo",completedBlockIds:["concept"],activeBlockId:"more"});
  const currentLesson=sourceMode==="editorial"?lesson:mapped.lesson as LessonData;
  const currentChapters=sourceMode==="editorial"?chapters:mapped.chapters as OutlineChapter[];
  const currentCitations=sourceMode==="editorial"?references:mapped.citations as CitationRecord[];
  const [activeSectionId,setActiveSectionId]=useState("s32");
  const [selectedCitationId,setSelectedCitationId]=useState<string|null>("cite-1");
  useEffect(()=>{if(sourceMode==="coursepack"){setActiveSectionId("more");setSelectedCitationId("mock-12");}
    else {setActiveSectionId("s32");setSelectedCitationId("cite-1");}},[sourceMode]);
  return <div className={`pp-root ${s.demoPage}`} data-density={density}>
    <div className={s.demoFrame}>
      <header className={s.demoTop}><div><p>知序 Learning Hub · Pixel Pop / Session C</p>
        <h1>深度阅读组件 <span>ISOLATED PREVIEW</span></h1>
        <small>独立视觉验收 · 以下内容、来源和进度均为合成演示，不代表真实飞书和 CoursePack。</small></div>
        <div><fieldset className={s.demoModes}><legend>内容来源</legend>
          <button aria-pressed={sourceMode==="editorial"} type="button" onClick={()=>setSourceMode("editorial")}>完整排版</button>
          <button aria-pressed={sourceMode==="coursepack"} type="button" onClick={()=>setSourceMode("coursepack")}>CoursePack v0.1 映射</button>
        </fieldset><fieldset className={s.demoModes}><legend>视觉密度</legend>
          {(["minimal","balanced","normal"] as const).map(mode=><button type="button" key={mode} aria-pressed={density===mode}
            onClick={()=>setDensity(mode)}>{({minimal:"极简",balanced:"较简",normal:"正常"})[mode]}</button>)}
        </fieldset></div></header>
      <main className={s.demoGrid}>
        <div className={s.demoColumn}><h2 className={s.demoBlockLabel}><span>01</span> LessonContent · Demo 说明</h2>
          <LessonContent lesson={currentLesson} activeCitationId={selectedCitationId} onCitationSelect={setSelectedCitationId}/></div>
        <div className={s.demoColumn}><h2 className={s.demoBlockLabel}><span>02</span> ChapterOutline · Demo 说明</h2>
          <ChapterOutline chapters={currentChapters} activeSectionId={activeSectionId} onNavigate={setActiveSectionId}
            learningGoals={[{label:"理解栈的基本概念",done:true},{label:"掌握 Push / Pop 操作",done:false},{label:"了解栈的应用场景",done:false}]}/></div>
        <div className={s.demoColumn}><h2 className={s.demoBlockLabel}><span>03</span> SourceCitation · Demo 说明</h2>
          <SourceCitation citations={currentCitations} selectedId={selectedCitationId} onSelect={setSelectedCitationId}/>
          <p className={s.demoNotice}>演示引用不会生成真实原文跳转。正式课程需要由资料库提供获授权的文件链接。</p>
        </div>
      </main>
    </div>
  </div>;
}
export default ReaderDemo;