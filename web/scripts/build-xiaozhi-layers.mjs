#!/usr/bin/env node
// Regenerate exact 12-layer editable artwork from the frozen 573x573 vector master.
// Run: node scripts/build-xiaozhi-layers.mjs --check | --write (from web/).
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const web=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const master=readFileSync(resolve(web,"public/pixel-pop/xiaozhi-traced-master.svg"),"utf8");
const W=573,H=573,grid=new Int16Array(W*H).fill(-1),palette=[];
for(const m of master.matchAll(/<path id="color-\d+" fill="(#[0-9A-F]{6})" d="([^"]+)"\/>/g)){
 const k=palette.length;palette.push(m[1]);
 for(const r of m[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)Z/g)){
  const x=+r[1],y=+r[2],w=+r[3],h=+r[4];
  if(w!==+r[5])throw Error("Bad master rectangle");
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
    const i=yy*W+xx;if(grid[i]!==-1)throw Error("Master overlap");
    grid[i]=k;
  }
 }
}
if(palette.length!==25||grid.reduce((v,c)=>v+Number(c>=0),0)!==179751)
 throw Error("Master geometry changed; obtain art approval before regeneration");
const warm=new Set(["#F2A80A","#F3CF13","#E6621A","#9D2417","#A5580A","#5D281C"]);
const pink=new Set(["#FA9C9E","#F66A6B","#FB7A83"]);
const names=["hat","tassel","ear-left","ear-right","eye-left","eye-right","mouth","blush-left","blush-right","tail","torso","face"];
function which(x,y,c){
 const ink=c==="#08080C"||c==="#09090D";
 if(warm.has(c)&&(y<315||x>455))return "tassel";
 if(pink.has(c)&&y<250){if(x<227)return "ear-left";if(x>363)return "ear-right";}
 if(c==="#FA9C9E"&&y>=284&&y<362){if(x<252)return "blush-left";if(x>325)return "blush-right";}
 if(ink&&y>=242&&y<=312){if(x>=182&&x<247)return "eye-left";if(x>322&&x<=399)return "eye-right";}
 if((ink||pink.has(c))&&x>=250&&x<=325&&y>=292&&y<=331)return "mouth";
 if(y<198)return "hat";
 if(x>=395&&y>=379)return "tail";
 if(y>=398)return "torso";
 return "face";
}
const parts={};
for(const p of names)parts[p]=Object.fromEntries(palette.map(c=>[c,[]]));
for(let y=0;y<H;y++){
 let x=0;
 while(x<W){
  const k=grid[y*W+x];if(k<0){x++;continue;}
  const p=which(x,y,palette[k]),x0=x;
  x++;while(x<W&&grid[y*W+x]===k&&which(x,y,palette[k])===p)x++;
  parts[p][palette[k]].push([x0,y,x-x0,1]);
 }
}
function merge(runs){
 const out=[],active=new Map();
 for(const r of runs){
  const x=r[0],y=r[1],w=r[2],h=r[3],key=x+"/"+w,old=active.get(key);
  if(old&&old[1]+old[3]===y)old[3]+=h;
  else{const v=[x,y,w,h];out.push(v);active.set(key,v);}
 }
 return out;
}
let content="/** Auto-generated from the 573x573 original 25-color Xiaozhi foreground.\n"+
 " * Each pixel belongs to exactly one named part; default composite is EXACT.\n"+
 " * Semantic layers are region-identified, NOT yet an articulated skeleton.\n"+
 " * Regenerate only from the canonical source, never from a newly imagined cat.\n"+
 " */\n"+
 "export const XIAOZHI_PARTS = "+JSON.stringify(names)+" as const;\n"+
 "export type XiaozhiPart = typeof XIAOZHI_PARTS[number];\n"+
 "export function XiaozhiLayers({inspectPart}: {inspectPart?:XiaozhiPart|null}){\n"+
 "return <g data-xz-rig=\"source-exact\" stroke=\"none\" shapeRendering=\"crispEdges\">\n";
for(const p of names){
 content+="<g id=\"xz-"+p+"\" data-xz-part=\""+p+"\" opacity={inspectPart&&inspectPart!==\""+p+"\"?0.15:1}>\n";
 for(const c of palette){
  const rs=parts[p][c];if(!rs.length)continue;
  const d=merge(rs).map(r=>"M"+r[0]+" "+r[1]+"h"+r[2]+"v"+r[3]+"h-"+r[2]+"Z").join(" ");
  content+="<path fill=\""+c+"\" d=\""+d+"\"/>\n";
 }
 content+="</g>\n";
}
content+="</g>;\n}\n";
const target=resolve(web,"src/design/pixel-pop/mascot/XiaozhiLayers.tsx");
const mode=process.argv[2]||"--check";
if(mode==="--write"){writeFileSync(target,content,"utf8");console.log("Wrote",target);}
else if(mode==="--check"){
 if(readFileSync(target,"utf8")!==content){console.error("Generated layers are stale");process.exitCode=1;}
 else console.log("12 source-exact Xiaozhi layers are current");
}else throw Error("Usage: --check | --write");
