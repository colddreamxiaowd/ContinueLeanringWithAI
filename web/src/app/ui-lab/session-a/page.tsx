import {ShellDemo} from "@/design/pixel-pop/workstreams/shell/Demo";

export const metadata={
  title:"知序 · Session A 框架导航验收 — Pixel Pop",
  description:"真实 Next.js 组件实验室：侧边导航、三档密度、面包屑。仅用演示状态，不读用户课程。"
};

/** Session A only: dedicated visual QA route, never the production homepage. */
export default function SessionAPreview(){return <ShellDemo/>;}
