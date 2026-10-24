"use client";

import {useId,useState} from "react";
import type {CSSProperties} from "react";
import {XiaozhiLayers} from "../../mascot/XiaozhiLayers";
import {Xiaozhi} from "../../mascot/Xiaozhi";
import {XiaozhiTailFrame} from "./XiaozhiTailFrames";
import {XiaozhiPawBodyBacking,XiaozhiPawFrame,XiaozhiPawRemoval,XiaozhiPawRest} from "./XiaozhiPawFrames";
import styles from "./motion.module.css";

/**
 * ISOLATED EXPERIMENT. Never changes XiaozhiLayers, Xiaozhi or the approved
 * 573px, 25-colour native SVG master. Motion is only applied to reusable
 * source-exact <g data-xz-part> groups. Blink temporarily hides the original
 * eye groups and shows two separately editable black eyelid paths above a
 * behind-rig fur backing; no whites painted over black antialias edges.
 */
export const MOTION_ACTIONS=["none","blink","nod","hop","tail","hello","paw","wave"] as const;
export type XiaozhiExperimentalAction=typeof MOTION_ACTIONS[number];
export const MOTION_LABELS:Record<XiaozhiExperimentalAction,string>={
  none:"原版静止",blink:"眨眼",nod:"轻轻点头",hop:"小跳跃",
  tail:"摇尾巴（逐像素帧）",hello:"打招呼（组合）",
  paw:"独立抬爪（试验）",wave:"挥爪招手（试验）"
};

/* Static backing is drawn UNDER the source-exact rig, fully covered at rest.
 * It becomes visible only when the existing eye groups compress to a blink.
 * Same canonical #F8F8F9 fur, no repainting or antialias overlay fringe. */
const EYE_FUR_BACKING="M188 246h45v64h-45Z M338 244h45v66h-45Z";

/** Precisely the 17 source-grey rectangles assigned to 'face', padded only into adjacent canonical fur pixels
 * adjacent to the original eyes, not the eye groups. They were verified
 * against canonical XiaozhiLayers pixels. Only paint during the CLOSED frame; source-grey pixels are exact and the halo guard includes only existing #F8F8F9 pixels,
 * ABOVE source groups, BEFORE the black eyelids. Do not cover cheek pixels. */
const FACE_EYE_SHADE_FIX=
  "M198 244h28v3h-28Z M344 244h12v4h-12Z M365 244h11v4h-11Z M194 247h32v4h-32Z M344 248h8v3h-8Z M369 248h7v3h-7Z M194 251h8v4h-8Z M222 251h4v3h-4Z M341 251h7v3h-7Z M372 251h4v3h-4Z M222 254h11v4h-11Z M337 254h11v4h-11Z M372 254h15v1h-15Z M194 255h4v3h-4Z M375 255h12v3h-12Z M194 258h1v1h-1Z M226 258h7v4h-7Z M337 258h8v4h-8Z M379 258h8v42h-8Z M229 262h4v4h-4Z M337 262h4v4h-4Z M229 292h4v4h-4Z M337 292h4v4h-4Z M187 296h1v4h-1Z M226 296h7v4h-7Z M337 296h8v4h-8Z M191 300h7v3h-7Z M222 300h11v3h-11Z M337 300h11v4h-11Z M372 300h7v7h-7Z M191 303h4v4h-4Z M219 303h14v1h-14Z M219 304h11v3h-11Z M341 304h7v3h-7Z M215 307h11v4h-11Z M368 307h8v4h-8Z";

export function XiaozhiMotionPrototype({
  action="none",size=200,replay=0,decorative=false
}:{
  action?:XiaozhiExperimentalAction;size?:number;replay?:number;decorative?:boolean;
}){
  const safeSize=Math.max(24,Math.min(450,size));
  const maskId=useId().replace(/:/g,"")+"-experimental-paw-hole";
  const pawMotion=action==="paw"||action==="wave";
  const vars={"--xz-motion-size":safeSize+"px"} as CSSProperties;
  return <span className={styles.motionFrame} data-action={action} data-replay={replay}
    style={vars} aria-label={decorative?undefined:"小知动作实验："+MOTION_LABELS[action]}>
    <svg key={action+"-"+replay} className={styles.motionSvg} width={safeSize} height={safeSize}
      viewBox="0 0 573 573" role={decorative?undefined:"img"}
      aria-hidden={decorative?"true":undefined}
      aria-label={decorative?undefined:"小知，"+MOTION_LABELS[action]}
      shapeRendering="crispEdges" focusable="false" xmlns="http://www.w3.org/2000/svg">
      {pawMotion&&<defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
          x="0" y="0" width="573" height="573">
          <rect width="573" height="573" fill="#fff"/>
          <XiaozhiPawRemoval/>
        </mask>
      </defs>}
      <g className={styles.bodyRig} data-motion-rig="exact-parent">
        <path d={EYE_FUR_BACKING} fill="#F8F8F9" stroke="none" data-motion-eye-backing="true"/>
        {/* Native, source-derived tail alternatives render behind face and torso.
            The ORIGINAL tail remains visible except during deliberate frame swap. */}
        <g className={styles.tailUpPose} data-tail-swap="up">
          <XiaozhiTailFrame pose="up"/>
        </g>
        <g className={styles.tailDownPose} data-tail-swap="down">
          <XiaozhiTailFrame pose="down"/>
        </g>
        <g mask={pawMotion?`url(#${maskId})`:undefined} data-rig-paw-mask={pawMotion?"source-cutout":undefined}>
          <XiaozhiLayers/>
        </g>
        {pawMotion&&<g data-paw-articulation="left-front-source-pixels">
          <XiaozhiPawBodyBacking/>
          <g className={styles.pawRestPose} data-paw-layer="rest"><XiaozhiPawRest/></g>
          <g className={styles.pawUpPose} data-paw-layer="up"><XiaozhiPawFrame pose="up"/></g>
          <g className={styles.pawWavePose} data-paw-layer="wave"><XiaozhiPawFrame pose="wave"/></g>
        </g>}
        <g className={styles.closedLids} data-motion-eyelids="two-pixel-paths" stroke="none"
          shapeRendering="crispEdges">
          <path d={FACE_EYE_SHADE_FIX} fill="#F8F8F9" data-motion-eye-shade-fix="source-grey-fur-guard"/>
          <path d="M194 278h32v6h-32Z M343 278h33v6h-33Z" fill="#08080C"/>
        </g>
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
            <span aria-hidden="true" className={styles.actionMark}>{id==="none"?"·":id==="blink"?"◡":id==="nod"?"↘":id==="hop"?"↑":id==="tail"?"〰":id==="paw"?"↗":id==="wave"?"♧":"✦"}</span>
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
        <strong>技术边界：</strong> 点头和跳跃是整体结构变换；眨眼使用原始双眼语义组及下层毛色；尾巴采用「尾根不动、末端逐像素位移」的两个原生 SVG 帧，衔接仍需实际浏览器验收。新增抬爪/挥爪是左前爪 4,525 个原色像素的可撤销分离实验；肩部接缝仍需人工验收，不代表母版已具有可复用的完整骨骼。
      </div>
    </div>
  </div>;
}
type MOTION_ACTIONS_TYPE=typeof MOTION_ACTIONS;
