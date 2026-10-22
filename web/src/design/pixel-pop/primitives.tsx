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

// One fixed, reusable mascot across all pages; no model redraw required.
// Pixel coordinates are integral on purpose, preserving crisp edges at all sizes.
export function PixelCat({size=110,cheer=false}: {size?:number;cheer?:boolean}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" aria-label="知序的像素小猫吉祥物" role="img" shapeRendering="crispEdges" focusable="false">
    <g stroke="#12121D" strokeWidth="3" strokeLinejoin="miter">
      <path d="M11 22V8h11l9 10h7L47 8h10v17l3 12-7 17H13L4 37z" fill="#fff"/>
      <path d="M14 13h7v10h-7zm34 0h6v10h-6z" fill="#F7A8BB" stroke="none"/>
      <path d="M22 43h6v5h-6zm14 0h6v5h-6z" fill="#fff" stroke="none"/>
      <path d="M19 33h4v7h-4zm22 0h4v7h-4z" fill="#12121D" stroke="none"/>
      <path d="M13 40h7v4h-7zm32 0h7v4h-7z" fill="#FF8EAF" stroke="none"/>
      <path d="M29 42h7l-3 3z" fill="#FF799B" strokeWidth="1"/>
      <path d="M24 48l8 5 8-5" strokeWidth="2" fill="none"/>
      <path d="M14 21h36l-5-11H21z" fill="#405DFF"/>
      <path d="M9 17l23-12 23 12-23 11z" fill="#263FDD"/>
      <path d="M32 10v11" stroke="#FFE342" strokeWidth="2"/>
      <path d="M56 17v13" stroke="#FFE342" strokeWidth="2"/>
    </g>
    {cheer&&<g fill="#FFE342" stroke="#12121D" strokeWidth="1"><path d="M4 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" transform="translate(6 0)"/><path d="M56 34l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g>}
  </svg>;
}
export function ProgressRing({value,label="课程进度"}:{value:number;label?:string}){
  const progress=Math.max(0,Math.min(100,Math.round(value)));
  const style={"--pp-progress":progress+"%"} as CSSProperties;
  return <div className="pp-progress-ring" role="progressbar" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={progress} aria-label={label} style={style}>
    <div className="pp-progress-core"><strong>{progress}%</strong><span>{label}</span></div>
  </div>;
}
