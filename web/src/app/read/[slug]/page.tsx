import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, BookOpenText, FileQuestion, FlaskConical, Info, Lightbulb, Link2, Quote } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { articles, courses, findArticle, knowledgePoints } from '@/data/catalog';

export function generateStaticParams(){return articles.map(a=>({slug:a.slug}));}

export default async function Reader({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const article=findArticle(slug); if(!article)notFound();
  const course=courses.find(c=>c.id===article.courseId)!;
  return <AppShell><Breadcrumbs items={[{label:'课程体系',href:'/courses'},{label:course.title,href:`/courses/${course.slug}`},{label:article.title}]}/>
    <div className="reading-layout">
      <aside className="reading-nav"><div className="reading-nav-heading"><BookOpenText size={17}/>课程章节</div><h3>{course.title}</h3>{course.chapters.map(ch=><div key={ch.id} className="reading-chapter"><strong>{ch.title}</strong>{ch.lessons.map(lesson=><div className={`reading-chapter-link ${lesson.articleSlug===slug?'reading-chapter-link--active':''}`} key={lesson.id}>{lesson.articleSlug?<Link href={`/read/${lesson.articleSlug}`}>{lesson.title}</Link>:<span>{lesson.title}</span>}</div>)}</div>)}</aside>
      <article className="article-body"><span className="article-overline">DEEP LEARNING / LEARNING NOTES</span><h1>{article.title}</h1><p className="article-lead">{article.summary}</p><div className="article-tags"><span className="tag tag-demo">V1 演示文章</span><span className="tag tag-muted">约 {article.readingMinutes} 分钟</span>{article.knowledgePointIds.map(id=><span key={id} className="tag tag-outline">{knowledgePoints.find(k=>k.id===id)?.label}</span>)}</div>
        <div className="source-alert"><Info size={19}/><p><strong>来源说明：</strong>{article.provenance.message}</p></div>
        <section id="problem" className="prose-section"><h2>1. 为什么需要循环队列？</h2><p>假设用长度为 5 的数组顺序保存一个队列。起初不断入队，队尾索引一路向右移动；即使前面的元素已经出队，数组左侧也可能空着。此时如果只允许 <code>rear</code> 增加，就会遇到一个悖论：数组还有空位，队尾却已经触碰边界。</p><p>这就是<strong>假溢出</strong>。问题不在于容量真的耗尽，而在于我们没有重新利用数组开头已经释放的位置。</p><div className="comparison-diagram"><div className="diagram-label"><span>普通顺序队列</span><small>前端空闲位置无法自动复用</small></div><div className="array-blocks"><span className="empty-cell">空</span><span className="empty-cell">空</span><span>12</span><span>15</span><span>21</span></div><div className="diagram-note">front → 2 <span>rear → 5（越界）</span></div></div></section>
        <section id="model" className="prose-section"><h2>2. 从直觉到环形模型</h2><p>把数组最后一个位置想象成紧挨着第一个位置。队尾移动到边界时，它不必继续向右，而是返回索引 0。存储空间没有真的弯成圆环，发生变化的是<strong>下标计算规则</strong>。</p><div className="insight-card"><Lightbulb size={21}/><div><strong>先预测，再看公式</strong><p>如果容量是 5，当前队尾在索引 4，那么下一个有效索引应该是什么？答案是 0。因为我们希望索引始终落在 0 ～ 4。</p></div></div></section>
        <section id="formula" className="prose-section"><h2>3. 取模回绕与判空判满</h2><p>利用余数运算就能统一表达移动与回绕：</p><div className="formula-box"><code>nextIndex = (index + 1) % capacity</code><span>从任意合法下标前进一步</span></div><p>一个常见的实现策略是<strong>刻意保留一个空位置</strong>，用两个下标区分空和满：</p><div className="rule-list"><div><span>判空</span><code>front === rear</code></div><div><span>判满</span><code>(rear + 1) % capacity === front</code></div></div><p>因此，当数组长度是 5 时，这种方案最多保存 4 个元素。其他实现也可以通过额外的计数器充分利用全部容量，但需要同步维护更多状态。</p></section>
        <section id="code" className="prose-section"><h2>4. C++ 实现示例</h2><p>下面是用于说明下标规则的简化实现；这是示例代码，正式的运行与编译记录将在后续阶段接入。</p><pre className="code-block"><span className="code-filename">circular_queue.cpp · 教学示例</span><code>{`#include <vector>
#include <stdexcept>

class CircularQueue {
  std::vector<int> data;
  size_t front = 0, rear = 0;
public:
  explicit CircularQueue(size_t n) : data(n) {
    if (n < 2) throw std::invalid_argument("n must be >= 2");
  }
  bool empty() const { return front == rear; }
  bool full() const { return (rear + 1) % data.size() == front; }
  bool push(int x) {
    if (full()) return false;
    data[rear] = x;
    rear = (rear + 1) % data.size();
    return true;
  }
  bool pop() {
    if (empty()) return false;
    front = (front + 1) % data.size();
    return true;
  }
};`}</code></pre></section>
        <section id="check" className="prose-section"><h2>5. 自己预测下一步</h2><div className="practice-prompt"><span className="practice-kicker"><FileQuestion size={17}/> 思考练习 · 暂不记录成绩</span><p>队列的数组容量为 6，采用“浪费一个位置”的判满方式。若 <code>front = 4</code>、<code>rear = 2</code>，此时队列是空、满，还是可以继续入队？</p><details><summary>显示思路与答案</summary><p>可继续入队。因为 <code>(2+1)%6 = 3</code>，不等于 <code>front = 4</code>，所以还未满；同时 <code>front !== rear</code>，因此不为空。</p></details></div></section>
        <div className="article-ending"><Quote size={20}/><p>阅读完成并不等于真正掌握。下一阶段会把推演、变式题和延迟复习与这篇文章关联。</p></div>
      </article>
      <aside className="article-aside"><div className="article-aside-card toc-card"><strong>本页目录</strong><nav aria-label="文章目录">{article.sections.map((s,i)=><a href={`#${s.id}`} key={s.id}>{i+1}. {s.title}</a>)}</nav></div><div className="article-aside-card"><strong>关联知识点</strong>{article.knowledgePointIds.map(id=><span className="knowledge-chip" key={id}><Link2 size={14}/>{knowledgePoints.find(k=>k.id===id)?.label}</span>)}</div><div className="article-aside-card"><strong>下一步</strong><p>试着在纸上手动更新 front / rear，再检查推导。</p><Link className="aside-link" href="/experiments">查看实验规划 <ArrowUpRight size={15}/></Link></div><div className="article-aside-card source-aside"><FlaskConical size={18}/><p>V1 不包含真实代码执行沙箱和同步题库。</p></div></aside>
    </div>
  </AppShell>;
}
