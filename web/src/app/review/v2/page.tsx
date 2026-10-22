import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { V2ReviewQuiz } from '@/components/v2-review-quiz';
import sample from '@/data/v2-review.json';

export default function V2Review() {
  return <AppShell>
    <Breadcrumbs items={[{label:'资料管理',href:'/sources'},{label:'V2 处理证据审查'}]}/>
    <div className="page-heading"><span className="section-kicker">V2 · EVIDENCE-FIRST REVIEW</span><h1>资料到知识 · 可追溯处理链</h1><p>{sample.warning}</p></div>
    <div className="source-alert v2-status"><strong>审查状态：未发布</strong><p>离线生成的 1 篇 Blog 和 3 道题目仅用于验证数据流；真实课程内容尚未接入，飞书尚未授权。</p></div>
    <div className="v2-metrics">
      <div><small>真实解析的合成课件页数</small><strong>{sample.report.sourceSlideCount}</strong></div>
      <div><small>统一知识点定义</small><strong>{sample.report.knowledgePoints.length}</strong></div>
      <div><small>离线核验题目</small><strong>{sample.questions.length}</strong></div>
      <div><small>正式已发布内容</small><strong>0</strong></div>
    </div>
    <div className="v2-layout">
      <main className="v2-article"><span className="article-overline">XIAOWD BLOG WRITING / REVIEW DRAFT</span>
        {sample.articleBlocks.map((block,index)=>block.type==='h1'?<h1 key={index}>{block.text}</h1>:
          block.type==='h2'?<h2 key={index}>{block.text}</h2>:
          block.type==='quote'?<blockquote key={index}>{block.text}</blockquote>:
          block.type==='code'?<pre key={index} className="code-block">{block.text}</pre>:<p key={index}>{block.text}</p>)}
        <section className="v2-review-exercises"><h2>关联题库 · 独立作答</h2><p>不把查看文章认定为掌握；答题反馈只在当前页面临时显示。</p><V2ReviewQuiz questions={sample.questions}/></section>
      </main>
      <aside className="v2-evidence"><h2>原始幻灯片证据</h2><p>以下文字直接来自解析出的 PPTX，页码与 SHA-256 一起绑定。</p><small className="v2-hash">SHA-256: {sample.report.sha256}</small>{sample.slides.map(slide=><div className="v2-slide-card" key={slide.page}><strong>第 {slide.page} 页</strong>{slide.lines.map((line,index)=><p key={index}>{line}</p>)}</div>)}</aside>
    </div>
  </AppShell>;
}
