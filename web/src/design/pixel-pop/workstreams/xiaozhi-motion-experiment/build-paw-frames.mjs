#!/usr/bin/env node
/** Isolated source-pixel paw ARTICULATION PROTOTYPE.
 * The approved mother SVG is unchanged. This script extracts a left-front-paw
 * region from its EXACT flattened pixel paint order, emits an alpha removal
 * mask and two affine-grid bijections (integer pixel positions).
 * Geometry is deliberately experimental pending designer review.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"../../../../..");
const rig=readFileSync(resolve(root,"src/design/pixel-pop/mascot/XiaozhiLayers.tsx"),"utf8");
const whole=new Map();
for(const g of rig.matchAll(/<g id="xz-([^"]+)" data-xz-part="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g))
 for(const p of g[3].matchAll(/<path fill="(#[0-9A-F]{6})" d="([^"]+)"/g))
  for(const m of p[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
   const [x,y,w,h]=m.slice(1,5).map(Number);
   for(let j=0;j<h;j++)for(let i=0;i<w;i++)whole.set((y+j)*573+x+i,p[1]);
  }
/** Region study. The inner boundary blends into the white torso; its outline
 * must be reviewed at original resolution before production articulation. */
const isPaw=(x,y)=>x>=112 && ((y>=397&&y<435&&x<=167)||(y>=435&&y<492&&x<=201));
const selected=new Map([...whole].filter(([k])=>isPaw(k%573,Math.floor(k/573))));
if(selected.size!==4525)throw Error("Approved source region changed; inspect anatomy before regenerating: "+selected.size);
const distribution=m=>JSON.stringify(Object.entries([...m.values()].reduce((o,c)=>(o[c]=(o[c]||0)+1,o),{})).sort());
const hash=distribution(selected);
function warp(slope){
 const dest=new Map();
 for(const [k,color] of selected){
  const x=k%573,y=Math.floor(k/573),dy=y-404;
  const xx=175-dy,yy=404+(x-175)-Math.round(slope*dy);
  if(xx<0||yy<0||xx>=573||yy>=573)throw Error("Paw out of viewbox");
  const key=yy*573+xx;if(dest.has(key))throw Error("Paw pixel collision");
  dest.set(key,color);
 }
 if(dest.size!==selected.size||distribution(dest)!==hash)throw Error("Paw is not source-colour/pixel preserving");
 return dest;
}
/** Native SVG RLE: same-colour horizontal spans vertically merged. */
function paths(map){
 const by=new Map();
 for(const [k,c] of map){const x=k%573,y=Math.floor(k/573);
  if(!by.has(c))by.set(c,new Map());
  const rows=by.get(c);if(!rows.has(y))rows.set(y,[]);
  rows.get(y).push(x);
 }
 const out=[];
 for(const [colour,rows] of by){
  const rect=[],active=new Map();
  for(let y=0;y<573;y++){
   const xs=(rows.get(y)||[]).sort((a,b)=>a-b),next=new Map();
   for(let i=0;i<xs.length;){
    const x=xs[i];let w=1;while(i+w<xs.length&&xs[i+w]===x+w)w++;
    const key=x+":"+w,old=active.get(key);
    if(old&&old.y+old.h===y){old.h++;next.set(key,old)}
    else{const fresh={x,y,w,h:1};rect.push(fresh);next.set(key,fresh)}
    i+=w;
   }
   active.clear();for(const [k,v] of next)active.set(k,v);
  }
  out.push({colour,d:rect.map(r=>`M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}Z`).join(" ")});
 }
 return out;
}
let result='/** AUTO-GENERATED from canonical XiaozhiLayers; experimental left paw.\n'+
 ' * Original source pixels: 4525. Two integer-grid transforms preserve each\n'+
 ' * source pixel and per-colour histogram. Static source is not modified.\n'+
 ' */\nexport type XiaozhiPawPose="up"|"wave";\n';
const removalD=paths(new Map([...selected].map(([k])=>[k,"#000000"])))[0].d;
result+='export const XIAOZHI_PAW_CUTOUT_D='+JSON.stringify(removalD)+';\n';
result+='export function XiaozhiPawRemoval(){return <g data-xz-paw-removal="source-region" fill="black" stroke="none" shapeRendering="crispEdges">\n';
result+='<path d={XIAOZHI_PAW_CUTOUT_D}/>\n';
result+='</g>}\n';
result+='export function XiaozhiPawRest(){return <g data-xz-paw-frame="rest" stroke="none" shapeRendering="crispEdges">\n';
for(const p of paths(selected))result+=`<path fill="${p.colour}" d="${p.d}"/>\n`;
result+='</g>}\n';
result+='export function XiaozhiPawBodyBacking(){return <g data-xz-paw-backing="source-fur-outline" stroke="none" shapeRendering="crispEdges">\n';
for(const p of paths(new Map([...selected].filter(([k,c])=>c==="#08080C"||c==="#F8F8F9"))))
 result+=`<path fill="${p.colour}" d="${p.d}"/>\n`;
result+='</g>}\n';
result+='export function XiaozhiPawFrame({pose}:{pose:XiaozhiPawPose}){return pose==="up" ? <g data-xz-paw-frame="up" stroke="none" shapeRendering="crispEdges">\n';
for(const p of paths(warp(.35)))result+=`<path fill="${p.colour}" d="${p.d}"/>\n`;
result+='</g> : <g data-xz-paw-frame="wave" stroke="none" shapeRendering="crispEdges">\n';
for(const p of paths(warp(.55)))result+=`<path fill="${p.colour}" d="${p.d}"/>\n`;
result+='</g>}\n';
const target=resolve(import.meta.dirname,"XiaozhiPawFrames.tsx");
if(process.argv[2]==="--write"){writeFileSync(target,result);console.log("Wrote paw frames",selected.size)}
else if(process.argv[2]==="--check"){if(readFileSync(target,"utf8")!==result)throw Error("Paw frames drifted from canonical source");console.log("Verified native paw frames")}
else throw Error("Usage: --write or --check");
