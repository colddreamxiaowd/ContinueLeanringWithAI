import Link from 'next/link';
import { ArrowRight, FolderOpen, Layers2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { courses, countLessons } from '@/data/catalog';

export default function Courses() {
  return <AppShell><Breadcrumbs items={[{label:'课程体系'}]}/><div className="page-heading"><span className="section-kicker">STRUCTURED KNOWLEDGE</span><h1>课程体系</h1><p>按学科、课程、章节逐级深入。暂时使用示例课程架构，待真实资料导入后核对。</p></div>
    <div className="course-list">{courses.map(c=><Link className="course-list-row" key={c.id} href={`/courses/${c.slug}`}><div className={`course-list-icon course-illustration--${c.accent}`}><Layers2 size={28}/></div><div><span className="tag tag-muted">{c.subjectId === 'cs' ? '计算机科学' : '数学'}</span><h2>{c.title}</h2><p>{c.subtitle}</p></div><div className="course-list-meta"><span>{c.chapters.length} 章 · {countLessons(c)} 节</span><small>正式内容未导入</small></div><ArrowRight className="arrow-soft" size={19}/></Link>)}</div>
    <div className="inline-info"><FolderOpen size={19}/><p>V1 验收重点是导航、内容数据模型与阅读布局。正式课程边界和章节顺序将在 V2 根据上传资料校对。</p></div>
  </AppShell>;
}
