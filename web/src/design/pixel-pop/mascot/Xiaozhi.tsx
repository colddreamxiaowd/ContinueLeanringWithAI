"use client";
import type {CSSProperties} from "react";
import style from "./xiaozhi.module.css";

/**
 * 小知 / Xiaozhi — canonical, self-contained pixel mascot.
 * Identity never changes between moods, sizes, themes or pages.
 * Original vector pixel art. No fonts/images/network requests are needed.
 *
 * A mood changes ONLY expression + tiny motion hints.
 * A pose changes ONLY the crop. Hat, face, ears, blush, tail remain canonical.
 */
export type XiaozhiMood =
  "idle"|"happy"|"thinking"|"curious"|"focused"|"encourage"|"celebrate"|"surprised";
export type XiaozhiPose = "full"|"avatar";
export type XiaozhiMotion = "idle"|"wave"|"bounce"|"none";
export type XiaozhiArt = "reference"|"vector";

export const XIAOZHI_MOODS:readonly XiaozhiMood[]=[
  "idle","happy","thinking","curious","focused","encourage","celebrate","surprised"
] as const;

const moodNames:Record<XiaozhiMood,string>={
 idle:"默认",happy:"开心",thinking:"思考",curious:"好奇",
 focused:"专注",encourage:"鼓励",celebrate:"庆祝",surprised:"惊讶"
};

