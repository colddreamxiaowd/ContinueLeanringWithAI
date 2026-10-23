"use client";

import {useEffect,useRef,useState} from "react";
import {CheckCircle2,ClipboardList,Infinity as InfinityIcon} from "lucide-react";
import {AnswerFeedback} from "./AnswerFeedback";
import {createQuizSession,evaluateQuizAttempt} from "./quiz-model.mjs";
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
  /** One scored record per question id in a mounted QuizCard, including after retries. */
  onAnswer?:(selectedOptionId:string,correct:boolean)=>void;
  /** Called for every deliberate attempt, including retries. */
  onAttempt?:(selectedOptionId:string,correct:boolean,attempt:number)=>void;
  onNext?:()=>void;
  onOpenLab?:()=>void;
  onReview?:()=>void;
  className?:string;
};
export function QuizCard({
  question,questionIndex=1,questionCount=1,onAnswer,onAttempt,
  onNext,onOpenLab,onReview,className=""
}:QuizCardProps){
  const [selected,setSelected]=useState<string|null>(null);
  const [attempt,setAttempt]=useState(1);
  const session=useRef(createQuizSession(question.id));
  const clickGuard=useRef(false);
  useEffect(()=>{
    session.current=createQuizSession(question.id);
    clickGuard.current=false;
    setSelected(null);
    setAttempt(1);
  },[question.id]);
  const correct=selected===question.correctOptionId;
  const locked=selected!==null;
  const validCount=Math.max(1,questionCount);
  const current=Math.max(1,Math.min(validCount,questionIndex));
  const choose=(id:string)=>{
    if(clickGuard.current||locked||!question.options.some(o=>o.id===id))return;
    clickGuard.current=true;
    const evaluation=evaluateQuizAttempt(session.current,question.id,id,question.correctOptionId);
    session.current=evaluation.session;
    setSelected(id);
    setAttempt(evaluation.attempt);
    onAttempt?.(id,evaluation.correct,evaluation.attempt);
    if(evaluation.shouldReport)onAnswer?.(id,evaluation.correct);
  };
  const retry=()=>{
    clickGuard.current=false;
    setSelected(null);
    setAttempt(session.current.attempts+1);
  };
  return <section className={styles.quiz+" "+className} aria-label="单选题">
    <div className={styles.quizHeader}>
      <span className={styles.quizBadge}><ClipboardList size={16}/> 单选题</span>
      <strong>{current} / {validCount}</strong>
      <div className={styles.quizProgress} role="progressbar" aria-valuemin={0}
        aria-valuemax={validCount} aria-valuenow={current}
        aria-label={"题目进度：第 "+current+" 题，共 "+validCount+" 题"}>
        <span style={{width:(100*current/validCount)+"%"}}/>
      </div>
      {question.difficulty&&<span className={styles.difficulty}>
        <InfinityIcon size={15}/> {question.difficulty}
      </span>}
    </div>
    <h3 className={styles.quizQuestion}>{question.title}</h3>
    {question.expression&&<pre className={styles.expression}><code>{question.expression}</code></pre>}
    <div className={styles.quizOptions} role="group" aria-label={"第 "+current+" 题，请选择一个答案"}>
      {question.options.map((option,i)=>{
        const isCorrect=locked&&option.id===question.correctOptionId;
        const isWrong=locked&&selected===option.id&&!isCorrect;
        return <button type="button" key={option.id}
          className={styles.option+(isCorrect?" "+styles.optionCorrect:"")+
            (isWrong?" "+styles.optionWrong:"")+(selected===option.id?" "+styles.optionSelected:"")}
          disabled={locked}
          aria-pressed={selected===option.id}
          aria-label={String.fromCharCode(65+i)+"，"+option.label+(isCorrect?"，正确答案":isWrong?"，已选错误":"")}
          onClick={()=>choose(option.id)}>
          <span className={styles.optionLetter}>{String.fromCharCode(65+i)}</span>
          <span>{option.label}</span>
          {isCorrect&&<CheckCircle2 className={styles.optionCheck} size={22} aria-hidden="true"/>}
          {isWrong&&<span className={styles.optionCross} aria-hidden="true">×</span>}
        </button>;
      })}
    </div>
    {!locked?<div className={styles.quizHint}>
        {attempt>1?"第 "+attempt+" 次尝试 · 重新思考后选择。仅首次提交计入答题成绩。":
          "请选择最合适的答案，提交后可以查看解析。"}
      </div>:
      <AnswerFeedback status={correct?"correct":"incorrect"} compact
        explanation={question.explanation}
        selectedAnswer={question.options.find(o=>o.id===selected)?.label}
        correctAnswer={question.options.find(o=>o.id===question.correctOptionId)?.label}
        onRetry={retry} onNext={onNext}
        onOpenPractice={onOpenLab} practiceLabel="打开实验区" onReview={onReview}/>}
  </section>;
}
