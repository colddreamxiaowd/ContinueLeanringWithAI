import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
export default function SparseTransposePage(){return <AppShell>
 <Breadcrumbs items={[{label:'交互实验',href:'/experiments'},{label:'稀疏矩阵快速转置'}]}/>
 <div className="page-heading"><h1>稀疏矩阵快速转置 · V3 实验</h1><p>基于明确标记的合成样例，使用浏览器中的 C++ WebAssembly 执行；当前仅供版本审查。</p></div>
 <p style={{margin:'18px 0'}}><Link className="button button-ghost" href="/lab-v3.html">在独立页面打开 <ExternalLink size={14}/></Link></p>
 <iframe title="稀疏矩阵快速转置交互实验" className="v3-experiment-frame" src="/lab-v3.html" loading="eager"/>
</AppShell>}
