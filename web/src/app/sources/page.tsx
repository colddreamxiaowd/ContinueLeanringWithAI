import { ArrowRight, ClipboardCheck, FileText, FileUp, Fingerprint, FolderOpen, Info, Link2 } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { readDemoIndex } from '@/lib/v45-demo-data.mjs';

export default function Sources() {
  const demoIndex = readDemoIndex();
  const slideTotal = demoIndex.documents.reduce((total, document) => total + document.slide_count, 0);

  return <AppShell>
    <Breadcrumbs items={[{ label: '资料管理' }]}/>
    <div className="page-heading">
      <span className="section-kicker">SOURCE LIBRARY</span>
      <h1>原始资料库</h1>
      <p>所有文章、题目和实验都将与真实原始文件建立可追溯关联。</p>
      <div className="hero-actions"><Link className="button button-primary" href="/library">打开我的飞书资料 <ArrowRight size={16}/></Link></div>
    </div>

    <div className="inline-info">
      <Info size={18}/>
      <p>这里展示的是可公开访问的合成示例，与私人飞书资料库分开。真正授权的文件及同步状态请进入「我的飞书资料」查看；本页不读取账号私有文件。<Link href="/review/v2">查看 V2 审查内容 →</Link></p>
    </div>

    <section className="demo-source-section" aria-labelledby="demo-source-title">
      <div className="section-title">
        <div>
          <span className="section-kicker">OFFLINE SYNTHETIC DEMO / V4.5</span>
          <h2 id="demo-source-title">合成演示资料</h2>
          <p>从合成 PPTX 到页面，复用现有内容流水线；每份资料都可进入逐页详情。</p>
        </div>
        <span className="tag tag-demo">{demoIndex.documents.length} 份 · {slideTotal} 页</span>
      </div>
      <div className="demo-source-grid">
        {demoIndex.documents.map((document) => (
          <Link className="demo-source-card" href={`/sources/demo/${document.document_id}`} key={document.document_id}>
            <div className="demo-source-icon"><FileText size={21}/></div>
            <div className="demo-source-main">
              <div className="demo-source-tags">
                <span className="tag tag-demo">合成演示</span>
                <span className="tag tag-muted">{document.slide_count} 页</span>
              </div>
              <h3>{document.title}</h3>
              <p>来源类型：合成 Fixture · 版本 {document.current_version.slice(0, 12)}</p>
            </div>
            <span className="demo-source-open">查看详情 <ArrowRight size={15}/></span>
          </Link>
        ))}
      </div>
      <p className="demo-source-note">以上 JSON 由 <code>python scripts/v45_export_synthetic.py</code> 生成并提交；该页面不代表私人飞书同步数量。</p>
    </section>

    <div className="empty-state">
      <div className="empty-state-icon"><FolderOpen size={34}/></div>
      <h2>私人资料请到「我的飞书资料」查看</h2>
      <p>这里是对外公开的合成来源演示。已授权账号的资料索引、PPTX 阅读与同步功能位于登录后的私人资料库。</p>
      <div className="tag tag-demo">公开演示不包含私人资料</div>
    </div>

    <div className="workflow-steps">
      <div><FileUp size={21}/><h3>1. 资料登记</h3><p>获取原件与文件版本</p></div>
      <div><Fingerprint size={21}/><h3>2. 指纹与去重</h3><p>判断内容变化和知识点覆盖</p></div>
      <div><ClipboardCheck size={21}/><h3>3. 来源映射</h3><p>将文章、习题关联到页码</p></div>
      <div><Link2 size={21}/><h3>4. 受控发布</h3><p>记录审核与发布状态</p></div>
    </div>
    <div className="inline-info">
      <Info size={18}/>
      <p>V2 合成课件已完成解析、去重、页码和题库验证；合成矩阵样例在 <Link href="/review/v4">V4 资料审查记录</Link> 中展示。合成演示数据不代表真实课程内容，也不会自动发布。</p>
    </div>
  </AppShell>;
}
