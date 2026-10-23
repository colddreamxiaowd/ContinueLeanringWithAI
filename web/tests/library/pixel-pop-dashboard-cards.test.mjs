import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve, dirname} from "node:path";
import {courseProgressSummary, sourceStatusPresentation, taskStatusPresentation}
  from "../../src/design/pixel-pop/workstreams/dashboard/card-state.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/design/pixel-pop/workstreams/dashboard");
const load = name => readFileSync(resolve(root,name),"utf8");
const chapter = status => ({id: status,title: status,status});

test("three controlled dashboard card exports preserve their original public names",()=>{
  const source=load("index.ts");
  for(const name of ["CourseProgressCard","SourceFileCard","StudyTaskCard"]) {
    assert.ok(source.includes("export {"+name+"}"));
    assert.ok(load(name+".tsx").includes("export function "+name+"("));
  }
});

test("learning-activity percent never silently becomes the fraction of completed chapters",()=>{
  const data=[chapter("completed"),chapter("completed"),chapter("completed"),chapter("current"),chapter("available")];
  const result=courseProgressSummary(68,data);
  assert.equal(result.completed,3);
  assert.equal(result.total,5);
  assert.equal(result.percent,68);
  assert.equal(result.fullyComplete,false);
  assert.equal(result.hasCurrent,true);
});

test("out-of-range percent, no chapters and nonfinite input are handled deterministically",()=>{
  assert.equal(courseProgressSummary(-19,[]).percent,0);
  assert.equal(courseProgressSummary(999,[]).percent,100);
  assert.equal(courseProgressSummary(Number.NaN,[]).percent,0);
  assert.equal(courseProgressSummary(Infinity,[]).percent,0);
  assert.equal(courseProgressSummary(68,[]).allChaptersCompleted,false);
});

test("certificate-ready state requires both complete chapters and 100% activity",()=>{
  const all=[chapter("completed"),chapter("completed")];
  assert.deepEqual([courseProgressSummary(65,all).allChaptersCompleted,
    courseProgressSummary(65,all).fullyComplete],[true,false]);
  assert.equal(courseProgressSummary(100,all).fullyComplete,true);
  assert.equal(courseProgressSummary(100,[chapter("completed"),chapter("current")]).fullyComplete,false);
});

test("sync status remains distinct from generated-content outcome",()=>{
  for(const [syncState,kind,label] of [
    ["synced","synced","已同步"],["syncing","syncing","同步中 · 60%"],
    ["error","error","同步失败"],["not-synced","pending","未同步"]]) {
    const v=sourceStatusPresentation({syncState,outcome:"course",syncPercent:60});
    assert.equal(v.kind,kind);
    assert.equal(v.label,label);
  }
  assert.equal(sourceStatusPresentation({syncState:"syncing",syncPercent:130}).label,"同步中 · 100%");
  assert.equal(sourceStatusPresentation({syncState:"syncing",syncPercent:-4}).label,"同步中 · 0%");
  assert.equal(sourceStatusPresentation({syncState:"syncing",syncPercent:Number.NaN}).label,"同步中");
});

test("all task types and all states are independently represented (nine combinations)",()=>{
  const states=["not-started","in-progress","completed"];
  for(const kind of ["video","practice","quiz"]) {
    for(const status of states) {
      const view=taskStatusPresentation({kind,status});
      assert.ok(view.type.length>0);
      assert.ok(view.status.length>0);
    }
  }
  assert.deepEqual(taskStatusPresentation({kind:"quiz",status:"completed"}),
    {type:"章节测验",status:"已完成"});
});

test("real click handlers use controlled caller callbacks and locked chapters are inert",()=>{
  const progress=load("CourseProgressCard.tsx"), sources=load("SourceFileCard.tsx"), tasks=load("StudyTaskCard.tsx");
  assert.ok(progress.includes('chapter.status === "locked"'));
  assert.ok(progress.includes("onOpenChapter?.(chapter.id)"));
  assert.ok(progress.includes('aria-current={chapter.status === "current"'));
  assert.ok(progress.includes('summary.fullyComplete && onCertificate'));
  assert.ok(sources.includes("onOpenFile(file.id)"));
  assert.ok(sources.includes("onRetrySync(file.id)"));
  assert.ok(sources.includes("file.href ? <Link"));
  assert.ok(tasks.includes("onOpenTask(task.id)"));
  assert.ok(![progress,sources,tasks].some(src=>src.includes("localStorage")||src.includes("fetch(")));
});

test("reference visual states, keyboard focus, overflow and density are implemented in owned CSS",()=>{
  const css=load("dashboard.module.css");
  for(const token of ["progressExplanation","markerDone","markerCurrent","syncTag_syncing",
    "syncTag_error","syncedIcon","taskBarsActive","text-overflow:ellipsis",
    "container-type:inline-size","@container (max-width: 370px)","focus-visible",
    'pp-root[data-density="minimal"]','pp-root[data-density="normal"]',
    "prefers-reduced-motion"]) assert.ok(css.includes(token),token);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css),"Dashboard CSS should use shared token colors");
});

test("Demo clearly labels synthetic actions and reconciles its 3/5 chapter count",()=>{
  const demo=load("Demo.tsx");
  for(const token of ["Demo","模拟同步","非真实飞书同步","标记进行中任务完成",
    "status: \"completed\"","status: \"current\"","LongUnbrokenIdentifier",
    '"minimal","balanced","normal"']) assert.ok(demo.includes(token),token);
});


test("SVG fidelity: three cards reuse native Lucide vectors without image or raster wrappers",()=>{
  const progress=load("CourseProgressCard.tsx");
  const sources=load("SourceFileCard.tsx");
  const tasks=load("StudyTaskCard.tsx");
  const css=load("dashboard.module.css");
  for(const src of [progress,sources,tasks]) {
    assert.ok(src.includes('from "lucide-react"'));
    assert.doesNotMatch(src,/<image\\b|data:image\\/|<img\\b/);
  }
  assert.ok(progress.includes('<Trophy size={17}'));
  assert.ok(sources.includes('<FileText size={23}'));
  assert.ok(sources.includes('<FileCode2 size={23}'));
  assert.ok(sources.includes('<Link2 size={23}'));
  assert.ok(css.includes(".fileIcon :global(svg)"));
  assert.ok(css.includes("stroke-linejoin:round"));
  assert.ok(css.includes("filter:none"));
  assert.ok(css.includes("prefers-reduced-motion"));
});

test("PR32 visual-feedback regression: legible card density without changing content",()=>{
  const css=load("dashboard.module.css");
  for(const token of [
    ".kind_pptx", ".kind_pdf", ".kind_feishu", ".finishMessage svg",
    ".taskState_in-progress", ".markerCurrent", "text-overflow:ellipsis",
    "@container (max-width: 370px)", "width:120px;height:120px",
    'pp-root[data-density="minimal"]','pp-root[data-density="normal"]'
  ]) assert.ok(css.includes(token),token);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\\b/i, "do not fork the shared color palette");
});
