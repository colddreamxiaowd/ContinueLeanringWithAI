import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {execFileSync} from "node:child_process";

const web = resolve(import.meta.dirname, "../../");
const golden = readFileSync(resolve(web, "public/pixel-pop/xiaozhi-traced-master.svg"),"utf8");
const layered = readFileSync(resolve(web,"src/design/pixel-pop/mascot/XiaozhiLayers.tsx"),"utf8");
const component = readFileSync(resolve(web,"src/design/pixel-pop/mascot/Xiaozhi.tsx"),"utf8");
const style = readFileSync(resolve(web,"src/design/pixel-pop/mascot/xiaozhi.module.css"),"utf8");

function rasterizePaths(svg){
  const width=573,height=573,pixels=new Uint32Array(width*height);
  let total=0,nPaths=0;
  for(const m of svg.matchAll(/<path(?: id="[^"]+")? fill="(#[0-9A-F]{6})" d="([^"]+)"\/>/g)){
    const color=0x1000000+parseInt(m[1].slice(1),16);
    nPaths++;
    for(const rect of m[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
      const [_,xx,yy,ww,hh,nw]=rect;
      const x=Number(xx),y=Number(yy),w=Number(ww),h=Number(hh);
      assert.equal(Number(nw),w);
      assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
      for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
        const pos=(y+dy)*width+(x+dx);
        assert.equal(pixels[pos],0,"overlapping anatomy layers at "+(x+dx)+","+(y+dy));
        pixels[pos]=color;total++;
      }
    }
  }
  return {pixels,total,nPaths};
}
test("12 semantic groups composite exactly to original 179751 foreground pixels",()=>{
  for(const name of ["hat","tassel","ear-left","ear-right","eye-left","eye-right","mouth","blush-left","blush-right","tail","torso","face"]){
    assert.match(layered,new RegExp('data-xz-part="'+name+'"'));
  }
  const base=rasterizePaths(golden);
  const rig=rasterizePaths(layered);
  assert.equal(base.total,179751);
  assert.equal(rig.total,base.total);
  assert.deepEqual(Buffer.from(rig.pixels.buffer),Buffer.from(base.pixels.buffer));
  assert.equal(base.nPaths,25);
  assert.ok(rig.nPaths>25,"true semantic grouping should split colors by anatomy");
});
test("full mascot is inline path art with no extra halo or blur",()=>{
  assert.match(component,/<XiaozhiLayers inspectPart=\{inspectPart\}\/>/);
  assert.doesNotMatch(layered,/<image\b|data:image\/png|stroke="#fff"/i);
  assert.match(style,/\.art\{[^}]*filter:none/);
  assert.match(style,/\.optical\{[^}]*image-rendering:pixelated/);
});
test("24px and 32px optical avatars are real paths, not embedded raster",()=>{
 for(const n of [24,32]){
  const svg=readFileSync(resolve(web,"public/pixel-pop/xiaozhi-avatar-"+n+".svg"),"utf8");
  assert.match(svg,new RegExp('viewBox="0 0 '+n+' '+n+'"'));
  assert.ok((svg.match(/<path /g)||[]).length>=12);
  assert.doesNotMatch(svg,/<image\b|data:image|stroke=/);
 }
 assert.match(component,/const opticalAvatar=traceArt&&isPortrait&&bounded<=32/);
});

test("the 12 semantic layers can be regenerated from the frozen mother asset",()=>{
  assert.doesNotThrow(()=>execFileSync(process.execPath,[
    resolve(web,"scripts/build-xiaozhi-layers.mjs"),"--check"
  ],{stdio:"pipe"}));
});
