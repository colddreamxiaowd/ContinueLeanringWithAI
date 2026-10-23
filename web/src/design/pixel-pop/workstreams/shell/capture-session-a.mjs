#!/usr/bin/env node
/** Real Next.js/Chromium Session A interaction + three-viewport screenshot proof.
 * Adapted from existing PR #32 CDP script. No additional npm browser package.
 */
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

const bin=process.env.CHROME_BIN||"chromium";
const url=process.env.PREVIEW_URL||"http://127.0.0.1:3001/ui-lab/session-a";
const out=resolve(process.env.PREVIEW_OUT||"ui-preview-a");
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"pixel-pop-a-cdp-"));
const chrome=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--hide-scrollbars","--remote-allow-origins=*","--remote-debugging-port=9226",
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket;
const results=[];
try{
 let endpoint;
 for(let i=0;i<70&&!endpoint;i++){
  if(chrome.exitCode!==null)throw Error("Chromium exited: "+chrome.exitCode);
  try{const r=await fetch("http://127.0.0.1:9226/json/list");
   if(r.ok)endpoint=(await r.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;
  }catch{}
  if(!endpoint)await sleep(200);
 }
 if(!endpoint)throw Error("CDP unavailable");
 socket=new WebSocket(endpoint);
 await new Promise((ok,err)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",err,{once:true})});
 const promises=new Map();let id=0;
 socket.addEventListener("message",e=>{const m=JSON.parse(e.data);
  if(promises.has(m.id)){const [ok,err]=promises.get(m.id);promises.delete(m.id);
   m.error?err(Error(m.error.message)):ok(m.result);}
 });
 const cmd=(method,params={})=>new Promise((ok,err)=>{const n=++id;promises.set(n,[ok,err]);socket.send(JSON.stringify({id:n,method,params}))});
 await cmd("Page.enable");await cmd("Runtime.enable");
 const evaluate=async expression=>{const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("In-page JS exception: "+JSON.stringify(r.exceptionDetails));
  return r.result.value;};
 const key=async(key,code)=>{await cmd("Input.dispatchKeyEvent",{type:"keyDown",key,code,windowsVirtualKeyCode:key==="Escape"?27:9});
  await cmd("Input.dispatchKeyEvent",{type:"keyUp",key,code,windowsVirtualKeyCode:key==="Escape"?27:9});};
 const capture=async(name,width,height)=>{
  const metrics=await cmd("Page.getLayoutMetrics");
  const h=Math.min(16000,Math.ceil(metrics.cssContentSize.height));
  const r=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
   clip:{x:0,y:0,width,height:h,scale:1}});
  const filename=name+".png";writeFileSync(join(out,filename),Buffer.from(r.data,"base64"));return filename;
 };
 for(const [size,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await cmd("Page.navigate",{url});await sleep(2700);
  const initial=await evaluate(`(()=>{const root=document.querySelector(".pp-root");
   return {title:document.title,root:!!root,nav:!!document.querySelector('aside[aria-label="学习中心侧边导航"]'),
    density:!!document.querySelector('[aria-haspopup="true"]'),breadcrumb:!!document.querySelector('[aria-label="面包屑导航"]'),
    width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}})()`);
  if(!initial.root||!initial.nav||!initial.density||!initial.breadcrumb)throw Error("Not a real Session A Next.js page: "+JSON.stringify(initial));
  if(initial.width>initial.viewport+3)throw Error("Horizontal overflow "+size+": "+JSON.stringify(initial));
  const modeMeasures=[];
  for(const [mode,label] of [["minimal","极简"],["balanced","较简"],["normal","正常"]]){
   await evaluate(`document.querySelector('button[aria-haspopup="true"]')?.click()`);
   await sleep(120);
   const set=await evaluate(`(()=>{const choice=[...document.querySelectorAll('[role="radio"]')].find(el=>el.textContent.includes(${JSON.stringify(label)}));
    if(!choice)return false;choice.click();return true;})()`);
   if(!set)throw Error("Density mode option missing: "+mode);
   await sleep(200);
   const check=await evaluate(`(()=>{let aside=document.querySelector('aside[aria-label="学习中心侧边导航"]');
    return {mode:document.querySelector(".pp-root")?.dataset.density,navWidth:aside?.getBoundingClientRect().width,
      selected:document.querySelector('[aria-checked="true"]')?.textContent??null,
      rowHeight:aside?.querySelector('li')?.getBoundingClientRect().height,
      width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}})()`);
   if(check.mode!==mode)throw Error("Density state not updated "+mode+": "+JSON.stringify(check));
   if(check.width>check.viewport+3)throw Error("Overflow after density "+size+"/"+mode);
   modeMeasures.push(check);
   const name=`session-a-${size}-${width}-${mode}`;
   await capture(name,width,height);
   if(mode==="balanced"){
    // Primary screenshot paths are stable and displayable directly in the PR.
    await capture(`session-a-${size}-${width}`,width,height);
   }
  }
  if(width>720){
   if(!(modeMeasures[0].navWidth>modeMeasures[1].navWidth&&modeMeasures[1].navWidth>modeMeasures[2].navWidth))
    throw Error("Density lacks width difference: "+JSON.stringify(modeMeasures));
   if(!(modeMeasures[0].rowHeight>modeMeasures[2].rowHeight))
    throw Error("Density lacks row-height difference: "+JSON.stringify(modeMeasures));
   await evaluate(`document.querySelector('button')&&[...document.querySelectorAll('button')].find(b=>b.textContent.includes("折叠侧栏"))?.click()`);
   await sleep(200);
   const collapsed=await evaluate(`document.querySelector('[data-collapsed="true"]')!==null`);
   if(!collapsed)throw Error("Collapse interaction failed");
   await capture(`session-a-${size}-collapsed`,width,height);
  }else{
   await evaluate(`document.querySelector('button[aria-label="打开侧边导航"]')?.click()`);
   await sleep(150);
   const mobileOpen=await evaluate(`!!document.querySelector('[data-mobile-open="true"]')`);
   if(!mobileOpen)throw Error("Mobile drawer open failed");
   await sleep(250);
   await capture("session-a-mobile-drawer",width,height);
   await key("Escape","Escape");await sleep(140);
   const closed=await evaluate(`(()=>({closed:!!document.querySelector('[data-mobile-open="false"]'),
    focus:document.activeElement?.getAttribute("aria-label")}))()`);
   if(!closed.closed||closed.focus!=="打开侧边导航")throw Error("Escape focus recovery failed: "+JSON.stringify(closed));
   await evaluate(`document.querySelector('button[aria-label="打开侧边导航"]').click()`);
   await sleep(140);
   await evaluate(`[...document.querySelectorAll('aside button')].find(x=>x.textContent.includes("飞书资料"))?.click()`);
   await sleep(180);
   const active=await evaluate(`document.querySelector('aside [aria-current="page"]')?.textContent`);
   if(!active?.includes("飞书资料"))throw Error("Nav selection failed: "+active);
   await capture("session-a-mobile-selected",width,height);
  }
  await evaluate(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes("测试长中文标题"))?.click()`);
  await sleep(150);
  const changed=await evaluate(`document.querySelector('nav[aria-label="面包屑导航"] [aria-current="page"]')?.textContent`);
  if(!changed?.includes("长中文"))throw Error("Long Chinese breadcrumb state not updated: "+changed);
  await sleep(150);await capture(`session-a-${size}-long-chinese`,width,height);
  results.push({size,width,height,initial,modeMeasures,changedTitle:changed});
  console.log(JSON.stringify({size,passed:true,width:initial.width,modes:modeMeasures.map(x=>x.mode)}));
 }
 writeFileSync(join(out,"results.json"),JSON.stringify({url,results,kind:"real Next.js + Chromium CDP"},null,2));
}finally{
 socket?.close();chrome.kill("SIGTERM");
 await Promise.race([new Promise(ok=>chrome.once("exit",ok)),sleep(1700)]);
 try{rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:180})}catch{}
}
