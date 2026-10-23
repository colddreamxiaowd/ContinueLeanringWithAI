"use client";

import {useRef,useState} from "react";
import {ArrowRight,BookOpenCheck,FlaskConical,RefreshCw} from "lucide-react";
import {PopButton} from "../../primitives";
import {QuizCard,type QuizQuestion} from "./QuizCard";
import {StackPlayground,type StackAction} from "./StackPlayground";
import styles from "./learning.module.css";

/** Portable classroom composition. Pass explicit course questions; no CoursePack assumptions. */
export type LearningPracticeProps={
  questions:readonly QuizQuestion[];
  lessonTitle?:string;
  onFirstAnswer?:(questionId:string,selectedOptionId:string,correct:boolean)=>void;
  onOperation?:(operation:StackAction)=>void;
  className?:string;
};
export function LearningPractice({
  questions,lessonTitle="栈的基本操作",onFirstAnswer,onOperation,className=""
}:LearningPracticeProps){
  const [index,setIndex]=useState(0);
  const [attemptNotice,setAttemptNotice]=useState("");
  const [scored,setScored]=useState<Record<string,boolean>>({});
  const [active,setActive]=useState<"lab"|"quiz">("lab");
  const reported=useRef(new Set<string>());
  const current=questions[index];
  const graded=Object.values(scored);
  const correctCount=graded.filter(Boolean).length;
  const handleFirst=(selected:string,correct:boolean)=>{
    if(!current||reported.current.has(current.id))return;
    reported.current.add(current.id);
    setScored(prev=>({...prev,[current.id]:correct}));
    onFirstAnswer?.(current.id,selected,correct);
  };
  const next=()=>{
    setIndex(i=>(i+1)%questions.length);
    setAttemptNotice("");
    setActive("quiz");
  };
  if(!current){
    return <section className={styles.practiceEmpty} aria-label="练习题暂不可用">
      <BookOpenCheck size={24} aria-hidden="true"/>
      <h2>当前章节还没有练习题</h2>
      <p>实验功能可以独立使用；请由课程内容提供题目后进入答题。</p>
      <StackPlayground onOperation={onOperation}/>
    </section>;
  }
  return <div className={styles.practicePage+" "+className} data-learning-practice>
    <div className={styles.practiceHero}>
      <div><span className={styles.practiceEyebrow}>互动学习 · 数据结构</span>
        <h2>{lessonTitle}</h2>
        <p>先观察入栈与出栈，再通过题目检验理解。每道题首次作答仅计分一次。</p>
      </div>
      <div className={styles.practiceMetrics} aria-label="当前练习表现">
        <strong>{correctCount}<small> / {reported.current.size}</small></strong>
        <span>首次答对 / 已做题</span>
      </div>
    </div>
    <nav className={styles.practiceJump} aria-label="本节学习环节">
      <a href="#practice-stack" aria-current={active==="lab"?"step":undefined}
        onClick={()=>setActive("lab")}><FlaskConical size={18}/> 动手实验</a>
      <a href="#practice-quiz" aria-current={active==="quiz"?"step":undefined}
        onClick={()=>setActive("quiz")}><BookOpenCheck size={18}/> 随堂练习 <ArrowRight size={15}/></a>
    </nav>
    <div className={styles.practiceGrid}>
      <section id="practice-stack" className={styles.practiceSection} aria-label="栈操作练习区域">
        <header className={styles.practiceSectionHead}>
          <span>01</span><div><h3>动手操作栈</h3><p>输入一个整数，观察栈顶如何变化。</p></div>
        </header>
        <StackPlayground onOperation={operation=>{setActive("lab");onOperation?.(operation);}}/>
        <div className={styles.practiceNext}><PopButton variant="violet" onClick={()=>{
          setActive("quiz");
          document.getElementById("practice-quiz")?.scrollIntoView({behavior:"smooth",block:"start"});
        }}>完成实验，开始练习 <ArrowRight size={17}/></PopButton></div>
      </section>
      <section id="practice-quiz" className={styles.practiceSection} aria-label="随堂测验区域">
        <header className={styles.practiceSectionHead}>
          <span>02</span><div><h3>检验你的理解</h3><p>根据真实 Push / Pop 规则推演答案。</p></div>
        </header>
        <QuizCard key={current.id} question={current} questionIndex={index+1}
          questionCount={questions.length} onAnswer={handleFirst}
          onAttempt={(_,correct,attempt)=>setAttemptNotice(
            "第 "+attempt+" 次作答："+(correct?"回答正确":"可参考解析后再次尝试")+
            (attempt>1?" · 重试不重复计分":""))}
          onNext={next}
          onOpenLab={()=>{
            setActive("lab");
            document.getElementById("practice-stack")?.scrollIntoView({behavior:"smooth",block:"start"});
          }}/>
        {attemptNotice&&<p className={styles.practiceAttemptNotice} role="status">{attemptNotice}</p>}
        <div className={styles.practiceFooter}>
          <span>示例学习状态由当前会话计算，不代表课程平台已保存的成绩。</span>
          <button type="button" onClick={()=>{
            setIndex(0);setAttemptNotice("");setActive("quiz");
          }}><RefreshCw size={14}/> 返回第一题</button>
        </div>
      </section>
    </div>
  </div>;
}
