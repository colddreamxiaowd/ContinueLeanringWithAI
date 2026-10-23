"use client";

import Link from "next/link";
import {ArrowLeft,ChevronLeft,ChevronRight,Home,MoreHorizontal} from "lucide-react";
import styles from "./shell.module.css";

export type BreadcrumbItem = {label:string;href?:string};
export type BreadcrumbAction = {label:string;href?:string;onClick?:()=>void;disabled?:boolean};
type Props = {
  items:readonly BreadcrumbItem[];
  back?:BreadcrumbAction;
  previous?:BreadcrumbAction;
  next?:BreadcrumbAction;
  className?:string;
};

function Action({action,direction}:{action:BreadcrumbAction;direction:"back"|"previous"|"next"}){
  const Icon=direction==="next"?ChevronRight:direction==="back"?ArrowLeft:ChevronLeft;
  const cls=[styles.trailAction,direction==="next"?styles.trailActionNext:""].filter(Boolean).join(" ");
  const children=<><Icon size={17} aria-hidden="true"/><span>{action.label}</span></>;
  if(action.disabled||(!action.href&&!action.onClick)){
    return <span className={[cls,styles.trailActionDisabled].join(" ")} aria-disabled="true">{children}</span>;
  }
  if(action.href){
    return <Link className={cls} href={action.href} aria-label={action.label}>{children}</Link>;
  }
  return <button type="button" className={cls} aria-label={action.label} onClick={action.onClick}>{children}</button>;
}

/** A semantic navigation trail, independent of learning-progress and CoursePack state. */
export function BreadcrumbTrail({items,back,previous,next,className=""}:Props){
  const length=items.length;
  const clipped=length>3;
  const visible=clipped?[items[0],...items.slice(-2)]:items;
  return <div className={[styles.trail,className].filter(Boolean).join(" ")}>
    {back&&<div className={styles.trailBack}><Action action={back} direction="back"/></div>}
    <nav className={styles.trailNavigation} aria-label="面包屑导航">
      <ol className={styles.trailList}>
        {visible.map((item,index)=>{
          const last=index===visible.length-1;
          const isHome=index===0;
          return <li key={item.href??item.label+index} className={[styles.trailItem,last?styles.trailCurrent:""].filter(Boolean).join(" ")}>
            {index>0&&<ChevronRight size={15} className={styles.trailSeparator} aria-hidden="true"/>}
            {clipped&&index===1&&<span className={styles.trailEllipsis} aria-label="已省略中间层级"
              title={"省略 "+(length-3)+" 层"}><MoreHorizontal size={17} aria-hidden="true"/></span>}
            {isHome&&<Home size={19} className={styles.trailHome} aria-hidden="true"/>}
            {last?<span aria-current="page" title={item.label}>{item.label}</span>:
             item.href?<Link href={item.href} title={item.label}>{item.label}</Link>:
             <span title={item.label}>{item.label}</span>}
          </li>;
        })}
      </ol>
    </nav>
    {(previous||next)&&<div className={styles.trailActions}>
      {previous&&<Action action={previous} direction="previous"/>}
      {next&&<Action action={next} direction="next"/>}
    </div>}
  </div>;
}
