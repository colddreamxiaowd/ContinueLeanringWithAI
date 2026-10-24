"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {INITIAL_MATH_SESSION,restoreMathSession,solve,judge,pretty,MATH_ACTIVITY_VERSION} from "@/lib/math-conditional.mjs";
import s from "./math-workbench.module.css";

type Kind="draw"|"screen";
type Mode="explain"|"guided"|"independent";
type Params={draw:{red:number;blue:number};screen:{prevalence:number;sensitivity:number;falsePositive:number}};
type Attempt={stage:Kind;result:string;answer:string;at:string};
type Discovery={stage:Kind;body:string;at:string;verification:string};
type MathState={version:string;mode:Mode;stage:Kind;params:Params;answers:Record<Kind,string>;
 notes:Record<Kind,string>;reveal:number;attempts:Attempt[];discoveries:Discovery[];feedback:null|{status:string;message:string}};
const storePrefix="zhixu_math_conditional_v1";
const make=():MathState=>INITIAL_MATH_SESSION() as MathState;
function newEventId(){return typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():
 "math-"+Date.now()+"-"+Math.random().toString(36).slice(2);}
function resultPercent(n:number,d:number){return (100*n/d).toFixed(1)+"%";}

export default function MathWorkbench({accountMode=false,ownerId=""}:{accountMode?:boolean;ownerId?:string}){
  const storeKey=accountMode?storePrefix+"_user_"+ownerId:storePrefix+"_public";
  const [state,setState]=useState<MathState>(make);
  const [hydrated,setHydrated]=useState(false);
  const [syncStatus,setSyncStatus]=useState("正在加载学习草稿…");
  const [remoteEvents,setRemoteEvents]=useState<Array<{kind:string;payload:Record<string,unknown>;created_at:string}>>([]);
  const [showHistory,setShowHistory]=useState(false);
  const [exampleVisible,setExampleVisible]=useState(false);
  const savedCount=useRef(0);
  useEffect(()=>{
    try{const raw=localStorage.getItem(storeKey);
      if(raw)setState(restoreMathSession(JSON.parse(raw)) as MathState);
      setSyncStatus("本机草稿可自动恢复。");
    }catch{setSyncStatus("浏览器存储不可用；可通过导出保留解题过程。");}
    setHydrated(true);
  },[storeKey]);
  useEffect(()=>{
    if(!hydrated)return;
    try{localStorage.setItem(storeKey,JSON.stringify({...state,feedback:null}));
       savedCount.current++; }
    catch{setSyncStatus("本机保存失败，请导出解题记录。");}
  },[state,hydrated]);
  useEffect(()=>{
    if(!accountMode)return;
    fetch("/api/learning/math-events",{cache:"no-store"})
      .then(async r=>{if(!r.ok)throw Error("FAILED");const x=await r.json();setRemoteEvents(x.events||[]);
        setSyncStatus("已读取当前账号的历史学习事件；本机草稿另行保留。");})
      .catch(()=>setSyncStatus("账号历史暂不可读取；本机草稿仍可使用。"));
  },[accountMode]);
  const pushEvent=useCallback(async(kind:string,payload:Record<string,unknown>)=>{
    if(!accountMode)return;
    setSyncStatus("正在保存到账号…");
    try{
      const r=await fetch("/api/learning/math-events",{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({clientEventId:newEventId(),kind,activityId:MATH_ACTIVITY_VERSION,payload})});
      if(!r.ok)throw Error("NOT_SAVED");
      setSyncStatus("已由服务器确认保存到当前账号。");
      setRemoteEvents(events=>[...events,{kind,payload,created_at:new Date().toISOString()}].slice(-100));
    }catch{setSyncStatus("账号写入未确认。本机草稿仍保留，请稍后重试保存。");}
  },[accountMode]);
  const stage=state.stage;
  const current=stage==="draw"?state.params.draw:state.params.screen;
  const solved=solve(stage,current);
  const last=[...state.attempts].reverse().find(x=>x.stage===stage);
  function pickMode(mode:Mode){setState(x=>({...x,mode,feedback:null}));}
  function pickStage(stage:Kind){setState(x=>({...x,stage,feedback:null,reveal:0}));}
  function changeParameter(key:string,value:number){
    if(!Number.isInteger(value))return;
    const valid=stage==="draw"?value>=1&&value<=12:key==="prevalence"?value>=1&&value<=60:
      key==="sensitivity"?value>=1&&value<=100:value>=1&&value<=99;
    if(!valid)return;
    setState(x=>({...x,params:{...x.params,[stage]:{...x.params[stage],[key]:value}},feedback:null}));
  }
  function submit(){
    const answer=state.answers[stage];
    const verdict=judge(stage,current,answer);
    const attempt:Attempt={stage,result:verdict.status,answer,at:new Date().toISOString()};
    setState(x=>({...x,attempts:[...x.attempts,attempt].slice(-100),
      feedback:{status:verdict.status,message:verdict.message}}));
    void pushEvent("attempt-submitted",{stage,answer,result:verdict.status,
      params:current,note:state.notes[stage].slice(0,1000)});
  }
  function saveDiscovery(){
    const body=state.notes[stage].trim();
    if(!body){setSyncStatus("请先写下自己的思路，再保存为未验证发现。");return;}
    const item:Discovery={stage,body:body.slice(0,4000),at:new Date().toISOString(),verification:"unverified"};
    setState(x=>({...x,discoveries:[...x.discoveries,item].slice(-30)}));
    setSyncStatus("已保存为本机未验证发现；不代表数学证明。");
    void pushEvent("note-saved",{stage,body:item.body,verification:"unverified",params:current});
  }
  function exportRecord(){
    const blob=new Blob([JSON.stringify({kind:"ZHIXU_MATH_STUDY_EXPORT",
      exportedAt:new Date().toISOString(),state,serverEvents:remoteEvents},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="知序-数学探索记录.json";a.click();
    URL.revokeObjectURL(url);
  }
  const nav=accountMode?[
    {id:"home" as const,label:"私人课程",href:"/learn",icon:"home" as const},
    {id:"courses" as const,label:"我的资料",href:"/coursepacks",icon:"courses" as const},
    {id:"practice" as const,label:"数学工作台",href:"/learn/math",icon:"plan" as const}
  ]:[
    {id:"home" as const,label:"学习首页",href:"/ui-lab/integrated/home",icon:"home" as const},
    {id:"reader" as const,label:"深度阅读",href:"/ui-lab/integrated/reader",icon:"courses" as const},
    {id:"practice" as const,label:"数学工作台",href:"/ui-lab/math",icon:"plan" as const}
  ];
  const targetValue=solved.posterior.numerator/solved.posterior.denominator;
  const guide=stage==="draw"?[
    "定义 A：第一次蓝色；B：第二次红色。需要 P(A｜B)，不是 P(B｜A)。",
    "第二次红色可能发生在第一次红色或蓝色之后。统计全部符合 B 的有序路径。",
    "符合 A 且 B 的路径数为蓝球数×红球数。用这部分除以全部 B 路径。"
  ]:[
    "定义 A：真实患病；B：检测呈阳性。目标是 P(A｜B)，不是检测灵敏度 P(B｜A)。",
    "想象 10000 人：真正患病且阳性为 患病率×灵敏度；无病阳性为 (1−患病率)×假阳性率。",
    "把真正患病且阳性的人数除以所有检测阳性的人数，才是阳性后的患病概率。"
  ];
  return <ShellIntegrationFrame surface="practice" navigation={nav} presentation="app"
    crumbs={[{label:"知序学习空间",href:accountMode?"/learn":"/ui-lab/integrated/home"},
      {label:"条件概率 · 深度实践"}]}>
    <article className={s.root} data-math-workbench="true" data-math-stage={stage}>
      <header className={s.hero}>
        <div><span className={s.kicker}>MATH LAB / L3 · CONDITIONAL PROBABILITY</span>
          <h2>条件概率，从直觉到独立求解。</h2>
          <p>先动手改变条件、自己推导，再挑战结构不同的新问题。不等待 AI，就能得到可核查的反馈。</p>
        </div>
        <div className={s.version}>活动引擎 v1 <span>{accountMode?"私人账号模式":"公开合成试验课"}</span></div>
      </header>
      <div className={s.notice} role="note">本课程题目为明确标注的合成教学案例，并非从飞书真实课件生成。{accountMode?
        "账号操作会单独尝试写入私有探索事件，本机草稿也会保留。":
        "草稿仅存在当前浏览器，不会上传服务器。"}</div>
      <div className={s.switchBar} aria-label="学习方式">
        <div className={s.modeGroup} role="group" aria-label="学习模式">
          {([["explain","看讲解"],["guided","一起推导"],["independent","独立挑战"]] as const).map(([mode,label])=>
          <button type="button" key={mode} aria-pressed={state.mode===mode}
            className={state.mode===mode?s.active:""} onClick={()=>pickMode(mode)}>{label}</button>)}
        </div>
        <div className={s.modeGroup} role="group" aria-label="学习任务">
          <button type="button" className={stage==="draw"?s.active:""} aria-pressed={stage==="draw"} onClick={()=>pickStage("draw")}>01 · 不放回抽取</button>
          <button type="button" className={stage==="screen"?s.active:""} aria-pressed={stage==="screen"} onClick={()=>pickStage("screen")}>02 · 诊断迁移题</button>
        </div>
      </div>
      <div className={s.panels}>
        <section className={s.problem}>
          <span className={s.eyebrow}>{stage==="draw"?"EXPLORATION 01":"TRANSFER CHALLENGE 02"}</span>
          <h3>{stage==="draw"?"第二次红色，第一次是蓝色的概率？":"检测呈阳性，真的患病概率是多少？"}</h3>
          {stage==="draw"?
            <p>袋中有 {state.params.draw.red} 个红球、{state.params.draw.blue} 个蓝球；不放回连续取两球。已知第二球是红球，求第一次取蓝球的概率。</p>:
            <p>某项合成筛查任务中，患病率 {state.params.screen.prevalence}%，灵敏度 {state.params.screen.sensitivity}%，无病者假阳性率 {state.params.screen.falsePositive}%。已知检测阳性，求真正患病的概率。</p>}
          <div className={s.sliders}>
            {(stage==="draw"?[
              {id:"red",label:"红球个数",min:1,max:12,value:state.params.draw.red},
              {id:"blue",label:"蓝球个数",min:1,max:12,value:state.params.draw.blue}
             ]:[
              {id:"prevalence",label:"患病率 %",min:1,max:60,value:state.params.screen.prevalence},
              {id:"sensitivity",label:"灵敏度 %",min:1,max:100,value:state.params.screen.sensitivity},
              {id:"falsePositive",label:"假阳性率 %",min:1,max:99,value:state.params.screen.falsePositive}
             ]).map(p=><label className={s.sliderItem} key={p.id}>
              <span>{p.label} <strong>{p.value}</strong></span>
              <input type="range" min={p.min} max={p.max} value={p.value}
                onChange={e=>changeParameter(p.id,Number(e.target.value))}/>
            </label>)}
          </div>
          <div className={s.visual} aria-label={stage==="draw"?"条件事件路径分布":"阳性群体构成"}>
            <div className={s.visualHeader}><strong>{stage==="draw"?"第二次为红色的所有路径":"阳性者群体的组成"}</strong><small>参数调整实时计算 · 确定性模型</small></div>
            <div className={s.bar} role="img" aria-label={"目标条件下占比 "+resultPercent(solved.posterior.numerator,solved.posterior.denominator)}>
              <span className={s.barGood} style={{width:Math.max(0,Math.min(100,targetValue*100))+"%"}}/>
              <span className={s.barOther} style={{width:Math.max(0,100-targetValue*100)+"%"}}/>
            </div>
            <div className={s.legend}><span><i className={s.goodDot}/>符合目标且满足条件</span><span><i className={s.otherDot}/>仅满足条件</span></div>
            {state.mode!=="independent"&&<p className={s.visualHint}>图表示“已知条件成立时”的组成，而非无条件总体。</p>}
          </div>
        </section>
        <section className={s.workspace}>
          <span className={s.eyebrow}>YOUR REASONING / YOUR RECORD</span>
          <h3>先写下自己的答案，再检验。</h3>
          {state.mode==="explain"&&<div className={s.help}><strong>先理解条件事件</strong><p>{guide[0]}</p>
            <button type="button" onClick={()=>setExampleVisible(x=>!x)}>{exampleVisible?"收起示范":"查看详细计算示范"}</button>
            {exampleVisible&&<p className={s.expanded}>{solved.explanation}</p>}</div>}
          {state.mode==="guided"&&<div className={s.help}><strong>逐步引导（不替你作答）</strong>
            {guide.slice(0,state.reveal+1).map((step,i)=><p key={i}>{i+1}. {step}</p>)}
            {state.reveal<2&&<button type="button" onClick={()=>setState(x=>({...x,reveal:Math.min(2,x.reveal+1)}))}>查看下一步提示 →</button>}
          </div>}
          {state.mode==="independent"&&<div className={s.challengeNote}>
            独立模式：请自己确定条件样本空间。无即时示范；提交后给出基于规则的反馈。允许写下非预设解法。
          </div>}
          <label className={s.answerLabel} htmlFor="math-probability-answer">你的概率答案（如 1/2、0.5、50%）</label>
          <div className={s.answerRow}>
            <input id="math-probability-answer" value={state.answers[stage]} placeholder="例如 1/2"
              onChange={e=>setState(x=>({...x,answers:{...x.answers,[stage]:e.target.value.slice(0,50)},feedback:null}))}/>
            <button type="button" onClick={submit}>验证我的答案</button>
          </div>
          {state.feedback&&<div role="status" className={state.feedback.status==="correct"?s.correct:s.feedback}>
            <strong>{state.feedback.status==="correct"?"✓ 计算通过":"检查你的条件概率"}</strong>
            <p>{state.feedback.message}</p>
            {state.feedback.status!=="correct"&&state.mode!=="independent"&&<p>可以修改参数、重新计数、再次提交。旧尝试会被保留。</p>}
          </div>}
          {state.mode==="independent"&&last?.result==="correct"&&<button type="button"
            className={s.revealButton} onClick={()=>setExampleVisible(x=>!x)}>
            {exampleVisible?"收起验证依据":"查看确定性计算依据"}
          </button>}
          {state.mode==="independent"&&exampleVisible&&<p className={s.expanded}>{solved.explanation}</p>}
          <label className={s.answerLabel} htmlFor="math-idea">我的推导 / 新解法 / 错误修正</label>
          <textarea id="math-idea" value={state.notes[stage]} rows={5}
            placeholder="记录你的思考过程。即使当前没有得到正确答案，也可以保存为个人未验证思路。"
            onChange={e=>setState(x=>({...x,notes:{...x.notes,[stage]:e.target.value.slice(0,4000)}}))}/>
          <div className={s.actions}>
            <button type="button" onClick={saveDiscovery}>保存我的原创思路（未验证）</button>
            {stage==="draw"&&<button type="button" className={s.next}
              onClick={()=>{pickStage("screen");pickMode("independent");setExampleVisible(false);}}>
              进入不同结构的迁移挑战 →
            </button>}
          </div>
          <p className={s.saveState} role="status">{hydrated?syncStatus:"正在载入…"} 所有自动判题只检查概率值，不会武断评价开放式证明。</p>
        </section>
      </div>
      <section className={s.history}>
        <header><div><span className={s.eyebrow}>LEARNING TRACE</span><h3>不丢失失败，也不抹掉新想法</h3></div>
          <div className={s.actions}>
            <button type="button" onClick={()=>setShowHistory(v=>!v)}>{showHistory?"收起":"查看"}历史（{state.attempts.length} 次尝试）</button>
            <button type="button" onClick={exportRecord}>导出探索记录 JSON</button>
          </div>
        </header>
        {showHistory&&<div className={s.timeline}>
          {state.attempts.length?state.attempts.slice().reverse().slice(0,25).map((a,i)=>
            <div key={i}><strong>{a.result==="correct"?"已通过":"尚未通过"}</strong>
              <span>{a.stage==="draw"?"抽球":"检测"} · {a.answer||"空答案"} · {new Date(a.at).toLocaleString("zh-CN")}</span></div>):
            <p>还没有提交记录。修改参数并尝试一次吧。</p>}
        </div>}
        {state.discoveries.length>0&&<div className={s.discoveries}>
          {state.discoveries.slice(-4).reverse().map((d,i)=><article key={i}>
            <strong>未验证个人思路 · {d.stage==="draw"?"抽球":"诊断题"}</strong>
            <p>{d.body}</p></article>)}
        </div>}
        {accountMode&&<div className={s.timeline}>
          <strong>账号私有学习事件（服务器返回 {remoteEvents.length} 条）</strong>
          {remoteEvents.slice(-25).reverse().map((event,i)=><div key={i}>
            <strong>{event.kind==="note-saved"?"个人未验证思路":"提交尝试"}</strong>
            <span>{event.kind==="note-saved"?
              String(event.payload.body||"").slice(0,200):
              String(event.payload.answer||"")+" · "+String(event.payload.result||"")}
              {" · "+new Date(event.created_at).toLocaleString("zh-CN")}</span>
          </div>)}
          <p>当前账号与公开演示的本机草稿互相隔离。<Link href="/learn">返回课程</Link></p>
        </div>}
      </section>
    </article>
  </ShellIntegrationFrame>;
}
