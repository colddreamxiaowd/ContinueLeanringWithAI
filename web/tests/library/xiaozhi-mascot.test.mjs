import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const base=resolve(import.meta.dirname,"../../src/design/pixel-pop");
const mascot=readFileSync(resolve(base,"mascot/Xiaozhi.tsx"),"utf8");
const css=readFileSync(resolve(base,"mascot/xiaozhi.module.css"),"utf8");
const primitives=readFileSync(resolve(base,"primitives.tsx"),"utf8");

test("Xiaozhi has single invariant character geometry and palette",()=>{
  assert.match(mascot,/referenceArt\?\(isPortrait\?/);
  for(const color of ["#12121D","#246BFF","#FF9FAE","#FFC935","#FFB2C0"])
    assert.ok(mascot.includes(color),color);
  assert.match(mascot,/role=\{decorative\?undefined:"img"\}/);
});
test("Xiaozhi exposes supported mood and pose vocabulary",()=>{
  for(const mood of ["idle","happy","thinking","curious","focused","encourage","celebrate","surprised"])
    assert.ok(mascot.includes('"'+mood+'"'));
  assert.match(mascot,/pose="full"/); // verify default pose
  assert.match(mascot,/export function PixelCat/);
});
test("Legacy PixelCat is the canonical Xiaozhi alias",()=>{
  assert.match(primitives,/export \{PixelCat, Xiaozhi\} from "\.\/mascot\/Xiaozhi"/);
  assert.doesNotMatch(primitives,/viewBox="0 0 64 64"/);
});
test("Xiaozhi has motion and reduced-motion acceptance",()=>{
  for(const x of ['prefers-reduced-motion:reduce','data-motion="bounce"','@keyframes xz-hop'])
    assert.ok(css.includes(x),x);
});

test("reference master is a valid, source-matched embedded image",()=>{
 const s=readFileSync(resolve(base,"../../../public/pixel-pop/xiaozhi-reference.svg"),"utf8");
 const payload=s.match(/base64,([^"]+)/)?.[1];
 assert.ok(payload,"master image must be embedded");
 const bytes=Buffer.from(payload,"base64");
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(bytes.readUInt32BE(16),125);
 assert.equal(bytes.readUInt32BE(20),164);
});
