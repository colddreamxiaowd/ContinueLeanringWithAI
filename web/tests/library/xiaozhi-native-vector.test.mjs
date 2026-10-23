import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"../../");
const svg=readFileSync(resolve(root,"public/pixel-pop/xiaozhi-traced-master.svg"),"utf8");
const component=readFileSync(resolve(root,"src/design/pixel-pop/mascot/Xiaozhi.tsx"),"utf8");

test("authentic vector master is made of editable color paths, not embedded PNG",()=>{
  assert.match(svg,/viewBox="0 0 573 573"/);
  assert.equal((svg.match(/<path /g)||[]).length,25);
  assert.doesNotMatch(svg,/<image\b|data:image|base64,/);
  for(const color of ["#08080C","#F8F8F9","#11329D","#FA9C9E"])
    assert.ok(svg.includes(color),"missing reference swatch: "+color);
});
test("true vector trace is default and legacy modes remain explicitly available",()=>{
  assert.match(component,/art="trace"/);
  assert.match(component,/traceArt=art==="trace"/);
  assert.match(component,/<XiaozhiLayers inspectPart=\{inspectPart\}\/>/);
  assert.match(component,/art==="reference"/);
});
