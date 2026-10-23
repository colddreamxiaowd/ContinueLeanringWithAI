import Link from "next/link";
import {BrandHeader,CourseHero,StackMonument} from "@/design/pixel-pop/blocks/lego";
import styles from "./page.module.css";

export const metadata={
 title:"Pixel Pop · LEGO 01 组件工作台",
 description:"专注三个视觉零件：品牌导航、黄色课程主视觉、立体栈插画。"
};
export default function PixelPopBlocks(){
 return <div className={styles.root}>
  <BrandHeader/>
  <main className={styles.main}>
   <div className={styles.heading}><div><b>DESIGN LAB / BATCH 01</b><h1>先把三个积木搭好。</h1><p>这一页只做组件验收，不提前拼满整个首页。</p></div>
     <Link href="/" className={styles.back}>↗ 返回现有首页</Link></div>
   <section className={styles.stage}>
    <div className={styles.blockTop}><span>01 / TOP BAR</span><span>品牌标志 · 搜索入口 · 小知</span></div>
    <div className={styles.info}>顶部品牌栏在屏幕最上方单独展示，作为所有页面共享的零件。</div>
    <div className={styles.blockTop}><span>02 / HERO COMPOSITION</span><span>目标：黄色横幅 / 粗线 / 硬阴影 / 标题构图</span></div>
    <CourseHero/>
    <div className={styles.blockTop}><span>03 / STACK MONUMENT</span><span>可独立复用的 SVG 图形</span></div>
    <div className={styles.artStage}><StackMonument className={styles.artImage}/><div>
      <h2>同一个积木，重复使用。</h2><p>Push / Pop / Stack 采用同一份矢量图，不再每次重新生成一套不同视角的插画。</p>
      <p>主视觉中只负责展示概念；真正的 Push / Pop 数据操作由课程实验组件处理。</p>
    </div></div>
    <div className={styles.blockTop}><span>验收标准</span><span>此页面不包含虚构课程进度</span></div>
    <p className={styles.note}>此批次只验收组件轮廓、字重、颜色、比例、缩放和视觉一致性。下一批再独立制作侧边栏、进度卡和资料卡。实际课程功能仍由 CoursePack 系统负责。</p>
   </section>
  </main>
 </div>
}
