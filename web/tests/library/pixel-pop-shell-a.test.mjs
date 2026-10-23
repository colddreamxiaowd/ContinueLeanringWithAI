import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const base=resolve(import.meta.dirname,"../../src/design/pixel-pop/workstreams/shell");
const source=(name)=>readFileSync(resolve(base,name),"utf8");

test("Session A owns exactly three reusable shell components and local styles",()=>{
  for(const [filename,name] of [
    ["SidebarNav.tsx","SidebarNav"],
    ["DensitySwitch.tsx","DensitySwitch"],
    ["BreadcrumbTrail.tsx","BreadcrumbTrail"]
  ])assert.match(source(filename),new RegExp("export function "+name+"\\("));
  assert.match(source("Demo.tsx"),/export function ShellDemo\(/);
  assert.match(source("Demo.tsx"),/import \{BrandHeader\} from/);
  assert.match(source("Demo.tsx"),/import \{PopButton,PopPanel\} from/);
  assert.match(source("shell.module.css"),/var\(--pp-ink\)/);
});
test("Sidebar provides controlled active, collapsed and mobile states with keyboard close",()=>{
  const s=source("SidebarNav.tsx");
  for(const pattern of [/activeId/,/collapsed/,/mobileOpen/,/onMobileClose/,/aria-current/,/Escape/,/aria-disabled/])
    assert.match(s,pattern);
  for(const route of ['href:"/"','href:"/courses"','href:"/library"'])
    assert.ok(s.includes(route));
  assert.doesNotMatch(s,/href:"\/(study-plan|favorites|trash)"/);
});
test("DensitySwitch uses the canonical mode IDs and accessible selection",()=>{
  const s=source("DensitySwitch.tsx");
  for(const mode of ['value:"minimal"','value:"balanced"','value:"normal"'])
    assert.ok(s.includes(mode));
  for(const pattern of [/onChange/,/aria-expanded/,/aria-checked/,/ArrowDown/,/ArrowUp/,/Escape/])
    assert.match(s,pattern);
  const demo=source("Demo.tsx");
  assert.match(demo,/data-density=\{density\}/);
  assert.match(demo,/localStorage\.setItem\("zhixu_pixel_pop_density"/);
});
test("Breadcrumb supports current page, multi-level collapse and actionable previous/next",()=>{
  const s=source("BreadcrumbTrail.tsx");
  for(const pattern of [/aria-label="面包屑导航"/,/aria-current="page"/,/length>3/,/previous/,/next/,/disabled/])
    assert.match(s,pattern);
});
test("Mobile shell and reduced motion remain isolated to the shell CSS module",()=>{
  const css=source("shell.module.css");
  for(const pattern of [/@media\(max-width:720px\)/,/@media\(max-width:420px\)/,
    /prefers-reduced-motion/,/data-collapsed/,/data-mobile-open/,/focus-visible/])
    assert.match(css,pattern);
  assert.doesNotMatch(css,/(^|\n)body\s*\{/);
});
