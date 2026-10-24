import Link from "next/link";
import {ReaderDemo} from "@/design/pixel-pop/workstreams/reader";
import s from "../unified.module.css";
export default function IntegratedReader(){
 return <section className={s.page} data-integrated-page="reader">
   <div className={s.demoBand}><strong>深度阅读 · 栈的 Push / Pop</strong><span>示例课程与来源 · 非真实飞书文档</span></div>
   <ReaderDemo embedded/>
   <div className={s.bottomLink}>
     <Link href="/ui-lab/integrated/home">← 返回学习首页</Link>
     <Link href="/ui-lab/integrated/practice" data-read-to-practice>读完了，进入互动练习 →</Link>
   </div>
 </section>;
}
