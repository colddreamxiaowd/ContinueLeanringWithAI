import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const base = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/design/pixel-pop/workstreams/dashboard");
const load = (name) => readFileSync(resolve(base,name),"utf8");

test("B workstream exposes exactly the three dashboard card building blocks", () => {
  const exports = load("index.ts");
  for (const name of ["CourseProgressCard","SourceFileCard","StudyTaskCard"]) {
    assert.match(exports,new RegExp("export \\{" + name + "\\}"));
    assert.match(load(name+".tsx"),new RegExp("export function " + name + "\\("));
  }
});

test("progress is controlled, clamps invalid percentages and keeps locked chapters inactive", () => {
  const src=load("CourseProgressCard.tsx");
  for(const token of ["ProgressRing","PopPanel","PopButton","onOpenChapter","onContinue","onCertificate",
    "Number.isFinite(progressPercent)","chapter.status === \"locked\"","aria-current"]) {
    assert.ok(src.includes(token),token);
  }
});

test("file result and sync state stay separate with progress, retry and empty UI", () => {
  const src=load("SourceFileCard.tsx");
  for(const token of ["syncPercent","syncState","outcome","onRetrySync","onOpenFile","aria-valuenow",
    "暂无资料","同步失败","同步中"]) assert.ok(src.includes(token),token);
});

test("task card distinguishes types from statuses and delegates actions", () => {
  const src=load("StudyTaskCard.tsx");
  for(const token of ["StudyTaskKind","StudyTaskStatus","onOpenTask","not-started","in-progress","completed",
    "视频学习","动手练习","章节测验","今天还没有学习任务"]) assert.ok(src.includes(token),token);
});

test("isolated demo offers responsive cases and all density modes without false real data claims", () => {
  const demo=load("Demo.tsx"), css=load("dashboard.module.css");
  for(const token of ["minimal","balanced","normal","CourseProgressCard","SourceFileCard","StudyTaskCard","模拟同步","非真实飞书同步"]) {
    assert.ok(demo.includes(token),token);
  }
  for(const token of ['max-width: 560px','data-density="minimal"','data-density="normal"','prefers-reduced-motion']) {
    assert.ok(css.includes(token),token);
  }
  assert.ok(!demo.includes("localStorage"));
});
