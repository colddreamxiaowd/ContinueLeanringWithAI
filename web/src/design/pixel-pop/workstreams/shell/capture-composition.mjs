#!/usr/bin/env node
/** Browser proof of A shell around actual B/C/D components in transient Next.js routes.
 * Adapted from the existing PR #32 CDP method, no Playwright dependency.
 */
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
const url=process.env.PREVIEW_URL||"http://127.0.0.1:3002";
const out=resolve(process.env.PREVIEW_OUT||"ui-preview-a-composition");
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"pixel-pop-a-composition-"));
const chrome=spawn(process.env.CHROME_BIN||"chromium",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--remote-allow-origins=*","--remote-debugging-port=9238",
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let socket;
const results=[];
try{
 let endpoint;
 for(let i=0;i<60&&!endpoint;i++){
  if(chrome.exitCode!==null)throw Error("Chrome exited "+chrome.exitCode);
  try{const q=await fetch("http://127.0.0.1:9238/json/list");
   if(q.ok)endpoint=(await q.json()).find(z=>z.type==="page")?.webSocketDebuggerUrl;}catch{}
  if(!endpoint)await sleep(200);
 }
 if(!endpoint)throw Error("CDP endpoint missing");
 socket=new WebSocket(endpoint);
 await new Promise((ok,err)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",err,{once:true})});
 const pending=new Map();let id=0;
 socket.addEventListener("message",event=>{
  const m=JSON.parse(event.data);if(!pending.has(m.id))return;
  const [ok,err]=pending.get(m.id);pending.delete(m.id);
  m.error?err(Error(m.error.message)):ok(m.result);
 });
 const cmd=(method,params={})=>new Promise((ok,err)=>{const key=++id;pending.set(key,[ok,err]);socket.send(JSON.stringify({id:key,method,params}));});
 await cmd("Page.enable");await cmd("Runtime.enable");
 const evalJs=async expression=>{
  const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("Runtime JS error "+JSON.stringify(r.exceptionDetails));
  return r.result.value;
 };
 const key=async(name,code,virt)=>{
  await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:name,code,windowsVirtualKeyCode:virt});
  await cmd("Input.dispatchKeyEvent",{type:"keyUp",key:name,code,windowsVirtualKeyCode:virt});
 };
 const capture=async name=>{
  const l=await cmd("Page.getLayoutMetrics");
  const height=Math.min(14000,Math.ceil(l.cssContentSize.height));
  const ss=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
    clip:{x:0,y:0,width:viewport.width,height,scale:1}});
  writeFileSync(join(out,name+".png"),Buffer.from(ss.data,"base64"));
 };
 let viewport={width:1440,height:900};
 const start="/ui-lab/session-a/integration/";
 for(const [device,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  viewport={width,height};
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await cmd("Page.navigate",{url:url+start+"courses"});await sleep(2200);
  const check=async(surface,mode)=>{
   const actual=await evalJs(`(()=>{const root=document.querySelector('.pp-root[data-integration-surface]');
     const active=document.querySelector('aside [aria-current="page"]');
     return {route:location.pathname,surface:root?.dataset.integrationSurface,mode:root?.dataset.density,
      persisted:localStorage.getItem('zhixu_pixel_pop_density'),navLabel:active?.textContent?.trim()??null,
      navCurrent:active?.getAttribute('aria-current')??null,wrapperWidth:document.querySelector('aside')?.getBoundingClientRect().width,
      width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
      component:!!document.querySelector('[data-real-composition]'),header:!!document.querySelector('.pp-header')};})()`);
   if(actual.surface!==surface||actual.mode!==mode||actual.persisted!==mode||actual.navCurrent!=="page"||
     !actual.component||actual.width>actual.viewport+3)
     throw Error("Integration mismatch "+device+"/"+surface+"/"+mode+": "+JSON.stringify(actual));
   return actual;
  };
  const modes=[];
  for(const [mode,label] of [["minimal","极简"],["balanced","较简"],["normal","正常"]]){
   await evalJs(`document.querySelector('button[aria-haspopup="true"]')?.click()`);
   await sleep(110);
   const hit=await evalJs(`(()=>{const x=[...document.querySelectorAll('[role="radio"]')]
     .find(x=>x.textContent.includes(${JSON.stringify(label)}));x?.click();return !!x})()`);
   if(!hit)throw Error("Missing mode "+mode);
   await sleep(180);modes.push(await check("courses",mode));
   if(mode==="balanced")await capture("compose-"+device+"-courses");
  }
  if(width>720 && !(modes[0].wrapperWidth>modes[1].wrapperWidth&&modes[1].wrapperWidth>modes[2].wrapperWidth))
   throw Error("Shell density widths unchanged "+device);
  // Restore default balanced before inter-page navigation.
  await evalJs(`document.querySelector('button[aria-haspopup="true"]')?.click()`);await sleep(100);
  await evalJs(`[...document.querySelectorAll('[role="radio"]')].find(x=>x.textContent.includes('较简'))?.click()`);
  await sleep(150);
  if(width>720){
   await evalJs(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes("折叠侧栏"))?.click()`);
   await sleep(150);
   const collapsed=await evalJs(`document.querySelector('[data-collapsed="true"]')!==null`);
   if(!collapsed)throw Error("Collapse failed "+device);
   await capture("compose-"+device+"-collapsed");
  }else{
   await evalJs(`(()=>{let x=document.querySelector('button[aria-label="打开侧边导航"]');x?.focus();x?.click()})()`);
   await sleep(180);
   const drawer=await evalJs(`document.querySelector('[data-mobile-open="true"]')!==null`);
   if(!drawer)throw Error("Drawer open failed");
   await capture("compose-mobile-drawer-open");
   await key("Escape","Escape",27);await sleep(160);
   const closed=await evalJs(`(()=>({hidden:!!document.querySelector('[data-mobile-open="false"]'),
     focus:document.activeElement?.getAttribute('aria-label')}))()`);
   if(!closed.hidden||closed.focus!=="打开侧边导航")throw Error("Mobile drawer close/focus: "+JSON.stringify(closed));
   await capture("compose-mobile-drawer-closed");
   await evalJs(`document.querySelector('button[aria-label="打开侧边导航"]')?.click()`);
   await sleep(150);
  }
  // Actual Link navigation, not a simulated callback. Mobile links sit in the drawer.
  await evalJs(`document.querySelector('aside a[href$="/reader"]')?.click()`);
  await sleep(2400);
  let reader=await check("reader","balanced");
  if(width>720){
   const stillCollapsed=await evalJs(`document.querySelector('[data-collapsed="true"]')!==null`);
   if(!stillCollapsed)throw Error("Collapse lost between course/reader routes");
  }
  await capture("compose-"+device+"-reader");
  if(width<=720){
   await evalJs(`document.querySelector('button[aria-label="打开侧边导航"]')?.click()`);
   await sleep(170);
  }
  await evalJs(`document.querySelector('aside a[href$="/practice"]')?.click()`);
  await sleep(2400);
  const practice=await check("practice","balanced");
  await capture("compose-"+device+"-practice");
  // B/C/D actual components are present. Verify D is actionable.
  await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Push 入栈'))?.click()`);
  await sleep(180);
  const worked=await evalJs(`document.querySelector('[aria-label="可交互的栈操作实验"] [role="status"]')?.textContent`);
  if(!worked?.includes("7"))throw Error("Actual D stack interaction failed: "+String(worked));
  results.push({device,width,height,modes,reader,practice,stackStatus:worked.slice(0,125)});
  console.log(JSON.stringify({device,courseModes:modes.map(x=>x.mode),reader:reader.route,practice:practice.route,passed:true}));
 }
 writeFileSync(join(out,"results.json"),JSON.stringify({kind:"Real Next.js B/C/D imported into Session A shell",source:url,results},null,2));
}finally{
 socket?.close();chrome.kill("SIGTERM");
 await Promise.race([new Promise(ok=>chrome.once("exit",ok)),sleep(1800)]);
 try{rmSync(profile,{recursive:true,force:true,maxRetries:6,retryDelay:180})}catch{}
}
