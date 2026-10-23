import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {PIXEL_POP_COMPONENT_REGISTRY,PIXEL_POP_COMPONENTS} from "../../src/design/pixel-pop/spec.mjs";

const root=resolve(fileURLToPath(new URL("../../src/design/pixel-pop/",import.meta.url)));
test("registry counts only unique exports, no missing PopShell",()=>{
  assert.equal(PIXEL_POP_COMPONENT_REGISTRY.reusable.length,8);
  assert.equal(new Set(PIXEL_POP_COMPONENT_REGISTRY.reusable.map(x=>x.name)).size,8);
  assert.ok(!PIXEL_POP_COMPONENTS.includes("PopShell"));
  assert.deepEqual(PIXEL_POP_COMPONENT_REGISTRY.aliases,["PixelCat"]);
});
test("every registered component actually exists as exported code",()=>{
  for(const c of PIXEL_POP_COMPONENT_REGISTRY.reusable){
    const src=readFileSync(resolve(root,c.file),"utf8");
    assert.ok(src.includes("export function "+c.name+"(") ||
      src.includes("export {"+c.name+",") ||
      src.includes(", "+c.name+"} from"),
      "Component not exported: "+c.name+" in "+c.file);
  }
});
test("local demo UI is not accidentally described as shared export",()=>{
  const demo=readFileSync(resolve(root,"pixel-pop-home.tsx"),"utf8");
  for(const name of PIXEL_POP_COMPONENT_REGISTRY.demoOnly){
    assert.match(demo,new RegExp("function "+name+"\\\\("));
    assert.doesNotMatch(demo,new RegExp("export function "+name+"\\\\("));
  }
});
