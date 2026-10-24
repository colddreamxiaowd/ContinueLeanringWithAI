#!/usr/bin/env node
// Browser-visual QA against real Next.js/workerd, not a static mock:
// same site header/Xiaozhi, readable paper contrast, no overflow,
// light/dark toggle, responsive captures, and /sources hydration.
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join} from "node:path";

const ORIGIN=process.env.ZHIXU_PREVIEW_ORIGIN||"http://127.0.0.1:3001";
const OUT=resolve(process.env.ZHIXU_PREVIEW_OUT||"../pixel-pop-cross-page-preview");
mkdirSync(OUT,{recursive:true});
const PORT=9457;
const profile=mkdtempSync(join(tmpdir(),"zhixu-cross-page-"));
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--remote-allow-origins=*","--remote-debugging-port="+PORT,
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"
],{stdio:["ignore","ignore","pipe"]});
let stderr="";
chrome.stderr.on("data",x=>stderr=(stderr+String(x)).slice(-2000));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try {
 let wsUrl;
 for(let i=0;i<90&&!wsUrl;i++){
  const response=await fetch("http://127.0.0.1:"+PORT+"/json/list").catch(()=>null);
  if(response?.ok)wsUrl=(await response.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;
  if(!wsUrl)await sleep(200);
 }
 if(!wsUrl)throw Error("Chrome could not start "+stderr);
 socket=new WebSocket(wsUrl);
 await new Promise((ok,fail)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",fail,{once:true})});
 const pending=new Map();let seq=0;
 socket.addEventListener("message",e=>{
  const event=JSON.parse(e.data);
  if(!pending.has(event.id))return;
  const [ok,fail]=pending.get(event.id);pending.delete(event.id);
  event.error?fail(Error(event.error.message)):ok(event.result);
 });
 const cmd=(method,params={})=>new Promise((ok,fail)=>{
  const id=++seq;pending.set(id,[ok,fail]);socket.send(JSON.stringify({id,method,params}));
 });
 const js=async(expression)=>{
  const result=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error("Browser JS: "+JSON.stringify(result.exceptionDetails).slice(0,500));
  return result.result?.value;
 };
 const until=async(expression)=>{
  for(let i=0;i<105;i++){
   if(await js(expression).catch(()=>false))return;
   await sleep(160);
  }
  throw Error("Timed out browser predicate: "+expression);
 };
 const image=async(file,width,height)=>{
  const metrics=await cmd("Page.getLayoutMetrics");
  const actualHeight=Math.min(7200,Math.max(height,Math.ceil(metrics.cssContentSize.height)));
  const screenshot=await cmd("Page.captureScreenshot",{
   format:"png",fromSurface:true,captureBeyondViewport:true,
   clip:{x:0,y:0,width,height:actualHeight,scale:1}
  });
  writeFileSync(join(OUT,file),Buffer.from(screenshot.data,"base64"));
 };
 const visit=async(path)=>{
  const request=await fetch(ORIGIN+path,{redirect:"follow",signal:AbortSignal.timeout(15000)});
  if(request.status!==200)throw Error(path+" HTTP "+request.status);
  await cmd("Page.navigate",{url:ORIGIN+path});
  await until("document.querySelector('[data-site-shell-ready=true]') !== null");
  await until("document.querySelector('.pp-topbar .pp-brand') !== null");
  await sleep(220);
 };
 const assertDisplay=async(path)=>{
  const state=await js(`(()=>{
   const root=document.querySelector('.pp-site-shell');
   const legacy=root?.querySelector('[data-pixel-pop-content=true]');
   const h=legacy?.querySelector('.page-heading h1, .article-body h1');
   const paper=legacy?getComputedStyle(legacy).backgroundColor:'';
   const ink=h?getComputedStyle(h).color:'';
   const rect=legacy?.getBoundingClientRect();
   return {ready:!!root,brand:!!root?.querySelector('.pp-brand'),
    mascot:!!root?.querySelector('.pp-avatar svg'),
    nav:root?.querySelectorAll('.pp-sidebar .pp-nav-item').length,
    paper,ink,legacy:!!legacy,width:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
    surfaceWidth:rect?.width??0};
  })()`);
  if(!state.ready||!state.brand||!state.mascot||state.nav<6)throw Error(path+": site shell not unified: "+JSON.stringify(state));
  if(path!=="/"&&!state.legacy)throw Error(path+": legacy route missing readable white surface");
  if(state.legacy&&!["rgb(255, 255, 255)","rgb(248, 248, 255)"].includes(state.paper))throw Error(path+": expected readable paper background: "+JSON.stringify(state));
  if(state.legacy&&state.ink==="rgb(255, 255, 255)")throw Error(path+": dark text regression: "+JSON.stringify(state));
  if(state.scroll>state.width+3)throw Error(path+": horizontal overflow "+JSON.stringify(state));
  return state;
 };
 await cmd("Page.enable");await cmd("Runtime.enable");
 const routes=[
  {path:"/",file:"home"},
  {path:"/courses/",file:"courses"},
  {path:"/read/circular-queue/",file:"article"},
  {path:"/sources/",file:"sources"},
 ];
 const records=[];
 for(const [label,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width===390});
  // Persisted preference from the previous viewport is intentional user state;
  // explicitly reset it for labeled LIGHT screenshots, then test DARK separately.
  await visit("/");
  await js("localStorage.setItem('learninghub.theme','light')");
  await cmd("Page.reload",{ignoreCache:false});
  await until("document.querySelector('.pp-site-shell')?.dataset.ppTheme==='light'");
  for(const route of routes){
   await visit(route.path);
   const state=await assertDisplay(route.path);
   if(route.file==="sources"){
    const present=await js("document.body.textContent.includes('合成演示资料')");
    if(!present)throw Error("sources text not rendered");
   }
   const name=label+"-"+route.file+"-light.png";
   await image(name,width,height);
   records.push({viewport:label,path:route.path,file:name,shell:true,
    overflow:false,paper:state.paper,ink:state.ink});
  }
  await visit("/courses/");
  const didClick=await js("(()=>{const b=document.querySelector('[aria-label=\"切换深色主题\"]');if(!b)return false;b.click();return true})()");
  if(!didClick)throw Error("Missing theme toggle");
  await until("document.querySelector('.pp-site-shell')?.dataset.ppTheme==='dark'");
  await assertDisplay("/courses/");
  const dark=label+"-courses-dark.png";
  await image(dark,width,height);
  await cmd("Page.reload",{ignoreCache:false});
  await until("document.querySelector('.pp-site-shell')?.dataset.ppTheme==='dark'");
  const persisted=await assertDisplay("/courses/");
  records.push({viewport:label,path:"/courses/",file:dark,theme:"dark",reloadPersisted:true,
   readable: persisted.paper==="rgb(248, 248, 255)"});
  console.log("PASS "+label+": "+routes.length+" cross-page visuals + dark-theme persistence");
 }
 writeFileSync(join(OUT,"acceptance.json"),JSON.stringify({origin:ORIGIN,records},null,2));
 console.log("VISUAL_ACCEPTANCE_PASS "+records.length+" browser captures");
}finally{
 socket?.close();chrome.kill("SIGTERM");await sleep(350);
 try{rmSync(profile,{recursive:true,force:true})}catch{}
}
