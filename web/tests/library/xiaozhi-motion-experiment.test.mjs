import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {execFileSync} from "node:child_process";
const web=resolve(import.meta.dirname,"../../");
const moduleSource=readFileSync(resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/XiaozhiMotionPrototype.tsx"),"utf8");
const css=readFileSync(resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/motion.module.css"),"utf8");
const canonical=readFileSync(resolve(web,"src/design/pixel-pop/mascot/XiaozhiLayers.tsx"),"utf8");
const page=readFileSync(resolve(web,"src/app/ui-lab/xiaozhi-motion/page.tsx"),"utf8");
const parent=readFileSync(resolve(web,"src/design/pixel-pop/mascot/Xiaozhi.tsx"),"utf8");

test("independent motion lab uses exactly the frozen native 12-part rig",()=>{
 assert.match(moduleSource,/import \{XiaozhiLayers\} from/);
 assert.match(moduleSource,/<XiaozhiLayers\/>/);
 assert.match(page,/XiaozhiMotionLab/);
 assert.match(canonical,/data-xz-rig="source-exact"/);
 assert.doesNotMatch(moduleSource,/<image\b|data:image\/png|<foreignObject/i);
 assert.doesNotMatch(css,/filter:drop-shadow|stroke:\s*white/);
});
test("blink preserves canonical eye geometry and only moves their own semantic groups",()=>{
 const names=["eye-left","eye-right"];
 for(const name of names){
  const g=canonical.split('data-xz-part="'+name+'"')[1]?.split('</g>')[0];
  assert.ok(g,"canonical part "+name);
  assert.match(g,/fill="#08080C"/);
  assert.match(css,new RegExp('data-xz-part\\^="eye-"'));
 }
 assert.match(moduleSource,/EYE_FUR_BACKING=/);
 assert.match(moduleSource,/M188 246h45v64h-45Z M338 244h45v66h-45Z/);
 assert.match(moduleSource,/data-motion-eye-backing="true"/);
 assert.doesNotMatch(moduleSource,/blinkOverlay|ORIGINAL_EYE_PIXEL_MASKS/);
 assert.match(css,/@keyframes eyeDisappear/);
 assert.match(css,/@keyframes eyeLidsAppear/);
 assert.match(moduleSource,/data-motion-eyelids="two-pixel-paths"/);
 assert.match(moduleSource,/M194 278h32v6h-32Z/);
});
test("four core moves and greeting are one-shot and reduced motion safe",()=>{
 for(const action of ["blink","nod","hop","tail","hello"]){
   assert.ok(moduleSource.includes('"'+action+'"'));
   assert.ok(css.includes('data-action="'+action+'"'),action);
 }
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/animation:[^;\n]*infinite/);
 assert.match(moduleSource,/onClick=\{\(\)=>select\(id\)\}/);
 assert.match(moduleSource,/setReplay\(n=>n\+1\)/);
});
test("approved optical avatars and original full master remain imported, never overwritten",()=>{
 assert.match(moduleSource,/<Xiaozhi size=\{24\} pose="avatar"\/>/);
 assert.match(moduleSource,/<Xiaozhi size=\{32\} pose="avatar"\/>/);
 assert.match(parent,/XiaozhiLayers inspectPart=\{inspectPart\}/);
 assert.match(css,/\[data-background="dark"\]/);
 assert.match(css,/\[data-background="violet"\]/);
 assert.match(css,/\[data-background="yellow"\]/);
});

test("closed eyes patch 403 source-grey pixels plus only their original fur halo",()=>{
 const mask=moduleSource.match(/const FACE_EYE_SHADE_FIX=\s*"([^"]+)";/);
 assert.ok(mask,"expanded anti-alias guard from approved face pixels");
 const faceColors=new Map();
 for(const p of canonical.matchAll(/<path fill="(#[0-9A-F]{6})" d="([^"]+)"/g)){
  for(const r of p[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
   const [x,y,w,h]=r.slice(1,5).map(Number);
   for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)faceColors.set(j*573+i,p[1]);
  }
 }
 const accepted=new Set(["#F8F8F9","#5A5A62","#A0A1A9","#BDC5DC"]);
 const masked=new Set();
 for(const r of mask[1].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
  const [x,y,w,h]=r.slice(1,5).map(Number);
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){
   const k=j*573+i,color=faceColors.get(k);
   assert.ok(accepted.has(color),"No cheek/hat/eye paint may be erased at "+i+","+j+": "+color);
   assert.ok(!masked.has(k));masked.add(k);
  }
 }
 assert.equal(masked.size,1409);
 assert.match(moduleSource,/data-motion-eye-shade-fix="source-grey-fur-guard"/);
 assert.match(moduleSource,/shapeRendering="crispEdges"/);
});
test("tail's two native path frames are fully regenerable and preserve source colours",()=>{
 const generator=resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/build-tail-frames.mjs");
 assert.doesNotThrow(()=>execFileSync(process.execPath,[generator,"--check"],{stdio:"pipe"}));
 const tailFrames=readFileSync(resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/XiaozhiTailFrames.tsx"),"utf8");
 assert.match(tailFrames,/data-generated-tail-pose="up"/);
 assert.match(tailFrames,/data-generated-tail-pose="down"/);
 assert.match(tailFrames,/hinge fixed x<=430/);
 assert.doesNotMatch(tailFrames,/<image\b|data:image/);
 assert.match(moduleSource,/<XiaozhiTailFrame pose="up"\/>/);
 assert.match(moduleSource,/<XiaozhiTailFrame pose="down"\/>/);
 assert.match(css,/@keyframes sourceTailSwap/);
 assert.match(css,/@keyframes tailUpSwap/);
 assert.match(css,/@keyframes tailDownSwap/);
 assert.doesNotMatch(css,/tailWag|rotate\(10deg\)/);
});

test("independent front paw uses a canonical 4525-pixel exact reassembly, not torso rotation",()=>{
 const builder=resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/build-paw-frames.mjs");
 const frame=readFileSync(resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/XiaozhiPawFrames.tsx"),"utf8");
 assert.doesNotThrow(()=>execFileSync(process.execPath,[builder,"--check"],{stdio:"pipe"}));
 assert.match(frame,/Original source pixels: 4525/);
 for(const pose of ["rest","up","wave"])assert.ok(frame.includes('data-xz-paw-frame="'+pose+'"'));
 assert.match(frame,/data-xz-paw-removal="source-region"/);
 assert.match(moduleSource,/XiaozhiPawRemoval/);
 assert.match(moduleSource,/maskUnits="userSpaceOnUse"/);
 assert.match(moduleSource,/data-rig-paw-mask=\{pawMotion\?"source-cutout":undefined\}/);
 assert.match(css,/@keyframes pawRestHide/);
 assert.match(css,/@keyframes pawLiftShow/);
 assert.match(css,/@keyframes pawWaveUp/);
 assert.match(css,/@keyframes pawWaveOut/);
 assert.doesNotMatch(css,/pawWag.*rotate|pawLift.*rotate/);
 for(const action of ["paw","wave"])assert.ok(moduleSource.includes('"'+action+'"'));
});

test("hand-shaped raised pose is a distinct, source-palette-only experimental layer",()=>{
 const gesture=readFileSync(resolve(web,"src/design/pixel-pop/workstreams/xiaozhi-motion-experiment/XiaozhiPawGesture.tsx"),"utf8");
 assert.match(gesture,/data-experimental-paw-gesture=\{pose\}/);
 assert.match(moduleSource,/XiaozhiPawGesture pose="up"/);
 assert.match(moduleSource,/XiaozhiPawGesture pose="wave"/);
 assert.doesNotMatch(gesture,/<image\b|foreignObject|data:image/);
 assert.doesNotMatch(gesture,/animation|style=.*rotate/);
 const sourcePalette=new Set([...canonical.matchAll(/fill="(#[0-9A-F]{6})"/g)].map(m=>m[1]));
 for(const match of gesture.matchAll(/fill="(#[0-9A-F]{6})"/g))
   assert.ok(sourcePalette.has(match[1]),"not an approved source palette colour "+match[1]);
 assert.match(gesture,/data-paw-connector="resting-shoulder"/);
});
