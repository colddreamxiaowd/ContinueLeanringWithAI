import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {
  PIXEL_POP_COMPONENTS,PIXEL_POP_MODES,PIXEL_POP_TOKENS,
  PIXEL_POP_VERSION,PIXEL_POP_WEIGHTS,normalizePixelPopMode
} from "../../src/design/pixel-pop/spec.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../src/design/pixel-pop");
test("one canonical Pixel Pop identity and intended weights",()=>{
  assert.equal(PIXEL_POP_VERSION,"1.0.0");
  assert.deepEqual(PIXEL_POP_WEIGHTS,{neobrutalism:65,pixelAcademy:25,whitespace:10});
  assert.equal(PIXEL_POP_TOKENS.ink,"#12121D");
  assert.equal(PIXEL_POP_TOKENS.yellow,"#FFE342");
  assert.ok(PIXEL_POP_COMPONENTS.includes("PixelCat"));
});
test("three density modes share one normalized default",()=>{
  assert.deepEqual(PIXEL_POP_MODES,["minimal","balanced","normal"]);
  assert.equal(normalizePixelPopMode("normal"),"normal");
  assert.equal(normalizePixelPopMode("unknown"),"balanced");
});
test("stylesheet scopes its design and covers responsive layouts",()=>{
  const css=readFileSync(resolve(root,"pixel-pop.css"),"utf8");
  for(const token of ["--pp-ink","--pp-purple","--pp-yellow","--pp-shadow",
    "[data-density=\"minimal\"]","[data-density=\"normal\"]",
    "@media (max-width:760px)","prefers-reduced-motion"]){
    assert.ok(css.includes(token),"Missing style contract: "+token);
  }
});
test("learning demo includes operating state and feedback",()=>{
  const src=readFileSync(resolve(root,"pixel-pop-home.tsx"),"utf8");
  for(const feature of ["StackPlayground","QuizCard","ReaderContent","LabContent",
    "QuizContent","localStorage.setItem","setStack"]){
    assert.ok(src.includes(feature),"Missing: "+feature);
  }
});
