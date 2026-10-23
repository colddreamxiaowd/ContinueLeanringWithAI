import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../src/design/pixel-pop/workstreams/reader");
const text=(path)=>readFileSync(resolve(root,path),"utf8");
test("real Next.js route mounts Session C in content-focused mode",()=>{
 const route=text("../../../../app/ui-lab/session-c/page.tsx");
 assert.match(route,/ReaderDemo fullPage/);
 const demo=text("Demo.tsx");
 assert.match(demo,/data-session-c-live/);
 assert.match(demo,/onNavigate=\{navigateTo\}/);
});
test("long synthetic lesson has native teaching diagram, code and reflection sections",()=>{
 const demo=text("Demo.tsx");
 assert.match(demo,/StudyDiagram kind="stack"/);
 assert.match(demo,/Pop（出栈）操作/);
 assert.match(demo,/本节知识点总结/);
 assert.match(demo,/括号匹配/);
 assert.match(demo,/链表的每个节点/);
});
test("SVG artwork is native vector without raster wrapping or remote dependencies",()=>{
 const artwork=text("StudyDiagram.tsx");
 assert.match(artwork,/<path/);assert.match(artwork,/<rect/);
 assert.doesNotMatch(artwork,/<image\b|<foreignObject\b|<script\b|data:image/);
});
test("code highlighting is read-only React text tokens, never dynamic HTML",()=>{
 const component=text("reader.tsx");
 assert.match(component,/function HighlightedCode/);
 assert.match(component,/<HighlightedCode code=\{block.code\}/);
 assert.doesNotMatch(component,/dangerouslySetInnerHTML/);
});
test("actual browser capture script checks copy, citations, density, and outline",()=>{
 const browser=text("capture-next.mjs");
 for(const token of ["Page.captureScreenshot","clipboard.readText","data-citation-id","data-density","cross-chapter section focus"]){
   assert(browser.includes(token),token);
 }
});
