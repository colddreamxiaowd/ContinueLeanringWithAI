"use client";

import {useRef,useState} from "react";
import {Clock3,RotateCcw,Trash2,ArrowDownToLine,ArrowUpFromLine} from "lucide-react";
import {PopButton} from "../../primitives";
import {normalizeCapacity,popStack,pushStack} from "./stack-model.mjs";
import styles from "./learning.module.css";

export type StackAction = {
  id:number;
  kind:"push"|"pop";
  value:number;
  stack:number[];
  time:string;
};
export type StackPlaygroundProps = {
  initialStack?:number[];
  capacity?:number;
  onOperation?:(operation:StackAction)=>void;
  className?:string;
};

export function StackPlayground({
  initialStack=[],capacity=6,onOperation,className=""
}:StackPlaygroundProps){
  const limit=normalizeCapacity(capacity);
  const initial=initialStack.slice(0,limit).filter(Number.isSafeInteger);
  const [stack,setStack]=useState<number[]>(()=>initial.slice());
  const [input,setInput]=useState("7");
  const [message,setMessage]=useState("动手操作：试试 Push(7)、Push(3)、Pop()。");
  const [history,setHistory]=useState<StackAction[]>([]);
  const [lastKind,setLastKind]=useState<"push"|"pop"|null>(null);
  const counter=useRef(0);
  const start=useRef(initial);
  const commit=(kind:"push"|"pop")=>{
    const result=kind==="push"?pushStack(stack,input,limit):popStack(stack);
    setMessage(result.message);
    if(!result.ok)return;
    setStack(result.stack);
    setLastKind(kind);
    const record:StackAction={
      id:++counter.current,kind,value:result.value,stack:result.stack.slice(),
      time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false}),
    };
    setHistory(prev=>[record,...prev].slice(0,30));
    onOperation?.(record);
  };
  const reset=()=>{
    setStack(start.current.slice());
    setHistory([]);
    setMessage("实验已重置，可重新进行 Push / Pop。");
    setLastKind(null);
  };
  const recent=history.slice(0,4).reverse();
  const changedWithoutHistory=history.length===0&&JSON.stringify(stack)!==JSON.stringify(start.current);
  const stages=history.length>3
    ? recent.map(a=>({id:a.id,label:a.kind==="push"?"Push("+a.value+")":"Pop() → "+a.value,stack:a.stack,kind:a.kind}))
    : [{id:0,label:changedWithoutHistory?"当前状态":"初始状态",
        stack:changedWithoutHistory?stack:start.current,kind:null as "push"|"pop"|null},
      ...recent.map(a=>({id:a.id,label:a.kind==="push"?"Push("+a.value+")":"Pop() → "+a.value,stack:a.stack,kind:a.kind}))];
  const padded=[...stages,...Array.from({length:Math.max(0,4-stages.length)},(_,i)=>({
    id:-(i+1),label:"等待下一步",stack:[] as number[],kind:null
  }))];
  return <section className={styles.playground+" "+className} aria-label="可交互的栈操作实验">
    <div className={styles.playgroundBody}>
      <div className={styles.playgroundMain}>
        <div className={styles.sectionKicker}><ArrowDownToLine size={16}/> 栈的 Push / Pop 过程 <span>容量 {limit} · 后进先出</span></div>
        <div className={styles.stageGrid}>
          {padded.map((stage,index)=>{
            const waiting=stage.id<0;
            const top=stage.stack.at(-1);
            return <div className={styles.stageCard+(waiting?" "+styles.stageWaiting:"")} key={stage.id}>
              <div className={styles.stagePill}>{index+1}. {stage.label}</div>
              <div className={styles.stackGraphic} aria-label={waiting?"尚未操作":"当前栈："+JSON.stringify(stage.stack)}>
                <div className={styles.slotTower}>
                  {Array.from({length:limit},(_,i)=><div
                    key={i}
                    className={styles.slot+(i<stage.stack.length?" "+styles.slotFilled:"")+
                      (i===stage.stack.length-1?" "+styles.slotTop:"")+
                      (stage.id===history[0]?.id&&i===stage.stack.length-1&&lastKind==="push"?" "+styles.slotEnter:"")}>
                    {i<stage.stack.length?stage.stack[i]:""}
                  </div>)}
                </div>
                <div className={styles.stackBase}/>
              </div>
              <div className={styles.stageTop}>栈顶：<strong>{top===undefined?"空":top}</strong></div>
              <div className={styles.arrayLabel}>[{stage.stack.join(", ")}]</div>
            </div>;
          })}
        </div>
        <div className={styles.controls}>
          <label htmlFor="learning-stack-value">输入入栈元素</label>
          <div className={styles.controlRow}>
            <input id="learning-stack-value" aria-label="入栈整数" type="text" inputMode="numeric"
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")commit("push");}}
              placeholder="例如 7"/>
            <PopButton variant="blue" onClick={()=>commit("push")}>
              <ArrowDownToLine size={17}/> Push 入栈
            </PopButton>
            <PopButton variant="coral" onClick={()=>commit("pop")}>
              <ArrowUpFromLine size={17}/> Pop 出栈
            </PopButton>
            <PopButton variant="outline" onClick={reset}><RotateCcw size={16}/> 重置</PopButton>
          </div>
          <div className={styles.operationMessage} role="status" aria-live="polite">
            {message}<span>当前栈：[ {stack.join(", ")} ]</span>
          </div>
        </div>
      </div>
      <aside className={styles.history} aria-label="栈操作历史">
        <div className={styles.historyHead}><strong><Clock3 size={17}/> 操作历史</strong>
          <button type="button" onClick={()=>setHistory([])} disabled={!history.length} aria-label="清空操作历史">
            <Trash2 size={14}/> 清空
          </button>
        </div>
        {history.length?<ol className={styles.historyList}>
          {history.map(record=><li key={record.id}>
            <span className={styles.historyNumber}>{record.id}</span>
            <b className={record.kind==="push"?styles.historyPush:styles.historyPop}>
              {record.kind==="push"?"Push("+record.value+")":"Pop() → "+record.value}
            </b>
            <time>{record.time}</time>
          </li>)}
        </ol>:<p className={styles.historyEmpty}>记录会在每次成功操作后出现。<br/>先试试 Push(7)。</p>}
        <div className={styles.historyTip}><strong>💡 LIFO</strong> 最后进入栈的元素，会最先被弹出。</div>
      </aside>
    </div>
  </section>;
}
