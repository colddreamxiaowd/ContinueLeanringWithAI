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


test("Round 2: visual geometry is tied to exact three canonical density modes",()=>{
  const css=source("shell.module.css");
  const demoCss=source("demo.module.css");
  const density=source("DensitySwitch.tsx");
  assert.match(css,/\.navShell\{width:232px/);
  assert.match(css,/\.navShell\[data-collapsed="true"\]\{width:66px/);
  for(const mode of ["minimal","normal"]){
    assert.ok(css.includes('.pp-root[data-density="'+mode+'"]'),"missing shell density "+mode);
    assert.ok(demoCss.includes('.root[data-density="'+mode+'"]'),"missing demo density "+mode);
  }
  assert.match(css,/minimal"\]\) \.navLink\{min-height:55px/);
  assert.match(css,/normal"\]\) \.navLink\{min-height:42px/);
  assert.match(css,/\.densityOption\{min-height:54px/);
  assert.match(css,/\.trailMobileOverflow\{display:inline-flex/);
  for(const label of ["极简","较简","正常"])assert.ok(density.includes(label));
});
test("Round 2: navigation menu exposes the entire path and mobile navigation actions",()=>{
  const trail=source("BreadcrumbTrail.tsx");
  assert.match(trail,/<details/);
  assert.match(trail,/<summary/);
  assert.match(trail,/items\.slice\(0,-1\)/);
  assert.match(trail,/items\.slice\(1,-2\)/);
  assert.match(trail,/aria-label="面包屑导航"/);
  assert.match(trail,/aria-current="page"/);
  assert.match(trail,/trailOverflowActions/);
});
test("Round 2: interactive showroom exercises long Chinese titles and same-content layout",()=>{
  const demo=source("Demo.tsx");
  const css=source("demo.module.css");
  assert.match(demo,/setLongTitle/);
  assert.match(demo,/长中文溢出测试/);
  assert.match(demo,/densityExamples/);
  assert.match(css,/densityExamples/);
  assert.match(css,/min-height:85px/);
  assert.match(css,/min-height:58px/);
});


test("Session A integration frame owns route navigation and shared density, without B/C/D imports",()=>{
  const s=source("IntegrationFrame.tsx");
  const demo=source("capture-session-a.mjs");
  assert.match(s,/href,icon,subtitle/);
  assert.match(s,/aria-label="知序真实组件拼装验收"/);
  assert.match(s,/sessionStorage\.setItem\("zhixu_shell_collapsed"/);
  assert.match(s,/localStorage\.setItem\("zhixu_pixel_pop_density"/);
  assert.match(s,/data-integration-surface=\{surface\}/);
  assert.doesNotMatch(s,/from ["'][^"']*workstreams\/(dashboard|reader|learning)/);
  assert.match(demo,/navCurrent/);
  assert.match(demo,/densityLabel/);
  assert.match(demo,/persisted/);
  assert.match(demo,/session-a-mobile-drawer-closed/);
});
test("CI-only B/C/D composite is real Next.js and never committed across workstream owners",()=>{
  const generator=source("prepare-composition.mjs");
  const proof=source("capture-composition.mjs");
  assert.match(generator,/CourseProgressCard/);
  assert.match(generator,/LessonContent/);
  assert.match(generator,/StackPlayground/);
  assert.match(generator,/writeFileSync/);
  assert.match(proof,/aria-current/);
  assert.match(proof,/zhixu_pixel_pop_density/);
  assert.match(proof,/compose-mobile-drawer-open/);
  assert.match(proof,/compose-mobile-drawer-closed/);
});
