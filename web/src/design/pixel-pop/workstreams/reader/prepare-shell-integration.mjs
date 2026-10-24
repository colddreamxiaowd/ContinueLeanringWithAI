// Generate a temporary A+C integrated Next.js route in the CI checkout.
// A owns its shell; C owns ReaderDemo embedded. Nothing here edits persisted CoursePack.
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const target=resolve("web/src/app/ui-lab/session-c/page.tsx");
const page=`
import {ShellIntegrationFrame} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import {ReaderDemo} from "@/design/pixel-pop/workstreams/reader/Demo";
import type {IntegrationNavigation} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
const navigation:readonly IntegrationNavigation[]=[
 {id:"courses",label:"我的课程",href:"/courses",icon:"courses"},
 {id:"reader",label:"深度阅读",href:"/ui-lab/session-c",icon:"docs"},
 {id:"practice",label:"练习",href:"/ui-lab/session-d",icon:"plan"}
];
export const metadata={title:"知序 Learning Hub · A × C 阅读整合验收",
 description:"A 的共享品牌和导航搭载 C 的阅读器。仅合成示例。"};
export default function SessionCPage(){
 return <ShellIntegrationFrame surface="reader" navigation={navigation}
    crumbs={[{label:"我的课程",href:"/courses"},{label:"数据结构 · 演示"},
      {label:"第3章 栈与队列"}]}>
   <ReaderDemo embedded/>
 </ShellIntegrationFrame>;
}
`;
await mkdir(resolve("web/src/app/ui-lab/session-c"),{recursive:true});
await writeFile(target,page,"utf8");
console.log("Prepared ephemeral A Shell + C Reader preview route");
