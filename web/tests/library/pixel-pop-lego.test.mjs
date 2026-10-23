import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"../../src/design/pixel-pop/blocks");
test("LEGO 01 exposes three independent, reusable visual blocks",()=>{
 const src=readFileSync(resolve(root,"lego.tsx"),"utf8");
 for (const name of ["BrandHeader","StackMonument","CourseHero"])
   assert.match(src,new RegExp("export function "+name+"\\("));
 assert.match(src,/import \{Xiaozhi\}/);
 assert.match(src,/course=/);
});
test("LEGO 01 styles remain isolated for reusable composition",()=>{
 const css=readFileSync(resolve(root,"lego.module.css"),"utf8");
 for(const token of [".header",".hero",".art",".stackSvg","@media(max-width:760px)"])
   assert.ok(css.includes(token),"Missing "+token);
});
