'use client';
import { useState } from 'react';

type SourceRef = {sourceId:string;sha256:string;slide:number};
type Question = {id:string;knowledgePointId:string;type:string;difficulty:string;prompt:string;answer:string|number|boolean;explanation:string;sourceRefs:SourceRef[];options?:{key:string;text:string}[];verificationStatus:string};

export function V2ReviewQuiz({questions}:{questions:Question[]}){
  const [answers,setAnswers] = useState<Record<string,string>>({});
  const [submitted,setSubmitted] = useState<Record<string,boolean>>({});
  return <div className="v2-quiz-list">{questions.map((question,index)=>{
    const value=answers[question.id]??'';
    const correct=value!=='' && value===String(question.answer);
    return <section key={question.id} className="v2-test-question">
      <div className="v2-kicker">QUESTION {index+1} · {question.knowledgePointId} · {question.difficulty}</div>
      <h3>{question.prompt}</h3>
      {question.type==='single_choice' && <div className="v2-options">{question.options?.map(option=><label key={option.key}><input type="radio" name={question.id} value={option.key} checked={value===option.key} onChange={event=>{setAnswers(old=>({...old,[question.id]:event.target.value}));setSubmitted(old=>({...old,[question.id]:false}));}}/>{option.key}. {option.text}</label>)}</div>}
      {question.type==='true_false' && <div className="v2-options">{[['true','正确'],['false','错误']].map(([key,label])=><label key={key}><input type="radio" name={question.id} value={key} checked={value===key} onChange={()=>{setAnswers(old=>({...old,[question.id]:key}));setSubmitted(old=>({...old,[question.id]:false}));}}/>{label}</label>)}</div>}
      {question.type==='code_trace' && <label className="v2-trace-entry">最终栈顶：<input type="number" aria-label="输入最终栈顶" value={value} placeholder="先推演再填写" onChange={event=>{setAnswers(old=>({...old,[question.id]:event.target.value}));setSubmitted(old=>({...old,[question.id]:false}));}}/></label>}
      <div className="v2-question-tools"><button className="button button-primary" type="button" onClick={()=>setSubmitted(old=>({...old,[question.id]:true}))}>{value?'提交并查看反馈':'提交答案'}</button><small>来源第 {question.sourceRefs.map(ref=>ref.slide).join('、')} 页</small></div>
      {submitted[question.id] && <p className={`v2-feedback ${correct?'v2-feedback--good':'v2-feedback--retry'}`} role="status">{value===''?'请先独立作答。':correct?'回答正确。'+question.explanation:'暂不正确。'+question.explanation}</p>}
    </section>;
  })}</div>
}
