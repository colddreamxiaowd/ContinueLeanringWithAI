import Link from 'next/link';
import { ArrowRight, Code2, FlaskConical, ShieldCheck, BookOpenText, Cpu, GitCompareArrows } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function Experiments(){return <AppShell>
  <Breadcrumbs items={[{label:'交互实验'}]}/>
  <div className="page-heading"><span className="section-kicker">LEARN BY DOING</span><h1>交互实验室</h1><p>可交互的算法样例，配合可更改输入与逐步状态演示，帮助你真正解释程序行为。</p></div>
  <div className="panel v3-lab-card" style={{marginTop:28,display:'grid',gap:15}}>
    <span className="tag tag-demo" style={{width:'fit-content'}}>V3 实验审查版 · 合成样例</span>
    <div style={{display:'flex',alignItems:'center',gap:13}}><FlaskConical size={29} color="var(--primary)"/><div><h2 style={{margin:0,fontSize:22}}>稀疏矩阵 · 快速转置</h2><p style={{color:'var(--muted)',margin:'4px 0'}}>稀疏矩阵快速转置 · 合成样例</p></div></div>
    <p style={{maxWidth:700,color:'var(--muted)'}}>输入自己的三元组，运行浏览器本地的真实 C++ WebAssembly 算法，单步追踪 cnum / cpot，每一步可回退；最终与独立朴素转置交叉核验。该版本不接受任意 C++ 源码编译。</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-primary" href="/experiments/sparse-transpose">进入实验 <ArrowRight size={16}/></Link><Link className="button button-ghost" href="/lab-v3.html">全屏打开实验</Link></div>
  </div>
  <div className="workflow-steps"><div><Code2 size={21}/><h3>真实 C++ 程序</h3><p>同一算法分别以原生程序和 WebAssembly 编译测试</p></div><div><Cpu size={21}/><h3>单步操作</h3><p>可调矩阵输入，逐步观测 cnum、cpot 和转置位置</p></div><div><GitCompareArrows size={21}/><h3>独立验证</h3><p>与朴素转置算法交叉比较，而非仅检查动画</p></div></div>
  <div className="pipeline-callout" style={{marginTop:18}}><ShieldCheck size={20}/><span>运行的是已审计的固定 WebAssembly 程序，用户输入只作为数据传入浏览器，不在业务服务器上执行。任意代码沙箱需要后续独立部署审查。</span></div>
</AppShell>}
