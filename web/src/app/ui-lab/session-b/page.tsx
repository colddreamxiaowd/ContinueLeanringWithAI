import "@/design/pixel-pop/pixel-pop.css";
import DashboardCardsDemo from "@/design/pixel-pop/workstreams/dashboard/Demo";

export const metadata = {
  title:"知序 · Session B 卡片精修验收 — Pixel Pop",
  description:"真实 Next.js 页面：课程进度、飞书资料与学习任务卡片。仅使用合成演示数据，不读取或修改用户资料。",
};

/** Integrator-owned preview route. Does not affect main page or private CoursePack data. */
export default function DashboardCardsLab(){
  return <DashboardCardsDemo/>;
}
