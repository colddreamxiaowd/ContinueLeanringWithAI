#!/usr/bin/env node
/**
 * CI-only integrator fixture: actual B/C/D components are temporarily restored
 * from their frozen GitHub branches. This script writes three local Next routes
 * and one composition view to the checkout ONLY; those files are never committed.
 * It is run only after the original B/C/D source files exist on disk.
 */
import {mkdirSync,writeFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
const root=resolve("src");
for(const name of ["dashboard/CourseProgressCard.tsx","reader/reader.tsx","learning/StackPlayground.tsx"]){
  if(!existsSync(resolve(root,"design/pixel-pop/workstreams",name)))throw Error("Integration source missing: "+name);
}
const base=resolve(root,"app/ui-lab/session-a/integration");
const routes=["courses","reader","practice"];
const main=`"use client";
import {useRouter} from "next/navigation";
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {CourseProgressCard} from "@/design/pixel-pop/workstreams/dashboard/CourseProgressCard";
import {LessonContent} from "@/design/pixel-pop/workstreams/reader/reader";
import {StackPlayground} from "@/design/pixel-pop/workstreams/learning/StackPlayground";

const base="/ui-lab/session-a/integration";
const navigation=[
  {id:"courses",label:"我的课程",href:base+"/courses",icon:"courses"},
  {id:"reader",label:"课程阅读",href:base+"/reader",icon:"docs"},
  {id:"practice",label:"操作实验",href:base+"/practice",icon:"plan"}
] as const;
const chapters=[
  {id:"ch1",title:"栈的基本概念",status:"completed" as const},
  {id:"ch2",title:"栈的 Push / Pop",status:"current" as const},
  {id:"ch3",title:"栈的实际应用",status:"available" as const}
];
const lesson={
  id:"qa-stack",title:"栈的 Push / Pop",breadcrumb:["数据结构","第 3 章 栈与队列","3.2 栈的 Push / Pop"],
  blocks:[
    {type:"paragraph" as const,content:[{text:"本页直接使用 C 组 LessonContent 组件。以下为合成示例，并非真实 CoursePack。"}]},
    {type:"heading" as const,id:"qa-push",number:"01",title:"Push（入栈）"},
    {type:"paragraph" as const,content:[{text:"栈是一种后进先出（LIFO）的线性结构。"}]},
    {type:"code" as const,id:"qa-code",language:"python",code:"stack = []\\nstack.append(7)\\nstack.pop()"},
    {type:"heading" as const,id:"qa-pop",number:"02",title:"Pop（出栈）"},
    {type:"keyPoints" as const,title:"学习要点",items:["Push 插入栈顶","Pop 移除栈顶"]}
  ]
};
type Surface="courses"|"reader"|"practice";
export function CompositionPage({surface}:{surface:Surface}){
 const router=useRouter();
 const index=navigation.findIndex(x=>x.id===surface);
 const previous=index>0?{label:"上一节",href:navigation[index-1].href}:undefined;
 const next=index<navigation.length-1?{label:"下一节",href:navigation[index+1].href}:undefined;
 const crumbs=[{label:"首页",href:base+"/courses"},{label:"数据结构",href:base+"/courses"},
   {label:navigation[index].label}];
 return <ShellIntegrationFrame surface={surface} navigation={navigation} crumbs={crumbs}
   presentation="app" back={{label:"返回课程",href:base+"/courses"}}
   previous={previous} next={next}>
   <div data-real-composition={surface} aria-label="真实跨组组件组合验收">
     {surface==="courses"&&<CourseProgressCard title="学习进度 · B 组真实组件" progressPercent={68}
       chapters={chapters} onOpenChapter={()=>router.push(base+"/reader")}
       onContinue={()=>router.push(base+"/reader")}/>}
     {surface==="reader"&&<LessonContent lesson={lesson}/>}
     {surface==="practice"&&<StackPlayground initialStack={[1,2]} capacity={6}/>}
   </div>
 </ShellIntegrationFrame>;
}
`;
const mainPath=resolve(base,"IntegrationPage.tsx");
mkdirSync(dirname(mainPath),{recursive:true});
writeFileSync(mainPath,main);
for(const route of routes){
 const out=resolve(base,route,"page.tsx");
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,`import {CompositionPage} from "../IntegrationPage";\nexport default function Page(){return <CompositionPage surface="${route}"/>;}\n`);
}
console.log("Prepared isolated Next.js B/C/D composition routes:",routes.map(x=>base+"/"+x));
