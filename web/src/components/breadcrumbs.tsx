import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="crumbs" aria-label="面包屑导航">
    <Link href="/">首页</Link>{items.map((item,i)=><span key={i} className="crumb-item"><ChevronRight size={14}/>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}
  </nav>;
}
