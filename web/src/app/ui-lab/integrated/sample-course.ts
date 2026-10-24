import type {QuizQuestion} from "@/design/pixel-pop/workstreams/learning";
import type {ProgressChapter,DashboardSourceFile,DashboardStudyTask} from "@/design/pixel-pop/workstreams/dashboard";

/** A *synthetic* CoursePack v0.1, not a file recovered from any Feishu account.
 * The same data powers the integrated B progress card and D quiz controls.
 */
type DemoBlock=
  | {id:string;type:"explanation";markdown:string;sourceRefIds?:string[]}
  | {id:string;type:"code";language:string;source:string}
  | {id:string;type:"stack-simulator";initial:number[];capacity:number}
  | {id:string;type:"quiz";prompt:string;options:string[];answerIndex:number;hint:string};
export const DEMO_COURSEPACK={
 schemaVersion:"0.1",visibility:"private",title:"数据结构 · 栈与队列",
 description:"用于验证统一产品阅读、实验和做题的合成课程；不会写入学习记录。",
 version:1,
 sourceRefs:[{id:"demo-source-1",fileName:"数据结构演示讲义.pptx",locator:"合成讲义 · 第12页"}],
 chapters:[
  {id:"basics",title:"栈的基本概念",blocks:[
   {id:"p1",type:"explanation",markdown:"栈遵循后进先出（LIFO）。这里是合成演示，不属于真实飞书来源。",sourceRefIds:["demo-source-1"]}]},
  {id:"operations",title:"栈的 Push / Pop",blocks:[
   {id:"p2",type:"explanation",markdown:"Push 入栈，Pop 出栈。",sourceRefIds:["demo-source-1"]},
   {id:"p2code",type:"code",language:"python",source:"stack=[]\nstack.append(3)\nstack.pop()"},
   {id:"p2sim",type:"stack-simulator",initial:[1,2],capacity:6}]},
  {id:"applications",title:"栈的应用场景",blocks:[
   {id:"p3",type:"explanation",markdown:"函数调用、表达式求值和撤销操作均可使用栈。"}]},
  {id:"practice",title:"综合练习",blocks:[
   {id:"quiz1",type:"quiz",prompt:"执行 push(1), push(2), push(3), pop(), push(4) 后，栈顶元素是多少？",
    options:["1","2","3","4"],answerIndex:3,hint:"弹出 3 后，压入 4，所以栈顶为 4。"},
   {id:"quiz2",type:"quiz",prompt:"执行 Push(5)、Push(8)、Pop() 后，栈顶元素是多少？",
    options:["5","8","0","空栈"],answerIndex:0,hint:"8 先弹出，留下 5。"}]},
  {id:"assessment",title:"章节测验",blocks:[
   {id:"p5",type:"explanation",markdown:"这是尚未完成的演示章节；正式成绩应由 CoursePack 授权接口保存。"}]}
 ] as {id:string;title:string;blocks:DemoBlock[]}[]
};
export const DEMO_CHAPTERS:ProgressChapter[]=DEMO_COURSEPACK.chapters.map((ch,i)=>({
 id:ch.id,title:ch.title,status:i<3?"completed":i===3?"current":"available"
}));
export const DEMO_FILES:DashboardSourceFile[]=[
 {id:"demo-source-1",name:"数据结构演示讲义.pptx",kind:"pptx",subtitle:"合成课程资料 · 非真实飞书同步",outcome:"course",syncState:"synced"},
 {id:"demo-pdf",name:"栈与队列习题.pdf",kind:"pdf",subtitle:"合成练习 · 未连接账户",outcome:"practice",syncState:"synced"},
 {id:"demo-md",name:"栈的实现.md",kind:"markdown",subtitle:"演示学习笔记",outcome:"supplement",syncState:"synced"},
 {id:"demo-feishu",name:"飞书示例来源",kind:"feishu",subtitle:"演示图标，非真实飞书链接",outcome:"none",syncState:"not-synced"}
];
export const DEMO_TASKS:DashboardStudyTask[]=[
 {id:"lesson",title:"栈的 Push / Pop",kind:"video",status:"in-progress",durationMinutes:8,subtitle:"阅读讲解 · 演示任务"},
 {id:"practice",title:"综合练习",kind:"practice",status:"not-started",durationMinutes:12},
 {id:"quiz",title:"章节测验",kind:"quiz",status:"not-started",durationMinutes:10}
];
export const DEMO_QUIZZES:QuizQuestion[]=DEMO_COURSEPACK.chapters.flatMap(ch=>ch.blocks.flatMap(b=>{
 if(b.type!=="quiz")return [];
 return [{id:b.id,title:b.prompt,
  expression:b.id==="quiz1"?"push(1), push(2), push(3), pop(), push(4)":"push(5), push(8), pop()",
  options:b.options.map((label,i)=>({id:String(i),label})),correctOptionId:String(b.answerIndex),
  explanation:b.hint,difficulty:"简单" as const}];
}));
