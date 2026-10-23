"use client";

import {useEffect,useState} from "react";
import {CheckCircle2,ClipboardList,Infinity as InfinityIcon} from "lucide-react";
import {AnswerFeedback} from "./AnswerFeedback";
import styles from "./learning.module.css";

export type QuizOption={id:string;label:string};
export type QuizQuestion={
  id:string;
  title:string;
  expression?:string;
  options:QuizOption[];
  correctOptionId:string;
  explanation:string;
  difficulty?:"简单"|"中等"|"困难";
};
export type QuizCardProps={
  question:QuizQuestion;
  questionIndex?:number;
  questionCount?:number;
  onAnswer?:(selectedOptionId:string,correct:boolean)=>void;
  onNext?:()=>void;
  onOpenLab?:()=>void;
  onReview?:()=>void;
  className?:string;
};
export function QuizCard({
  question,questionIndex=1,questionCount=1,
  onAnswer,onNext,onOpenLab,onReview,className=""
}:QuizCardProps){
  const [selected,setSelected]=useState<string|null>(null);
  useEffect(()=>setSelected(null),[question.id]);
  const correct=selected===question.correctOptionId;
  const locked=selected!==null;
  const validCount=Math.max(1,questionCount);
  const current=Math.max(1,Math.min(validCount,questionIndex));
  const choose=(id:string)=>{
    if(locked)return;
    setSelected(id);
    onAnswer?.(id,id===question.correctOptionId);
  };
  return <section className={styles.quiz+" "+className} aria-label="单选题">
    <div className={styles.quizHeader}>
      <span className={styles.quizBadge}><ClipboardList size={16}/> 单选题</span>
      <strong>{current} / {validCount}</strong>
      <div className={styles.quizProgress} aria-label={"当前第 "+current+" 题，共 "+validCount+" 题"}>
        <span style={{width:(100*current/validCount)+"%"}}/>
      </div>
      {question.difficulty&&<span className={styles.difficulty}>
        <InfinityIcon size={15}/> {question.difficulty}
      </span>}
    </div>
    <h3 className={styles.quizQuestion}>{question.title}</h3>
    {question.expression&&<pre className={styles.expression}><code>{question.expression}</code></pre>}
    <div className={styles.quizOptions} role="group" aria-label="请选择一个答案">
      {question.options.map((option,i)=>{
        const isCorrect=locked&&option.id===question.correctOptionId;
        const isWrong=locked&&selected===option.id&&!isCorrect;
        return <button type="button" key={option.id}
          className={styles.option+(isCorrect?" "+styles.optionCorrect:"")+
            (isWrong?" "+styles.optionWrong:"")+(selected===option.id?" "+styles.optionSelected:"")}
          disabled={locked}
          aria-pressed={selected===option.id}
          onClick={()=>choose(option.id)}>
          <span className={styles.optionLetter}>{String.fromCharCode(65+i)}</span>
          <span>{option.label}</span>
          {isCorrect&&<CheckCircle2 className={styles.optionCheck} size={22}/>}
          {isWrong&&<span className={styles.optionCross} aria-label="选择错误">×</span>}
        </button>;
      })}
    </div>
    {!locked?<div className={styles.quizHint}>💡 选项状态：默认 / 悬停 / 选中 / 正确 / 错误。选择后显示解析。</div>:
      <AnswerFeedback status={correct?"correct":"incorrect"} compact
        explanation={question.explanation}
        selectedAnswer={question.options.find(o=>o.id===selected)?.label}
        correctAnswer={question.options.find(o=>o.id===question.correctOptionId)?.label}
        onRetry={()=>setSelected(null)} onNext={onNext}
        onOpenLab={onOpenLab} onReview={onReview}/>}
  </section>;
}