export function Xiaozhi({
  size=112,mood="idle",pose="full",motion="none",art="reference",
  label,decorative=false,className=""
}:{
  size?:number;
  mood?:XiaozhiMood;
  pose?:XiaozhiPose;
  motion?:XiaozhiMotion;
  art?:XiaozhiArt;
  label?:string;
  decorative?:boolean;
  className?:string;
}){
  const bounded=Math.max(24,Math.min(480,size));
  const isPortrait=pose==="avatar";
  const referenceArt=art==="reference";
  const state=({
    "--xz-size":bounded+"px",
  }) as CSSProperties;
  const smile=["happy","encourage","celebrate"].includes(mood);
  const squint=["happy","celebrate"].includes(mood);
  const worried=mood==="surprised";
  const focused=mood==="focused";
  return <span className={style.frame+" "+className} data-mood={mood} data-pose={pose} data-motion={motion} style={state}>
    <svg className={style.art} width={bounded} height={bounded}
      viewBox={referenceArt?(isPortrait?"0 0 125 125":"0 0 125 164"):(isPortrait?"8 27 112 112":"0 0 128 176")}
      role={decorative?undefined:"img"} aria-hidden={decorative?"true":undefined}
      aria-label={decorative?undefined:(label||"小知，"+moodNames[mood]+"表情的学士帽像素小猫")}
      shapeRendering="crispEdges" focusable="false">
      {referenceArt&&<image x={0} y={0} width={125} height={164}
        href="/pixel-pop/xiaozhi-reference.svg" preserveAspectRatio="xMidYMid meet"/>}
      {!referenceArt&&<>
      {/* Far tail is behind the head/torso and deliberately turns toward viewer. */}
      <g stroke="#12121D" strokeWidth="5" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M88 126h13v-7h12v6h5v12h-5v19h-8v7h-15v-8h-7v-14z" fill="#FFF"/>
        <path d="M107 142v13h-8v6h-9v-8h8v-8z" fill="#C9D2F5" stroke="none"/>
        {/* Plump pear body, tiny paws */}
        <path d="M35 116h56v7h8v8h8v23h-8v9H82v-6H74v10H58v-10H46v7H29v-8H21v-27h8v-8h6z" fill="#FFFFFF"/>
        <path d="M28 141h8v9h6v8H32v-7h-4zM85 143h7v14h-10v-6h3z" fill="#D1D7EF" stroke="none"/>
        {/* Square-pixel round face with pointy ears */}
        <path d="M24 58h13l10 11h32l10-11h16v15h8v8h5v33h-5v10h-8v8H25v-7h-7v-9h-7V83h6v-12h7z" fill="#FFFFFF"/>
        <path d="M25 66h13l7 11-2 15-18-6z" fill="#FFB2C0" stroke="none"/>
        <path d="M101 66H89l-5 11 4 15 15-5z" fill="#FFB2C0" stroke="none"/>
        <path d="M21 118h7v6h9v5H25zM100 119h8l-6 10h-9v-5h7z" fill="#D1D7EF" stroke="none"/>
      </g>
      {/* Five-pixel blush patches and canonical muzzle. */}
      <path d="M25 112h13v9H25zM90 112h13v9H90z" fill="#FF9FAE"/>
      {squint
        ? <g stroke="#12121D" strokeWidth="4.5" strokeLinecap="square" fill="none">
            <path d="M39 109l6-6 6 7M77 110l7-7 6 6"/>
          </g>
        : focused
        ? <g stroke="#12121D" strokeWidth="4.5">
            <path d="M39 102h12m27 0h12"/>
            <path d="M41 106h8v7h-8zM81 106h8v7h-8z" fill="#12121D" stroke="none"/>
          </g>
        : <g fill="#12121D">
            <path d="M40 100h8v14h-8zM80 100h8v14h-8z"/>
            <path d="M41 101h2v4h-2zM81 101h2v4h-2z" fill="#FFFFFF"/>
          </g>}
      {worried
        ? <g stroke="#12121D" fill="none" strokeWidth="3.5"><circle cx="64" cy="122" r="5"/></g>
        : <g><path d="M59 113h9v5h-9z" fill="#12121D"/>
            {smile
              ? <path d="M52 118v7h5v5h14v-5h5v-7" fill="#FF667D" stroke="#12121D" strokeWidth="3.5" strokeLinejoin="miter"/>
              : <path d="M54 118v6h7v4h8v-4h6v-6" stroke="#12121D" strokeWidth="4" fill="none" strokeLinejoin="miter"/>}
          </g>}
      {/* Iconic mortarboard. Hat never changes with mood or motion. */}
      <g className={style.hat} stroke="#12121D" strokeWidth="5" strokeLinejoin="miter">
        <path d="M19 48L62 24l49 22-46 26z" fill="#174DE3"/>
        <path d="M19 48l43-24 49 22-27 14-45-3z" fill="#246BFF" stroke="none"/>
        <path d="M49 37l13-7 28 13-11 6z" fill="#4D8AFF" stroke="none"/>
        <path d="M37 58h54v9l-7 11H43l-6-10z" fill="#163CA4"/>
        <path d="M45 63h38v7H45z" fill="#0B287F" stroke="none"/>
        <path d="M61 39h10v7H61z" fill="#FFDC35" stroke="none"/>
        <path d="M71 42l27 8 9 6" fill="none" stroke="#FFC62E" strokeWidth="5"/>
        <path d="M104 58h8v21l5 8v8h-15v-8l3-8z" fill="#FFC935"/>
        <path d="M107 80h6v8h-6z" fill="#FFE872" stroke="none"/>
      </g>
      {mood==="thinking"&&<g className={style.accent} fontFamily="Arial,sans-serif" fontWeight="900" fontSize="29">
        <text x="96" y="33" fill="#246BFF" stroke="#FFFFFF" strokeWidth="2" paintOrder="stroke">?</text></g>}
      {mood==="curious"&&<g className={style.accent}><path d="M15 27l3-10 3 10 10 3-10 3-3 10-3-10-10-3z" fill="#FFE342" stroke="#12121D" strokeWidth="2"/></g>}
      {mood==="surprised"&&<g className={style.accent}>
        <path d="M11 42v-12m0-7v-5" stroke="#FF8D35" strokeWidth="6" strokeLinecap="square"/></g>}
      {mood==="encourage"&&<g className={style.accent}>
        <path d="M104 31l6-14 6 14 11 5-11 5-6 14-6-14-11-5z" fill="#FFE342" stroke="#12121D" strokeWidth="2"/></g>}
      {mood==="celebrate"&&<g className={style.accent} fill="#FFE342" stroke="#12121D" strokeWidth="2">
        <path d="M15 27l4-11 4 11 10 4-10 4-4 11-4-11-10-4z"/>
        <path d="M111 40l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"/>
      </g>}
      </>}
      {referenceArt&&mood!=="idle"&&<g className={style.accent} aria-hidden="true">
        <rect x="102" y="7" width="23" height="24" rx="1" fill={mood==="celebrate"?"#FFE342":"#FFFFFF"} stroke="#12121D" strokeWidth="2"/>
        <text x="113.5" y="25" fill="#12121D" fontFamily="Arial, sans-serif"
          fontSize="17" fontWeight="900" textAnchor="middle">{({
            happy:"♥",thinking:"?",curious:"✦",focused:"!",encourage:"♥",
            celebrate:"★",surprised:"!"
          } as Record<Exclude<XiaozhiMood,"idle">,string>)[mood as Exclude<XiaozhiMood,"idle">]}</text>
      </g>}
    </svg>
  </span>;
}

/** Back-compatible alias used by every older Pixel Pop page. */
export function PixelCat({size=110,cheer=false}:{size?:number;cheer?:boolean}){
  return <Xiaozhi size={size} mood={cheer?"celebrate":"idle"} motion={cheer?"bounce":"none"}/>;
}
