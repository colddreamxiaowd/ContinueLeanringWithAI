"use client";

import {useState} from "react";
import {Xiaozhi} from "../../primitives";
import {ChapterOutline,LessonContent,SourceCitation} from "./reader";
import type {CitationRecord,LessonData,OutlineChapter} from "./reader";
import "../../pixel-pop.css";
import s from "./reader.module.css";

const chapters:readonly OutlineChapter[]=[
  {id:"ch3",label:"第 3 章 栈与队列",sections:[
    {id:"s31",label:"3.1 栈的基本概念",status:"done"},
    {id:"s32",label:"3.2 栈的 Push / Pop",status:"current"},
    {id:"s33",label:"3.3 栈的应用场景",status:"pending"},
    {id:"s34",label:"3.4 综合练习",status:"pending"},
    {id:"s35",label:"3.5 章节测验",status:"pending"}]},
  {id:"ch4",label:"第 4 章 链表",sections:[{id:"s41",label:"4.1 单链表",status:"pending"}]},
  {id:"ch5",label:"第 5 章 树",sections:[{id:"s51",label:"5.1 树的概念",status:"pending"}]}
];
const references:readonly CitationRecord[]=[
  {id:"cite-1",label:"1",title:"LIFO（后进先出）",description:"演示引用：栈仅允许在表的一端进行插入、删除，后入栈的元素先出栈。",
    sourceTitle:"《数据结构（C语言版）》示意来源",author:"严蔚敏",publisher:"清华大学出版社",year:"2011",location:"第3章"},
  {id:"cite-2",label:"2",title:"Stack ADT 与 Push / Pop",description:"演示引用：Push 将元素放入栈顶，Pop 移除并返回栈顶元素。",
    sourceTitle:"Introduction to Algorithms 示意来源",author:"Cormen 等",publisher:"MIT Press",year:"2009",location:"第10章"}
];
function StackFigure(){return <div className={s.stackScene}>
  <div className={s.stackLabels}><span>栈顶 (Top) →</span><span>栈底 (Bottom) →</span></div>
  <div className={s.stackTower}><span>3</span><span>2</span><span>1</span></div>
  <div className={s.stackCallout}><strong>后进先出（LIFO）</strong><small>最后进入的元素，最先被取出。</small></div>
  <Xiaozhi size={75} mood="thinking" decorative/>
</div>;}
const lesson:LessonData={id:"sample-stack",title:"栈的 Push / Pop",breadcrumb:["数据结构","第 3 章 栈与队列","3.2 栈的 Push / Pop"],blocks:[
  {type:"paragraph",content:[{text:"栈（Stack）是一种 "},{text:"后进先出（LIFO）",mark:"yellow"},{text:" 的线性表，它的两个核心操作是 "},
    {text:"Push（入栈）",mark:"blue"},{text:" 和 "},{text:"Pop（出栈）",mark:"mint"},
    {text:"。通过这两个操作，我们可以高效地管理数据的插入和删除。",citationId:"cite-1"}]},
  {type:"heading",id:"s31",number:"1",title:"栈的基本概念"},
  {type:"paragraph",content:[{text:"栈只允许在一端进行插入和删除操作，这一端被称为 "},{text:"栈顶（Top）",mark:"yellow"},{text:"。最后进入栈的元素总是最先被取出。"}]},
  {type:"figure",id:"stack-figure",alt:"三层立体栈示意：从下到上依次为 1、2、3，顶部元素 3 最先出栈",content:<StackFigure/>},
  {type:"heading",id:"s32",number:"2",title:"Push（入栈）操作"},
  {type:"paragraph",content:[{text:"Push 操作将一个元素放入栈顶，时间复杂度为 O(1)。",citationId:"cite-2"}]},
  {type:"code",language:"Python",code:"# 使用列表实现栈\nclass Stack:\n    def __init__(self):\n        self.stack = []\n\n    def push(self, x):\n        self.stack.append(x)  # O(1)"},
  {type:"keyPoints",title:"关键点",items:["Push 操作总是在栈顶插入元素。","插入元素后，新元素成为栈顶元素。"]}
]};

/** Self-contained visual demonstration. All sample content is synthetic, never account CoursePack data. */
export function ReaderDemo(){
  const [density,setDensity]=useState<"minimal"|"balanced"|"normal">("balanced");
  const [activeSectionId,setActiveSectionId]=useState("s32");
  const [selectedCitationId,setSelectedCitationId]=useState<string|null>("cite-1");
  function navigate(id:string){setActiveSectionId(id);document.getElementById(id)?.scrollIntoView({block:"nearest",behavior:"auto"});}
  return <div className={`pp-root ${s.demoPage}`} data-density={density}>
    <div className={s.demoFrame}>
      <header className={s.demoTop}><div><p>知序 Learning Hub · Pixel Pop / Session C</p>
        <h1>深度阅读组件 <span>ISOLATED PREVIEW</span></h1>
        <small>仅用于 UI 验收的合成示例，非真实 CoursePack、飞书来源或学习进度。</small></div>
        <fieldset className={s.demoModes}><legend>视觉密度</legend>{(["minimal","balanced","normal"] as const).map(mode=><button
          type="button" key={mode} aria-pressed={density===mode} onClick={()=>setDensity(mode)}>
          {({minimal:"极简",balanced:"较简",normal:"正常"})[mode]}</button>)}</fieldset></header>
      <main className={s.demoGrid}>
        <LessonContent lesson={lesson} activeCitationId={selectedCitationId} onCitationSelect={setSelectedCitationId}/>
        <ChapterOutline chapters={chapters} activeSectionId={activeSectionId} onNavigate={navigate}
          learningGoals={[{label:"理解栈的基本概念",done:false},{label:"掌握 Push / Pop 操作",done:true},{label:"了解栈的应用场景",done:false}]}/>
        <SourceCitation citations={references} selectedId={selectedCitationId} onSelect={setSelectedCitationId}/>
      </main>
    </div>
  </div>;
}
export default ReaderDemo;
