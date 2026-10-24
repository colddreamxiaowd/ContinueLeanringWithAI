"use client";
import {usePathname} from "next/navigation";
import {ShellIntegrationFrame,type IntegrationNavigation,type IntegrationSurface} from "@/design/pixel-pop/workstreams/shell/IntegrationFrame";
import type {ReactNode} from "react";

export const UNIFIED_NAV:readonly IntegrationNavigation[]=[
  {id:"home",label:"学习首页",href:"/ui-lab/integrated/home",icon:"home"},
  {id:"reader",label:"深度阅读",href:"/ui-lab/integrated/reader",icon:"courses"},
  {id:"practice",label:"互动练习",href:"/ui-lab/integrated/practice",icon:"plan"}
];
export default function IntegratedShell({children}:{children:ReactNode}){
  const pathname=usePathname();
  // Next.js is configured with trailingSlash=true; normalize for active navigation.
  const currentPath=pathname.endsWith("/")?pathname.slice(0,-1):pathname;
  const surface:IntegrationSurface=currentPath.endsWith("/reader")?"reader":currentPath.endsWith("/practice")?"practice":"home";
  const current=UNIFIED_NAV.find(x=>x.id===surface)!;
  const crumbs=[{label:"知序学习中心",href:UNIFIED_NAV[0].href},{label:current.label}];
  return <ShellIntegrationFrame surface={surface} navigation={UNIFIED_NAV}
    crumbs={crumbs} presentation="app"
    back={surface==="home"?undefined:{label:"返回学习首页",href:UNIFIED_NAV[0].href}}>
    {children}
  </ShellIntegrationFrame>;
}
