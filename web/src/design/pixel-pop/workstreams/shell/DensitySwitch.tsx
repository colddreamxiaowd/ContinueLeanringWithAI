"use client";

import {useEffect,useId,useRef,useState} from "react";
import {Check,ChevronDown,Layers3,LayoutGrid,Rows3} from "lucide-react";
import styles from "./shell.module.css";

export type PixelPopDensity = "minimal"|"balanced"|"normal";

export const DENSITY_OPTIONS: readonly {
  value:PixelPopDensity;label:string;description:string
}[] = [
  {value:"minimal",label:"舒适",description:"留白更宽 · 装饰更少"},
  {value:"balanced",label:"标准",description:"内容与间距均衡"},
  {value:"normal",label:"紧凑",description:"缩小间距 · 一屏展示更多"}
];

/**
 * Controlled density selector. Parent owns persistence and data-density on .pp-root.
 * Minimal=舒适 (roomy), balanced=标准, normal=紧凑 (compact).\n * IDs intentionally remain identical to PIXEL_POP_MODES in spec.mjs.
 */
export function DensitySwitch({
  value,onChange,disabled=false,className=""
}:{
  value:PixelPopDensity;
  onChange:(next:PixelPopDensity)=>void;
  disabled?:boolean;
  className?:string;
}){
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const firstOption=useRef<HTMLButtonElement>(null);
  const id=useId();
  const selected=DENSITY_OPTIONS.find(option=>option.value===value)??DENSITY_OPTIONS[1];

  useEffect(()=>{
    if(!open)return;
    function outside(event:PointerEvent){
      if(!ref.current?.contains(event.target as Node))setOpen(false);
    }
    function escape(event:KeyboardEvent){
      if(event.key==="Escape"){setOpen(false);ref.current?.querySelector<HTMLButtonElement>("button")?.focus();}
    }
    document.addEventListener("pointerdown",outside);
    document.addEventListener("keydown",escape);
    return ()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[open]);

  useEffect(()=>{if(open)firstOption.current?.focus();},[open]);

  const pick=(next:PixelPopDensity)=>{
    onChange(next);
    setOpen(false);
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };
  return <div className={[styles.density,className].filter(Boolean).join(" ")} ref={ref}>
    <button type="button" className={[styles.densityTrigger,open?styles.densityTriggerOpen:""].join(" ")}
      disabled={disabled} aria-haspopup="true" aria-expanded={open} aria-controls={id}
      onClick={()=>setOpen(!open)}>
      <Layers3 size={22} aria-hidden="true" className={styles.densityGlyph}/>
      <strong>页面密度</strong><span className={styles.densityValue}>{selected.label}</span>
      <ChevronDown size={20} className={open?styles.chevronUp:""} aria-hidden="true"/>
    </button>
    {open&&<div id={id} className={styles.densityMenu} role="radiogroup" aria-label="页面密度选项">
      {DENSITY_OPTIONS.map((option,index)=>{
        const active=option.value===value;
        const Icon=index===0?LayoutGrid:index===1?Rows3:Layers3;
        return <button key={option.value} type="button" role="radio" aria-checked={active}
          ref={index===0?firstOption:undefined}
          className={[styles.densityOption,active?styles.densityOptionActive:""].filter(Boolean).join(" ")}
          onClick={()=>pick(option.value)}
          onKeyDown={event=>{
            if(event.key!=="ArrowDown"&&event.key!=="ArrowUp")return;
            event.preventDefault();
            const buttons=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')??[]);
            const next=(index+(event.key==="ArrowDown"?1:buttons.length-1))%buttons.length;
            onChange(DENSITY_OPTIONS[next].value);
            buttons[next]?.focus();
          }}>
          <span className={styles.optionIcon}><Icon size={20} aria-hidden="true"/></span>
          <span className={styles.optionText}><strong>{option.label}</strong><small>{option.description}</small></span>
          {active&&<Check size={20} strokeWidth={3} aria-hidden="true"/>}
        </button>;
      })}
    </div>}
  </div>;
}
