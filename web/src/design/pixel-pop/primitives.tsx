"use client";

import Link from "next/link";
import type {CSSProperties, ReactNode} from "react";
import {ArrowRight} from "lucide-react";

type PanelTone="paper"|"yellow"|"blue"|"violet";
export function PopPanel({children,tone="paper",className="",title,eyebrow,actions}:{
  children:ReactNode;tone?:PanelTone;className?:string;title?:string;eyebrow?:string;actions?:ReactNode;
}){
  return <section className={"pp-panel pp-panel--"+tone+" "+className}>
    {(title||eyebrow||actions)&&<div className="pp-panel-head"><div>
      {eyebrow&&<span className="pp-eyebrow">{eyebrow}</span>}
      {title&&<h2>{title}</h2>}
    </div>{actions}</div>}
    {children}
  </section>;
}
export function PopButton({children,href,onClick,variant="violet",disabled=false,className=""}:{
  children:ReactNode;href?:string;onClick?:()=>void;variant?:"violet"|"yellow"|"blue"|"coral"|"outline";
  disabled?:boolean;className?:string;
}){
  const cls="pp-button pp-button--"+variant+" "+className;
  if(href)return <Link className={cls} href={href}>{children}<ArrowRight size={16} aria-hidden="true"/></Link>;
  return <button type="button" className={cls} disabled={disabled} onClick={onClick}>{children}</button>;
}

// Every view reuses the same canonical Xiaozhi. No independent redraws.
export {PixelCat, Xiaozhi} from "./mascot/Xiaozhi";
export type {XiaozhiMood, XiaozhiPose, XiaozhiMotion} from "./mascot/Xiaozhi";

export function ProgressRing({value,label="课程进度"}:{value:number;label?:string}){
  const progress=Math.max(0,Math.min(100,Math.round(value)));
  const style={"--pp-progress":progress+"%"} as CSSProperties;
  return <div className="pp-progress-ring" role="progressbar" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={progress} aria-label={label} style={style}>
    <div className="pp-progress-core"><strong>{progress}%</strong><span>{label}</span></div>
  </div>;
}
