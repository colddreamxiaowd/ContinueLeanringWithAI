#!/usr/bin/env node
/** Build TWO source-colour tail animation frames, leaving the hinge fixed.
 * Reads the approved semantic source; never modifies it. No SVG PNG embedding.
 * A displacement of at most 10 source pixels occurs ONLY beyond source x=430.
 * Identical pixel count and per-colour histogram across frames are verified.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";

const web=resolve(import.meta.dirname,"../../../../..");
const rig=readFileSync(resolve(web,"src/design/pixel-pop/mascot/XiaozhiLayers.tsx"),"utf8");
const group=rig.match(/<g id="xz-tail" data-xz-part="tail"[^>]*>([\s\S]*?)<\/g>/)?.[1];
if(!group)throw Error("Canonical tail semantic source not found");
const source=new Map();
for(const p of group.matchAll(/<path fill="(#[0-9A-F]{6})" d="([^"]+)"/g)){
 for(const r of p[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
  const [,xx,yy,ww,hh,nw]=r;const x=+xx,y=+yy,w=+ww,h=+hh;
  if(w!==+nw)throw Error("Corrupt RLE rectangle");
  for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){
   const k=py*573+px;if(source.has(k))throw Error("Overlapping source "+px+","+py);
   source.set(k,p[1]);
  }
 }
}
if(!source.size)throw Error("Empty tail source");
const histogram=m=>[...m.values()].reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{});
const originalHist=JSON.stringify(Object.entries(histogram(source)).sort());
function frame(direction){
 const pixels=new Map();
 for(const [k,c] of source){
  const x=k%573,y=Math.floor(k/573);
  const moved=Math.round(Math.max(0,Math.min(1,(x-430)/75))*10);
  const newY=y+direction*moved,newK=newY*573+x;
  if(newY<0||newY>=573||pixels.has(newK))throw Error("Invalid warped tail pixel");
  pixels.set(newK,c);
 }
 if(pixels.size!==source.size||JSON.stringify(Object.entries(histogram(pixels)).sort())!==originalHist)
   throw Error("Warp lost or recoloured canonical pixels");
 return pixels;
}
function toSvgPaths(pixels){
 const byColor=new Map();for(const c of pixels.values())if(!byColor.has(c))byColor.set(c,new Map());
 for(const [k,c] of pixels){
  const x=k%573,y=Math.floor(k/573),row=byColor.get(c);
  if(!row.has(y))row.set(y,[]);row.get(y).push(x);
 }
 const result=[];
 for(const [c,rows] of byColor){
  const pieces=[],active=new Map();
  for(let y=0;y<573;y++){
   const xs=(rows.get(y)||[]).sort((a,b)=>a-b);
   const next=new Map();
   for(let i=0;i<xs.length;){
    const x=xs[i];let w=1;while(i+w<xs.length&&xs[i+w]===x+w)w++;
    const k=x+":"+w,rect=active.get(k);
    if(rect&&rect.y+rect.h===y){rect.h++;next.set(k,rect);}
    else{const fresh={x,y,w,h:1};pieces.push(fresh);next.set(k,fresh);}
    i+=w;
   }
   active.clear();for(const [k,v] of next)active.set(k,v);
  }
  result.push({colour:c,paths:pieces.map(r=>`M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}Z`).join(" ")});
 }
 return result;
}
const poses=[["up",frame(-1)],["down",frame(1)]];
let code="/** AUTO-GENERATED source-pixel-preserving tail frames. DO NOT hand-edit.\n"+
 " * Input: approved XiaozhiLayers tail group; hinge fixed x<=430, max 10px displacement.\n"+
 " * sha256 of canonical rig: "+createHash("sha256").update(rig).digest("hex")+"\n"+
 " * source tail pixels: "+source.size+" ; each frame contains the same colour histogram.\n"+
 " */\nexport type XiaozhiTailPose = \"up\"|\"down\";\n"+
 "export function XiaozhiTailFrame({pose}:{pose:XiaozhiTailPose}){\n"+
 " return pose===\"up\" ? <g data-generated-tail-pose=\"up\" stroke=\"none\" shapeRendering=\"crispEdges\">\n";
for(const p of toSvgPaths(poses[0][1]))code+=`  <path fill="${p.colour}" d="${p.paths}"/>\n`;
code+=" </g> : <g data-generated-tail-pose=\"down\" stroke=\"none\" shapeRendering=\"crispEdges\">\n";
for(const p of toSvgPaths(poses[1][1]))code+=`  <path fill="${p.colour}" d="${p.paths}"/>\n`;
code+=" </g>;\n}\n";
const target=resolve(import.meta.dirname,"XiaozhiTailFrames.tsx");
if(process.argv[2]==="--write"){writeFileSync(target,code);console.log("Wrote source-exact 2-frame tail rig",source.size);}
else if(process.argv[2]==="--check"){
 const existing=readFileSync(target,"utf8");if(existing!==code)throw Error("Generated tail frames are stale");
 console.log("Reproducible tail poses",source.size,poses.length);
}else throw Error("Usage: --write or --check");
