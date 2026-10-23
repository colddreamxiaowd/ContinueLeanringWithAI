"use client";

import {useState} from "react";
import {ProgressRing,Xiaozhi} from "../../primitives";
import {StackPlayground} from "./StackPlayground";
import {QuizCard} from "./QuizCard";
import type {QuizQuestion} from "./QuizCard";
import {AnswerFeedback} from "./AnswerFeedback";
import "../../pixel-pop.css";
import styles from "./learning.module.css";

const EXAMPLE_QUESTIONS:QuizQuestion[]=[
  {
    id:"demo-stack-top-1",
    title:"执行以下操作后，栈顶元素是多少？",
    expression:"push(1), push(2), push(3), pop(), push(4)",
    options:[{id:"a",label:"1"},{id:"b",label:"2"},{id:"c",label:"3"},{id:"d",label:"4"}],
    correctOptionId:"d",difficulty:"中等",
    explanation:"push(1)、push(2)、push(3) 后为 [1, 2, 3]；pop() 弹出 3 后为 [1, 2]；再 push(4) 得到 [1, 2, 4]，所以栈顶是 4。",
  },
  {
    id:"demo-stack-top-2",
    title:"依次 Push(5)、Push(8)、Pop() 后，栈顶是什么？",
    expression:"push(5), push(8), pop()",
    options:[{id:"a",label:"5"},{id:"b",label:"8"},{id:"c",label:"0"},{id:"d",label:"空栈"}],
    correctOptionId:"a",difficulty:"简单",
    explanation:"最后入栈的 8 先被 Pop() 弹出，因此留下 [5]，当前栈顶为 5。",
  }
];
type Density="minimal"|"balanced"|"normal";
const SKILLS=[["概念理解",100,"#24DBA6"],["操作实验",70,"#246BFF"],["应用场景",40,"#7440FF"],["综合练习",0,"#c9d1e4"]] as const;

/** Independent integration surface — examples are deliberately NOT CoursePack records. */
export function LearningDemo(){
  const [density,setDensity]=useState<Density>("balanced");
  const [questionIndex,setQuestionIndex]=useState(0);
  const [notice,setNotice]=useState("点击按钮体验真实状态变化；所有分数和题目均为演示。");
  const showLab=()=>{
    document.getElementById("learning-demo-lab")?.scrollIntoView({behavior:"smooth",block:"start"});
    setNotice("已定位至上方栈实验区。");
  };
  const advance=()=>{
    setQuestionIndex(i=>(i+1)%EXAMPLE_QUESTIONS.length);
    setNotice("已切换到另一道演示题。");
  };
  return <main className={"pp-root "+styles.demo} data-density={density}>
    <header className={styles.demoTop}>
      <div><span className={styles.demoEyebrow}>知序 Learning Hub · DESIGN LAB / SESSION D</span>
        <h1>实验与做题交互组件</h1>
        <p>65% 新粗野主义 · 25% 像素学院 · 10% 安静留白 · 仅展示演示数据</p>
      </div>
      <div className={styles.demoDensity} role="group" aria-label="视觉密度">
        {(["minimal","balanced","normal"] as const).map(mode=><button type="button" key={mode}
          className={density===mode?styles.densityActive:""} aria-pressed={density===mode}
          onClick={()=>setDensity(mode)}>{({minimal:"极简",balanced:"较简",normal:"正常"})[mode]}</button>)}
        <Xiaozhi size={48} mood="happy" decorative/>
      </div>
    </header>
    <div className={styles.demoBoard}>
    <section className={styles.demoSection+" "+styles.demoLabPanel} id="learning-demo-lab">
      <div className={styles.demoSectionTitle}><b>1</b><div>
        <h2>StackPlayground · 栈操作实验组件</h2>
        <p>逐步 Push / Pop、即时栈顶、操作历史、动画与边界反馈</p>
      </div></div>
      <StackPlayground onOperation={a=>setNotice("实验操作成功："+(a.kind==="push"?"入栈 ":"弹出 ")+a.value)}/>
      <div className={styles.demoNote}>💡 实验引导：输入 7 并 Push → 输入 3 并 Push → Pop → 重置。历史记录只保存在当前预览状态中。</div>
    </section>
      <section className={styles.demoSection+" "+styles.demoQuizPanel}>
        <div className={styles.demoSectionTitle}><b>2</b><div><h2>QuizCard · 单选题组件</h2>
          <p>题干、选项、即时判题、解析与下一题</p></div></div>
        <QuizCard key={EXAMPLE_QUESTIONS[questionIndex].id} question={EXAMPLE_QUESTIONS[questionIndex]}
          questionIndex={questionIndex+1} questionCount={EXAMPLE_QUESTIONS.length}
          onAnswer={(_,correct)=>setNotice(correct?"回答正确，解析已展开。":"回答错误，解析已展开，可重新选择。")}
          onNext={advance} onOpenLab={showLab} onReview={()=>setNotice("复习提示：栈遵循后进先出（LIFO）。")}/>
        <div className={styles.demoNote}>💡 本区域显示模拟练习题，不写入真实课程成绩。</div>
      </section>
      <section className={styles.demoSection+" "+styles.demoProgressPanel}>
        <div className={styles.demoSectionTitle}><b>4</b><div><h2>ProgressRing · 掌握度总结</h2>
          <p>复用现有共享进度环，仅在预览组合中显示</p></div></div>
        <div className={styles.demoProgress}>
          <ProgressRing value={68} label="演示掌握度"/>
          <div style={{flex:"1 1 195px",minWidth:0}}>
            <strong>章节掌握总结 · 示例</strong>
            {SKILLS.map(([name,value,color])=><div key={name} style={{display:"flex",gap:7,alignItems:"center",margin:"11px 0"}}>
              <span style={{fontWeight:800,fontSize:12,width:65,flexShrink:0}}>{name}</span>
              <div style={{height:9,flex:1,background:"#e5e9f6",borderRadius:10,overflow:"hidden"}}>
                <span style={{display:"block",height:"100%",width:value+"%",background:color,borderRadius:10}}/>
              </div>
              <b style={{fontSize:12}}>{value}%</b>
            </div>)}
          </div>
        </div>
        <div className={styles.demoNote}>10 道示例题 · 7 道正确 · 3 道待巩固。演示数字，与 CoursePack 进度无关。</div>
      </section>
    <section className={styles.demoSection+" "+styles.demoFeedbackPanel}>
      <div className={styles.demoSectionTitle}><b>3</b><div>
        <h2>AnswerFeedback · 答题反馈组件</h2>
        <p>三个独立可复用状态：正确、错误、重试；动作由调用方提供</p></div></div>
      <div className={styles.demoGrid}>
        <AnswerFeedback status="correct" illustratedStack={[1,2,4]} correctAnswer="4"
          explanation={EXAMPLE_QUESTIONS[0].explanation} onNext={advance}/>
        <AnswerFeedback status="incorrect" illustratedStack={[1,2,4]} selectedAnswer="3" correctAnswer="4"
          explanation={EXAMPLE_QUESTIONS[0].explanation}
          onRetry={()=>setNotice("已触发重新作答。可在上方单选题中重新选择。")} onNext={advance}/>
        <AnswerFeedback status="retry" onOpenLab={showLab}
          onReview={()=>setNotice("知识点：栈的入栈、出栈操作均发生在栈顶。")}
          onRetry={()=>setNotice("已触发重新练习，请返回上方单选题。")}/>
      </div>
      <div className={styles.demoNote} role="status">{notice}</div>
    </section>
    </div>
  </main>;
}
export default LearningDemo;
