import type {ReactNode} from "react";
import IntegratedShell from "./IntegratedShell";

export const metadata={
  title:"知序 Learning Hub · 统一产品体验",
  description:"A/B/C/D 真实组件在同一个 Next.js 网站内的交互整合预览；示例数据不落库。"
};
export default function IntegratedLayout({children}:{children:ReactNode}){
  return <IntegratedShell>{children}</IntegratedShell>;
}
