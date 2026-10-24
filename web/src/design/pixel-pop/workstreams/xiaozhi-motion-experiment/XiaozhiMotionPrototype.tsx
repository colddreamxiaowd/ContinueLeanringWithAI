"use client";

import {useState} from "react";
import type {CSSProperties} from "react";
import {XiaozhiLayers} from "../../mascot/XiaozhiLayers";
import {Xiaozhi} from "../../mascot/Xiaozhi";
import styles from "./motion.module.css";

/**
 * ISOLATED EXPERIMENT. Never changes XiaozhiLayers, Xiaozhi or the approved
 * 573px, 25-colour native SVG master. Motion is only applied to reusable
 * source-exact <g data-xz-part> groups. Blink compresses the original black-eye
 * groups against a source-colour fur backing, avoiding white-repaint fringe.
 */
export const MOTION_ACTIONS=["none","blink","nod","hop","tail","hello"] as const;
export type XiaozhiExperimentalAction=typeof MOTION_ACTIONS[number];
export const MOTION_LABELS:Record<XiaozhiExperimentalAction,string>={
  none:"原版静止",blink:"眨眼",nod:"轻轻点头",hop:"小跳跃",
  tail:"摇尾巴（风险实验）",hello:"打招呼（组合）"
};

/* Static backing is drawn UNDER the source-exact rig, fully covered at rest.
 * It becomes visible only when the existing eye groups compress to a blink.
 * Same canonical #F8F8F9 fur, no repainting or antialias overlay fringe. */
const EYE_FUR_BACKING="M188 246h45v64h-45Z M338 244h45v66h-45Z";

export function XiaozhiMotionPrototype({
  action="none",size=200,replay=0,decorative=false
}:{
  action?:XiaozhiExperimentalAction;size?:number;replay?:number;decorative?:boolean;
}){
  const safeSize=Math.max(24,Math.min(450,size));
  const vars={"--xz-motion-size":safeSize+"px"} as CSSProperties;
  return <span className={styles.motionFrame} data-action={action} data-replay={replay}
    style={vars} aria-label={decorative?undefined:"小知动作实验："+MOTION_LABELS[action]}>
    <svg key={action+"-"+replay} className={styles.motionSvg} width={safeSize} height={safeSize}
      viewBox="0 0 573 573" role={decorative?undefined:"img"}
      aria-hidden={decorative?"true":undefined}
      aria-label={decorative?undefined:"小知，"+MOTION_LABELS[action]}
      shapeRendering="crispEdges" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <g className={styles.bodyRig} data-motion-rig="exact-parent">
        <path d={EYE_FUR_BACKING} fill="#F8F8F9" stroke="none" data-motion-eye-backing="true"/>
        <XiaozhiLayers/>
      </g>
    </svg>
  </span>;
}

export function XiaozhiMotionLab(){
  const [action,setAction]=useState<XiaozhiExperimentalAction>("blink");
  const [replay,setReplay]=useState(0);
  const [background,setBackground]=useState<"light"|"dark"|"violet"|"yellow">("light");
  const actions:MOTION_ACTIONS_TYPE=MOTION_ACTIONS;
  function select(next:XiaozhiExperimentalAction){setAction(next);setReplay(n=>n+1);}
  return <div className={styles.lab} data-xz-lab="true">
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <div className={styles.titleCopy}>
          <span className={styles.kicker}>INDEPENDENT RIG EXPERIMENT · NO PRODUCTION CHANGES</span>
          <h1>小知 · 动作实验室 <span>01</span></h1>
          <p>使用已认可的 25 色、573px 原生 SVG 和 12 个语义图层。所有动作均为可撤销实验，不进入正式角色。</p>
        </div>
        <div className={styles.status}>独立分支 · 待审美签收</div>
      </header>
      <section className={styles.compare} aria-label="原版与实验动作对照">
        <div className={styles.stage}>
          <div className={styles.stageHeading}><strong>母版参照</strong><small>来源锁定 · 不变形</small></div>
          <div className={styles.catStage} data-background={background}>
            <XiaozhiMotionPrototype size={220} action="none"/>
          </div>
        </div>
        <div className={styles.stage}>
          <div className={styles.stageHeading}><strong>动作候选</strong><small>{MOTION_LABELS[action]}</small></div>
          <div className={styles.catStage} data-background={background} data-active-action={action}>
            <XiaozhiMotionPrototype action={action} replay={replay} size={220}/>
          </div>
        </div>
      </section>
      <section className={styles.controls} aria-label="动作与背景控制">
        <div className={styles.sectionIntro}><h2>选择动作</h2><p>点击时单次播放；原版始终保留在左侧以便辨认轮廓变化。</p></div>
        <div className={styles.actionGrid}>
          {actions.map(id=><button type="button" key={id}
             className={styles.actionButton} data-selected={action===id}
             aria-pressed={action===id} onClick={()=>select(id)}>
            <span aria-hidden="true" className={styles.actionMark}>{id==="none"?"·":id==="blink"?"◡":id==="nod"?"↘":id==="hop"?"↑":id==="tail"?"〰":"✦"}</span>
            <strong>{MOTION_LABELS[id]}</strong>
          </button>)}
        </div>
        <div className={styles.lowerControls}>
          <button type="button" className={styles.replay} onClick={()=>setReplay(n=>n+1)}>↻ 重播当前动作</button>
          <fieldset className={styles.themes}><legend>背景验收</legend>
            {(["light","dark","violet","yellow"] as const).map(theme=>
              <button type="button" key={theme} aria-pressed={background===theme}
                className={styles.themeOption} data-theme={theme}
                onClick={()=>setBackground(theme)}>
                {({light:"白色",dark:"深色",violet:"紫色",yellow:"黄色"} as const)[theme]}
              </button>)}
          </fieldset>
        </div>
      </section>
      <section className={styles.optical} aria-label="小尺寸光学验收">
        <div className={styles.sectionIntro}><h2>小尺寸仍使用认可光学版</h2><p>24/32px 不强制缩放全身动态，以免脸部与帽子失真。</p></div>
        <div className={styles.opticalRow}>
          <div><Xiaozhi size={24} pose="avatar"/><span>24px · 已有母版</span></div>
          <div><Xiaozhi size={32} pose="avatar"/><span>32px · 已有母版</span></div>
          <div><Xiaozhi size={48} pose="avatar"/><span>48px · 静态</span></div>
        </div>
      </section>
      <div className={styles.note}>
        <strong>技术边界：</strong> 点头和跳跃是整体结构变换；眨眼使用原始双眼语义组及下层毛色；摇尾巴会移动「tail」区域，尾根遮挡需人工检查。此处不宣称已实现完整骨骼、挥爪或所有表情。
      </div>
    </div>
  </div>;
}
type MOTION_ACTIONS_TYPE=typeof MOTION_ACTIONS;
