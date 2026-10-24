import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
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
 assert.match(css,/@keyframes eyeClose/);
 assert.ok(css.includes("transform:scaleY(.13)"));
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
