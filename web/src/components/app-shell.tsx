"use client";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
import {PixelPopSiteShell} from "@/design/pixel-pop/PixelPopSiteShell";

/**
 * Compatibility layer for V4.1–V4.7 business pages. Routes keep their existing
 * data requests, forms, and server-side auth; their old independent navigation,
 * header and theme surface are replaced by the real homepage Pixel Pop shell.
 */
const TITLES:Record<string,string>={
 "/courses":"课程体系",
 "/coursepacks":"我的互动课程",
 "/library":"我的飞书资料",
 "/sources":"来源资料",
 "/experiments":"互动实验",
 "/read":"技术文章",
 "/review":"资料审查"
};
export function AppShell({children}:{children:ReactNode}){
 const pathname=usePathname()||"/";
 const prefix=Object.keys(TITLES).find(key=>pathname===key||pathname.startsWith(key+"/"));
 return <PixelPopSiteShell title={prefix?TITLES[prefix]:"个人学习空间"}>
  <div className="pp-site-legacy" data-pixel-pop-content="true">{children}</div>
 </PixelPopSiteShell>;
}
