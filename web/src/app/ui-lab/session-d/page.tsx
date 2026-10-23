import "@/design/pixel-pop/pixel-pop.css";
import LearningDemo from "@/design/pixel-pop/workstreams/learning/Demo";

export const metadata={
  title:"知序 Learning Hub · Session D 栈实验与答题 · Pixel Pop",
  description:"真实 Next.js 实验交互页面：Push / Pop、题目切换与即时反馈。使用合成示例，不保存真实课程成绩。"
};
/** Integrator-owned, independent visual acceptance route; not the production homepage. */
export default function SessionDLab(){return <LearningDemo/>;}
