import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileWarning, Info, Table2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  readDemoDocument,
  readDemoIndex,
  type DemoBlock,
  type DemoDocument,
  type DemoParagraph,
} from '@/lib/v45-demo-data.mjs';

export const dynamicParams = false;

export function generateStaticParams() {
  return readDemoIndex().documents.map((document) => ({
    documentId: document.document_id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const document = readDemoDocument(documentId);
  return { title: document ? `${document.title} · 合成演示资料` : '合成演示资料' };
}

function paragraphsOf(block: Extract<DemoBlock, { type: 'text' }>): DemoParagraph[] {
  return block.paragraphs.filter((paragraph) => paragraph.text.trim().length > 0);
}

function TextBlock({ block }: { block: Extract<DemoBlock, { type: 'text' }> }) {
  const paragraphs = paragraphsOf(block);
  if (!paragraphs.length) return null;
  if (block.role === 'title') {
    return (
      <h2 className="demo-block-title">
        {paragraphs.map((paragraph) => (
          <span key={paragraph.index}>{paragraph.text}</span>
        ))}
      </h2>
    );
  }
  return (
    <div className="demo-paragraphs">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.index} className={paragraph.level ? 'demo-indent' : undefined}>
          {paragraph.text}
        </p>
      ))}
    </div>
  );
}

function TableBlock({ block }: { block: Extract<DemoBlock, { type: 'table' }> }) {
  const [head, ...body] = block.rows;
  return (
    <div className="demo-table-wrap">
      <div className="demo-block-label"><Table2 size={14}/> 表格 · 形状 #{block.shape_index}</div>
      <table className="demo-table">
        {head && <thead><tr>{head.map((cell, index) => <th key={index}>{cell}</th>)}</tr></thead>}
        {body.length > 0 && <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>}
      </table>
    </div>
  );
}

function UnsupportedBlock({ block }: { block: Extract<DemoBlock, { type: 'unsupported' }> }) {
  return (
    <div className="demo-unsupported">
      <FileWarning size={18}/>
      <div>
        <strong>未支持的内容类型：{block.shape_type}</strong>
        <p>{block.note} 形状位置：#{block.shape_index}。此项只标记存在，页面不展示或推测其内容。</p>
      </div>
    </div>
  );
}

function Slide({ slide }: { slide: DemoDocument['slides'][number] }) {
  const hasTitleBlock = slide.blocks.some(
    (block) => block.type === 'text' && block.role === 'title' && paragraphsOf(block).length > 0
  );
  return (
    <section className="demo-slide" id={`slide-${slide.slide_number}`}>
      <div className="demo-slide-head">
        <span className="tag tag-demo">第 {slide.slide_number} 页</span>
        <span className="demo-slide-index">slide_index {slide.slide_index}</span>
      </div>
      {!hasTitleBlock && <h2 className="demo-block-title">第 {slide.slide_number} 页</h2>}
      {slide.blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <div key={`${block.type}-${block.shape_index}-${index}`} className="demo-block">
              <div className="demo-block-label">文本 · 形状 #{block.shape_index}{block.role === 'title' ? ' · 标题' : ''}</div>
              <TextBlock block={block}/>
            </div>
          );
        }
        if (block.type === 'table') {
          return <TableBlock key={`${block.type}-${block.shape_index}-${index}`} block={block}/>;
        }
        return <UnsupportedBlock key={`${block.type}-${block.shape_index}-${index}`} block={block}/>;
      })}
    </section>
  );
}

export default async function DemoDocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const document = readDemoDocument(documentId);
  if (!document) notFound();

  return <AppShell>
    <Breadcrumbs items={[
      { label: '资料管理', href: '/sources' },
      { label: '合成演示资料', href: '/sources' },
      { label: document.title },
    ]}/>
    <div className="page-heading">
      <span className="section-kicker">SYNTHETIC SOURCE · V4.5</span>
      <h1>{document.title}</h1>
      <p>由现有 Python V4.3 内容流水线处理合成 PPTX 得到，逐页保留来源位置。不是飞书同步，也不是真实课程资料。</p>
    </div>
    <div className="tag-row" style={{ marginBottom: 18 }}>
      <span className="tag tag-demo">合成演示</span>
      <span className="tag tag-muted">{document.slide_count} 页</span>
      <span className="tag tag-muted">版本 {document.current_version.slice(0, 12)}</span>
      <span className="tag tag-muted">SHA-256 {document.source_sha256.slice(0, 12)}…</span>
    </div>
    <div className="source-alert" style={{ marginBottom: 20 }}>
      <Info size={18}/>
      <p>{document.notice} 页面文本全部来自已提交的合成数据，不以 HTML 注入方式渲染。</p>
    </div>
    <div className="demo-doc-layout">
      <nav className="demo-slide-nav" aria-label="幻灯片目录">
        <strong>页面目录</strong>
        {document.slides.map((slide) => (
          <a key={slide.slide_number} href={`#slide-${slide.slide_number}`}>
            第 {slide.slide_number} 页{slide.title ? ` · ${slide.title}` : ''}
          </a>
        ))}
        <Link className="demo-back" href="/sources"><ArrowLeft size={14}/> 返回资料管理</Link>
      </nav>
      <div className="demo-slide-list">
        {document.slides.map((slide) => <Slide key={slide.slide_number} slide={slide}/>)}
      </div>
    </div>
  </AppShell>;
}
