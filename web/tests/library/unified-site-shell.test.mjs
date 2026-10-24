import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {readDemoIndex,readDemoDocument} from "../../src/lib/v45-demo-data.mjs";

const read=path=>readFileSync(resolve("src",path),"utf8");
test("homepage and legacy production routes share exactly one Pixel Pop shell",()=>{
 const home=read("design/pixel-pop/pixel-pop-home.tsx");
 const legacy=read("components/app-shell.tsx");
 const shell=read("design/pixel-pop/PixelPopSiteShell.tsx");
 assert.match(home,/<PixelPopSiteShell/);
 assert.match(legacy,/<PixelPopSiteShell/);
 assert.equal((shell.match(/<PixelCat\b/g)||[]).length,2,"mascot must reuse exactly one canonical component");
 for(const path of ["/sources","/courses","/library","/coursepacks","/learn"]){
  assert.ok(shell.includes(path),"missing real navigation route "+path);
 }
 assert.ok(shell.includes("zhixu_pixel_pop_density"),"density shared with home");
 assert.ok(shell.includes("learninghub.theme"),"theme shared across navigation");
});
test("readable content surface is explicit for light and dark themes",()=>{
 const css=read("design/pixel-pop/site-shell.css");
 assert.match(css,/\.pp-site-shell \.pp-site-legacy/);
 assert.match(css,/background:#FFF/);
 assert.match(css,/\.pp-site-shell\[data-pp-theme="dark"\]/);
 assert.match(css,/\.pp-site-shell \.pp-site-legacy \.page-heading/);
});
test("all public synthetic demo documents are bundled, not read via runtime fs",()=>{
 const src=read("lib/v45-demo-data.mjs");
 assert.doesNotMatch(src,/node:fs|process\.cwd|readFileSync/);
 const data=readDemoIndex();
 assert.equal(data.schema_version,"v45-demo-v1");
 assert.equal(data.documents.length,2);
 for(const entry of data.documents){
  const document=readDemoDocument(entry.document_id);
  assert.ok(document);
  assert.equal(document.slide_count,entry.slide_count);
  assert.equal(document.synthetic,true);
 }
});
