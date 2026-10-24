import Link from "next/link";
import {ArrowRight,FolderOpen,Layers2,Search} from "lucide-react";
import {AppShell} from "@/components/app-shell";
import {Breadcrumbs} from "@/components/breadcrumbs";
import {courses,countLessons} from "@/data/catalog";

export default async function Courses({
 searchParams
}:{searchParams:Promise<{q?:string|string[]}>}){
 const params=await searchParams;
 const raw=Array.isArray(params.q)?params.q[0]:params.q;
 const query=typeof raw==="string"?raw.trim().slice(0,80):"";
 const normalized=query.toLocaleLowerCase("zh-CN");
 const visible=query?courses.filter(course=>
  [course.title,course.subtitle,course.subjectId,course.slug]
   .some(value=>String(value).toLocaleLowerCase("zh-CN").includes(normalized))
 ):courses;
 return <AppShell>
  <Breadcrumbs items={[{label:"课程体系"}]}/>
  <div className="page-heading">
   <span className="section-kicker">STRUCTURED KNOWLEDGE</span>
   <h1>课程体系</h1>
   <p>按学科、课程、章节逐级深入。当前显示示例课程架构；正式课程请以已授权资料及审核内容为准。</p>
  </div>
  {query&&<section className="inline-info" role="status">
   <Search size={18}/><p>正在搜索「{query}」：找到 {visible.length} 门课程。
    <Link href="/courses" className="text-link"> 清除筛选 →</Link></p>
  </section>}
  <div className="course-list">
   {visible.map(course=><Link className="course-list-row" key={course.id} href={`/courses/${course.slug}`}>
    <div className={`course-list-icon course-illustration--${course.accent}`}><Layers2 size={28}/></div>
    <div><span className="tag tag-muted">{course.subjectId==="cs"?"计算机科学":"数学"}</span>
     <h2>{course.title}</h2><p>{course.subtitle}</p></div>
    <div className="course-list-meta"><span>{course.chapters.length} 章 · {countLessons(course)} 节</span>
     <small>正式内容未导入</small></div>
    <ArrowRight className="arrow-soft" size={19}/>
   </Link>)}
   {visible.length===0&&<div className="empty-state" role="status">
    <Search size={28}/><h2>没有匹配的课程</h2>
    <p>试试课程名称或学科关键词，也可以返回完整课程列表。</p>
    <Link href="/courses" className="button button-primary">查看全部课程 →</Link>
   </div>}
  </div>
  <div className="inline-info"><FolderOpen size={19}/>
   <p>当前课程目录仍为演示数据。真实课程章节将在获得授权资料后核对。</p>
  </div>
 </AppShell>;
}
