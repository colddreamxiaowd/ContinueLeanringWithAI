#!/usr/bin/env node
/** Actual Next.js + Chromium CDP screenshots. No raster mockups or image generation. */
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
const root=process.env.PREVIEW_URL||"http://127.0.0.1:3006/ui-lab/xiaozhi-motion";
const out=resolve(process.env.PREVIEW_OUT||"xiaozhi-motion-proof");
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"xz-motion-cdp-"));
const chrome=spawn(process.env.CHROME_BIN||"chromium",[
  "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--hide-scrollbars",
  "--remote-allow-origins=*","--remote-debugging-port=9242",
  "--user-data-dir="+profile,"--window-size=1440,900","about:blank"
],{stdio:"ignore"});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let socket;
const results=[];
try{
 let endpoint;
 for(let i=0;i<75&&!endpoint;i++){
  if(chrome.exitCode!==null)throw Error("Chromium died with status "+chrome.exitCode);
  try{const q=await fetch("http://127.0.0.1:9242/json/list");
    if(q.ok)endpoint=(await q.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;}catch{}
  if(!endpoint)await sleep(170);
 }
 if(!endpoint)throw Error("Chromium CDP did not start");
 socket=new WebSocket(endpoint);
 await new Promise((ok,err)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",err,{once:true})});
 const pending=new Map();let id=0;
 socket.addEventListener("message",event=>{
  const m=JSON.parse(event.data);if(!pending.has(m.id))return;
  const [ok,err]=pending.get(m.id);pending.delete(m.id);
  m.error?err(Error(m.error.message)):ok(m.result);
 });
 const cmd=(method,params={})=>new Promise((ok,err)=>{
  const n=++id;pending.set(n,[ok,err]);socket.send(JSON.stringify({id:n,method,params}));
 });
 await cmd("Page.enable");await cmd("Runtime.enable");
 const evalJs=async expression=>{
  const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("In-page script: "+JSON.stringify(r.exceptionDetails));
  return r.result.value;
 };
 const capture=async(name,width)=>{
  const metrics=await cmd("Page.getLayoutMetrics");
  const height=Math.min(10000,Math.ceil(metrics.cssContentSize.height));
  const r=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
    clip:{x:0,y:0,width,height,scale:1}});
  writeFileSync(join(out,name+".png"),Buffer.from(r.data,"base64"));
 };
 for(const [name,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<=500});
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  await cmd("Page.navigate",{url:root});await sleep(1750);
  const baseline=await evalJs(`(()=>{const lab=document.querySelector('[data-xz-lab="true"]');
    const canvases=[...document.querySelectorAll('[data-motion-rig="exact-parent"]')];
    const svg=document.querySelector('[data-active-action] svg');
    return {lab:!!lab,rigs:canvases.length,parts:[...document.querySelectorAll('[data-xz-part]')].length,
      black:getComputedStyle(lab).getPropertyValue('--ink').trim(),
      nestedRaster:svg?.querySelectorAll('image,foreignObject').length??-1,
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth,
      font:document.fonts.check('12px "Noto Sans CJK SC"'),
      selected:document.querySelector('[aria-pressed="true"]')?.textContent?.trim()??null}})()`);
  if(!baseline.lab||baseline.rigs!==2||baseline.parts!==24||
    baseline.nestedRaster!==0||baseline.documentWidth>baseline.viewportWidth+3)
    throw Error("Invalid actual mascot stage: "+JSON.stringify({name,baseline}));
  // Canonical reference and experimental rig side by side, same complete pixel master.
  await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes("原版静止"))?.click()`);
  await sleep(100);await capture("xiaozhi-"+name+"-"+width+"-idle",width);
  const actions=[];
  for(const [action,label,delay] of [
   ["blink","眨眼",260],["nod","轻轻点头",340],
   ["hop","小跳跃",350],["tail","摇尾巴",360],["hello","打招呼",360]
  ]){
    const clicked=await evalJs(`(()=>{let button=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(${JSON.stringify(label)}));
     if(!button)return false;button.click();return true})()`);
    if(!clicked)throw Error("Action button missing: "+label);
    await sleep(70);
    const state=await evalJs(`(()=>{const active=document.querySelector('[data-active-action]');
      const frame=active?.querySelector('[data-action]');
      return {action:active?.dataset.activeAction,frameAction:frame?.dataset.action,
        animationCount:frame?.getAnimations({subtree:true}).length??0,
        transparent:!frame?.querySelector('image,foreignObject')};})()`);
    if(state.action!==action||state.frameAction!==action||state.animationCount<1||!state.transparent)
      throw Error("Motion did not run: "+JSON.stringify({name,action,state}));
    await sleep(Math.max(0,delay-70));
    await capture("xiaozhi-"+name+"-"+width+"-"+action,width);
    actions.push({action,...state});
  }
  const switched=await evalJs(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.includes('深色'));b?.click();
     return !!b;})()`);
  if(!switched)throw Error("Dark background option missing");
  await sleep(90);
  const bg=await evalJs(`document.querySelector('[data-active-action]')?.getAttribute('data-background')`);
  if(bg!=="dark")throw Error("Dark background not applied");
  await capture("xiaozhi-"+name+"-"+width+"-dark",width);
  // Reduced motion must remove animations, not simply hide buttons.
  await cmd("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(80);
  await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('小跳跃'))?.click()`);
  await sleep(70);
  const reduced=await evalJs(`document.querySelector('[data-active-action] [data-action="hop"]')?.getAnimations({subtree:true}).length`);
  if(reduced!==0)throw Error("Reduced-motion animation found: "+reduced);
  await capture("xiaozhi-"+name+"-"+width+"-reduced",width);
  results.push({name,width,height,baseline,actions,darkBackground:bg,reducedAnimations:reduced});
  console.log(JSON.stringify({viewport:name,width,passed:true,actions:actions.length,reduced}));
 }
 writeFileSync(join(out,"results.json"),JSON.stringify({
  kind:"Real Next.js 16 + Chromium CDP",
  source:root,sourceBasis:"XiaozhiLayers.tsx semantic source-exact rig",
  caveat:"Animation-specific pixel fidelity and tail seams require human review",
  results
 },null,2));
}finally{
 socket?.close();
 chrome.kill("SIGTERM");
 await Promise.race([new Promise(ok=>chrome.once("exit",ok)),sleep(1300)]);
 try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:120})}catch{}
}
