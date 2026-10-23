"use client";

import {ArrowRight,BookOpen,CheckCircle2,FlaskConical,RefreshCcw,XCircle} from "lucide-react";
import {PopButton,Xiaozhi} from "../../primitives";
import styles from "./learning.module.css";

export type AnswerFeedbackStatus="correct"|"incorrect"|"retry";
export type AnswerFeedbackProps={
  status:AnswerFeedbackStatus;
  explanation?:string;
  selectedAnswer?:string;
  correctAnswer?:string;
  illustratedStack?:number[];
  onNext?:()=>void;
  onRetry?:()=>void;
  onOpenLab?:()=>void;
  onReview?:()=>void;
  compact?:boolean;
  className?:string;
};

export function AnswerFeedback({
  status,explanation,selectedAnswer,correctAnswer,illustratedStack,
  onNext,onRetry,onOpenLab,onReview,compact=false,className=""
}:AnswerFeedbackProps){
  const success=status==="correct";
  const retry=status==="retry";
  const title=success?"回答正确！":retry?"再试一次":"回答不正确";
  const description=success?"做得好！你已经掌握了这道题的关键操作。":
    retry?"可以先回顾知识点，或在实验区亲手操作。":"再看看元素入栈、出栈后，栈顶发生了什么变化。";
  return <section className={styles.feedback+" "+styles["feedback_"+status]+
      (compact?" "+styles.feedbackCompact:"")+" "+className}
      aria-label={retry?"重试引导":success?"正确答案反馈":"错误答案反馈"} role="status">
    <div className={styles.feedbackHeading}>
      {success?<CheckCircle2 size={18}/>:retry?<RefreshCcw size={18}/>:<XCircle size={18}/>}
      <strong>{success?"正确答案":retry?"重试状态":"答案错误"}</strong>
    </div>
    <div className={styles.feedbackContent}>
      <div className={styles.feedbackIntro}>
        {success?<CheckCircle2 size={36}/>:retry?<RefreshCcw size={36}/>:<XCircle size={36}/>}
        <div><h3>{title}</h3><p>{description}</p></div>
      </div>
      <div className={styles.feedbackScene}>
        {illustratedStack?.length ? <div className={styles.feedbackStack}>
          <span>栈顶 →</span><div className={styles.feedbackTower}>
            {illustratedStack.map((item,i)=><b key={i} className={i===illustratedStack.length-1?styles.feedbackTop:""}>{item}</b>)}
          </div></div>:<div className={styles.feedbackGlyph} aria-hidden="true">{retry?"↻":success?"✓":"!"}</div>}
        <div className={styles.feedbackMascot}>
          <div className={styles.speechBubble}>{retry?"动手操作一下吧！":success?
            "栈顶元素是 "+(correctAnswer??"正确答案")+"！":
            "你选了 "+(selectedAnswer??"其他选项")+"，再试试看！"}</div>
          <Xiaozhi size={compact?56:88} decorative mood={retry?"focused":success?"celebrate":"encourage"}/>
        </div>
      </div>
      {explanation&&!retry&&<div className={styles.explanation}>
        <strong>💡 解析说明</strong><p>{explanation}</p>
      </div>}
      <div className={styles.feedbackActions}>
        {retry?<>
          {onOpenLab&&<PopButton variant="blue" onClick={onOpenLab}><FlaskConical size={16}/> 打开实验区 <ArrowRight size={15}/></PopButton>}
          {onReview&&<PopButton variant="outline" onClick={onReview}><BookOpen size={16}/> 查看知识点</PopButton>}
          {onRetry&&<PopButton variant="violet" onClick={onRetry}><RefreshCcw size={16}/> 重新作答</PopButton>}
        </>:<>
          {!success&&onRetry&&<PopButton variant="outline" onClick={onRetry}><RefreshCcw size={16}/> 再看一次</PopButton>}
          {onNext&&<PopButton variant="violet" onClick={onNext}>下一题 <ArrowRight size={17}/></PopButton>}
        </>}
      </div>
    </div>
  </section>;
}
