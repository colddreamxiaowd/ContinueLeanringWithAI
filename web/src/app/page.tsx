import Link from 'next/link';
import { ArrowRight, BookOpenText, CheckCheck, Code2, FolderSync, GraduationCap, Layers2, LibraryBig, PlayCircle, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { courses, articles } from '@/data/catalog';

export default function Dashboard() {
  return <AppShell>
    <div className="hero-bar"><div><span className="eyebrow"><Sparkles size={15}/> 你的学习工作台</span><h1>你好，继续构建你的知识体系。<span className="wave">✦</span></h1><p>从课程进入知识点，让阅读、练习和验证成为连续的学习过程。</p><div className="hero-actions"><Link className="button button-primary" href="/read/circular-queue">体验示例文章 <ArrowRight size={16}/></Link><Link className="button button-ghost" href="/courses">浏览课程体系</Link><Link className="button button-ghost" href="/experiments/sparse-transpose">体验矩阵实验</Link></div></div><div className="hero-art" aria-hidden="true"><span className="orb orb-one"/><span className="orb orb-two"/><span className="orb orb-three"/><div className="hero-art-text">Learn<br/>· Practice<br/>· Grow</div></div></div>
    <div className="metric-grid">
      <div className="metric-card"><div className="metric-icon metric-indigo"><BookOpenText size={20}/></div><span>正式发布文章</span><strong>0 <small>篇</small></strong><p>合成样例已用于流程审查；正式 Blog 待审</p></div>
      <div className="metric-card"><div className="metric-icon metric-mint"><CheckCheck size={20}/></div><span>已验证题目</span><strong>0 <small>题</small></strong><p>V2 合成课件题库尚待真实材料复核</p></div>
      <div className="metric-card"><div className="metric-icon metric-lilac"><Code2 size={20}/></div><span>可运行实验 · 审查中</span><strong>1 <small>个</small></strong><p>基于合成样例的 V3 审查版</p></div>
      <div className="metric-card"><div className="metric-icon metric-amber"><FolderSync size={20}/></div><span>资料同步</span><strong className="metric-status">待连接</strong><p>飞书授权尚未配置</p></div>
    </div>
    <div className="section-title"><div><span className="section-kicker">COURSE COLLECTION</span><h2>从这些课程开始</h2><p>按学科组织内容，逐步将原始资料转化为可学习的章节。</p></div><Link href="/courses" className="text-link">查看全部课程 <ArrowRight size={16}/></Link></div>
    <div className="course-grid">
      {courses.map((c, i)=><Link className="course-card" key={c.id} href={`/courses/${c.slug}`}><div className={`course-illustration course-illustration--${c.accent}`}><div className="abstract-mark"><Layers2 size={35} strokeWidth={1.55}/></div><span className="course-index">0{i+1}</span></div><div className="course-card-body"><span className="tag tag-muted">{c.label}</span><h3>{c.title}</h3><p>{c.subtitle}</p><div className="course-meta"><span>{c.chapters.length} 个章节</span><span className="course-entry">进入课程 <ArrowRight size={15}/></span></div></div></Link>)}
    </div>
    <div className="overview-grid">
      <section className="panel"><div className="panel-heading"><div><span className="section-kicker">READING EXPERIENCE</span><h2>阅读预览</h2></div><span className="tag tag-demo">演示材料</span></div>{articles.map(a=><Link href={`/read/${a.slug}`} className="recent-row" key={a.id}><div className="recent-icon"><BookOpenText size={21}/></div><div><strong>{a.title}</strong><span>{a.summary}</span></div><ArrowRight size={18}/></Link>)}<div className="panel-bottom-note">示例文章不计入正式发布数量，不代表已完成材料解析。</div></section>
      <section className="panel"><div className="panel-heading"><div><span className="section-kicker">PROJECT PIPELINE</span><h2>项目接入状态</h2></div><span className="tag tag-muted">V3 审查</span></div><div className="pipeline-row"><span className="pipeline-logo">G</span><div><strong>GitHub 仓库</strong><small>版本管理 · V3 实验待审批</small></div><span className="state-ready">已连接</span></div><div className="pipeline-row"><span className="pipeline-logo pipeline-feishu">F</span><div><strong>飞书资料库</strong><small>尚未配置开放平台授权</small></div><span className="state-pending">待配置</span></div><div className="pipeline-callout"><GraduationCap size={20}/><span>V3 已用合成矩阵样例完成实验验证；真实课程材料需获授权后另行验收。</span></div></section>
    </div>
  </AppShell>;
}
