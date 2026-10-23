import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const repo=resolve(fileURLToPath(new URL("../../../",import.meta.url)));
function read(path){return readFileSync(resolve(repo,path),"utf8");}
test("SVG fidelity skill is discoverable from common workstream base",()=>{
 const x=read(".agents/skills/svg-fidelity-engineering/SKILL.md");
 assert.match(x,/^---\nname: svg-fidelity-engineering\n/);
 for(const term of ["OpenCV","CairoSVG","Inkscape","Chromium","<path>","<image>","24\/32","语义","像素"])
   assert.ok(x.includes(term),"missing skill method "+term);
});
test("each A-D iteration must include a live or reproducible preview and screenshots",()=>{
 const x=read("docs/PIXEL_POP_PREVIEW_ACCEPTANCE.md");
 for(const route of ["session-a","session-b","session-c","session-d"])
   assert.ok(x.includes("/ui-lab/"+route));
 for(const item of ["1440","768","390","Vercel","GitHub Actions","真正 Next.js","SVG Fidelity"])
   assert.ok(x.includes(item),"missing acceptance item: "+item);
});
