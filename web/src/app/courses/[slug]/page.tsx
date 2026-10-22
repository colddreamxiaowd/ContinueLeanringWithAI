import Link from 'next/link';
import { ArrowRight, BookOpen, Circle, Layers2, PlayCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { courses, findCourse, countLessons } from '@/data/catalog';

export function generateStaticParams() {return courses.map(c=>({slug:c.slug}));}

export default async function CourseDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const course=findCourse(slug); if(!course)notFound();
  return <AppShell><Breadcrumbs items={[{label:'课程体系',href:'/courses'},{label:course.title}]}/><div className="course-detail-hero"><div className={`course-detail-emblem course-illustration--${course.accent}`}><Layers2 size={33}/></div><div><span className="section-kicker">COURSE OVERVIEW</span><h1>{course.title}</h1><p>{course.subtitle}</p><div className="course-detail-facts"><span>{course.chapters.length} 个章节</span><span>{countLessons(course)} 个知识条目</span><span>0 个正式发布条目</span></div></div></div>
    <div className="section-title section-title--compact"><div><h2>课程目录</h2><p>点击可阅读的演示章节，其他章节将在关联资料后开放。</p></div></div>
    <div className="chapter-list">{course.chapters.map((ch,i)=><section className="chapter-panel" key={ch.id}><div className="chapter-title"><span className="chapter-index">{String(i+1).padStart(2,'0')}</span><h3>{ch.title}</h3><span className="chapter-count">{ch.lessons.length} 节</span></div>{ch.lessons.map(l=><div key={l.id} className="lesson-row"><span className={`lesson-status-icon ${l.status==='sample'?'lesson-status-icon--sample':''}`}>{l.status==='sample'?<PlayCircle size={17}/>:<Circle size={16}/>}</span><div><strong>{l.title}</strong><small>{l.status==='sample'?'V1 示例阅读内容':'尚未导入真实资料'}</small></div>{l.articleSlug?<Link className="text-link" href={`/read/${l.articleSlug}`}>阅读示例 <ArrowRight size={16}/></Link>:<span className="tag tag-muted">规划中</span>}</div>)}</section>)}</div>
    <div className="inline-info"><BookOpen size={18}/><p>课程目录为信息架构样本，与真实 PPT 章节的对应关系尚未校对；V2 将根据资料映射知识点与来源页码。</p></div>
  </AppShell>;
}
