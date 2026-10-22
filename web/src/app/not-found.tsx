import Link from 'next/link';
export default function NotFound(){return <div style={{padding:'10vh 2rem',fontFamily:'sans-serif'}}><h1>没有找到这一页</h1><p>这个条目可能还没有加入课程目录。</p><Link href="/">返回学习总览</Link></div>}
