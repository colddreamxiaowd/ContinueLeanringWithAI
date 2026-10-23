"use client";

import type {ReactNode} from "react";
import {ArrowRight,BookOpen,CheckCircle2,RefreshCcw,RotateCcw,XCircle} from "lucide-react";
import {PopButton,Xiaozhi} from "../../primitives";
import styles from "./learning.module.css";

export type AnswerFeedbackStatus="correct"|"incorrect"|"retry";
export type AnswerFeedbackProps={
  status:AnswerFeedbackStatus;
  title?:string;
  description?:string;
  explanation?:string;
  selectedAnswer?:string;
  correctAnswer?:string;
  /** A course provides its own optional visualization; this generic feedback has no stack knowledge. */
  visual?:ReactNode;
  onNext?:()=>void;
  onRetry?:()=>void;
  onOpenPractice?:()=>void;
  practiceLabel?:string;
  onReview?:()=>void;
  reviewLabel?:string;
  compact?:boolean;
  className?:string;
};
const DEFAULTS={
  correct:{heading:"正确答案",title:"回答正确！",description:"做得好！继续保持，试试下一题。",speech:"掌握得不错！"},
  incorrect:{heading:"答案错误",title:"再想想看",description:"这次没选对。看看解析，找到关键一步。",speech:"慢慢来，继续加油！"},
  retry:{heading:"重试状态",title:"再试一次",description:"可以先回顾知识点，再用自己的方法重新解答。",speech:"换个方法试试！"}
} as const;

/** Portable across subjects. Stack-specific diagrams and strings belong to callers. */
export function AnswerFeedback({
  status,title,description,explanation,selectedAnswer,correctAnswer,visual,
  onNext,onRetry,onOpenPractice,practiceLabel="打开练习",onReview,reviewLabel="查看知识点",
  compact=false,className=""
}:AnswerFeedbackProps){
  const copy=DEFAULTS[status];
  const success=status==="correct";
  const retry=status==="retry";
  return <section className={styles.feedback+" "+styles["feedback_"+status]+
      (compact?" "+styles.feedbackCompact:"")+" "+className}
      aria-label={copy.heading} role="status">
    <div className={styles.feedbackHeading}>
      {success?<CheckCircle2 size={18}/>:retry?<RefreshCcw size={18}/>:<XCircle size={18}/>}
      <strong>{copy.heading}</strong>
    </div>
    <div className={styles.feedbackContent}>
      <div className={styles.feedbackIntro}>
        {success?<CheckCircle2 size={36}/>:retry?<RefreshCcw size={36}/>:<XCircle size={36}/>}
        <div><h3>{title??copy.title}</h3><p>{description??copy.description}</p></div>
      </div>
      {(visual||!compact)&&<div className={styles.feedbackScene}>
        {visual?<div className={styles.feedbackVisual}>{visual}</div>:
          <div className={styles.feedbackGlyph} aria-hidden="true">{retry?"↻":success?"✓":"!"}</div>}
        <div className={styles.feedbackMascot}>
          {!compact&&<div className={styles.speechBubble}>{copy.speech}</div>}
          <Xiaozhi size={compact?48:84} decorative
            mood={retry?"thinking":success?"celebrate":"encourage"}/>
        </div>
      </div>}
      {((selectedAnswer!==undefined&&!retry)||(correctAnswer!==undefined&&!retry))&&
        <div className={styles.answerCompare}>
          {selectedAnswer!==undefined&&<span>你的选择：<b>{selectedAnswer}</b></span>}
          {correctAnswer!==undefined&&<span>参考答案：<b>{correctAnswer}</b></span>}
        </div>}
      {explanation&&!retry&&<div className={styles.explanation}>
        <strong>💡 解析说明</strong><p>{explanation}</p>
      </div>}
      <div className={styles.feedbackActions}>
        {retry?<>
          {onOpenPractice&&<PopButton variant="blue" onClick={onOpenPractice}>{practiceLabel} <ArrowRight size={15}/></PopButton>}
          {onReview&&<PopButton variant="outline" onClick={onReview}><BookOpen size={16}/> {reviewLabel}</PopButton>}
          {onRetry&&<PopButton variant="violet" onClick={onRetry}><RefreshCcw size={16}/> 重新作答</PopButton>}
        </>:<>
          {!success&&onRetry&&<PopButton variant="outline" onClick={onRetry}><RotateCcw size={16}/> 重新作答</PopButton>}
          {onNext&&<PopButton variant="violet" onClick={onNext}>下一题 <ArrowRight size={17}/></PopButton>}
        </>}
      </div>
    </div>
  </section>;
}
