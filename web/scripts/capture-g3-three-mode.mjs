#!/usr/bin/env node
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join} from "node:path";
const origin=process.env.ZHIXU_PREVIEW_ORIGIN||"http://127.0.0.1:3001";
const out=resolve(process.env.ZHIXU_PREVIEW_OUT||"../g3-three-mode-screenshots");
const port=9379;
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"zhixu-g3-chrome-"));
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--remote-allow-origins=*","--remote-debugging-port="+port,
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"
],{stdio:["ignore","ignore","pipe"]});
let stderr="";
chrome.stderr.on("data",chunk=>stderr=(stderr+String(chunk)).slice(-3000));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket;
try{
 let url;
 for(let i=0;i<120&&!url;i++){
  const r=await fetch("http://127.0.0.1:"+port+"/json/list").catch(()=>null);
  if(r?.ok)url=(await r.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;
  if(!url)await sleep(200);
 }
 if(!url)throw Error("Chrome not available "+stderr);
 socket=new WebSocket(url);
 await new Promise((ok,fail)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",fail,{once:true});});
 let seq=0;const queue=new Map();
 socket.addEventListener("message",evt=>{
  const x=JSON.parse(evt.data);
  if(queue.has(x.id)){const [ok,fail]=queue.get(x.id);queue.delete(x.id);
   x.error?fail(Error(x.error.message)):ok(x.result);}
 });
 const cmd=(method,params={})=>new Promise((ok,fail)=>{
  const id=++seq;queue.set(id,[ok,fail]);socket.send(JSON.stringify({id,method,params}));
 });
 const js=async(expression)=>{
  const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
  return r.result?.value;
 };
 const until=async(expression)=>{
  for(let i=0;i<95;i++){
   if(await js(expression).catch(()=>false))return;
   await sleep(170);
  }
  throw Error("Timed out: "+expression);
 };
 const click=async(label)=>{
  const did=await js("(()=>{const x=[...document.querySelectorAll('button')].find(x=>x.textContent.includes("+JSON.stringify(label)+"));if(!x)return false;x.click();return true;})()");
  if(!did)throw Error("Missing button: "+label);
  await sleep(150);
 };
 await cmd("Page.enable");await cmd("Runtime.enable");
 const records=[];
 for(const [size,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await cmd("Page.navigate",{url:origin+"/ui-lab/plan-modes/"});
  await until("!!document.querySelector('[data-plan-studio]') && !!document.querySelector('[data-shell-ready=true]')");
  await until("document.querySelectorAll('[aria-label=\"知识点目录\"] button').length===2");
  await click("C · 纯应试");
  await until("document.querySelector('[data-plan-mode]')?.dataset.planMode==='exam'");
  await click("自评：我能独立复述");
  await until("document.querySelectorAll('[aria-label=\"知识点目录\"] button')[0]?.textContent.includes('自评能够复述')");
  await click("A · 课件忠实");
  await until("document.querySelector('[data-plan-mode]')?.dataset.planMode==='faithful'");
  const shared=await js("document.querySelectorAll('[aria-label=\"知识点目录\"] button')[0]?.textContent.includes('自评能够复述')");
  if(!shared)throw Error("Mode switch lost concept-level mastery");
  // ChatGPT bridge must be real interactive UI, not a decorative CTA.
  await until("document.querySelector('[data-chatgpt-handoff]')!==null");
  await click("生成并下载交接包");
  await until("document.querySelector('textarea[aria-label=\\\"ChatGPT 制课指令\\\"]')?.value.includes('CoursePack v0.1')");
  const handoffActions=await js("(()=>{const r=document.querySelector('[data-chatgpt-handoff]');return {source:r?.textContent.includes('交接包已下载'),fixedChat:r?.textContent.includes('固定会话'),import:r?.textContent.includes('导入 GPT 生成的 CoursePack')};})()");
  if(!handoffActions.source||!handoffActions.fixedChat||!handoffActions.import)
   throw Error("GPT course handoff not fully interactive "+JSON.stringify(handoffActions));
  await click("展开资料原文并核对");
  await until("!!document.querySelector('[class*=sourceExcerpt]')");
  const before=await js("({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth})");
  if(before.scroll>before.width+3)throw Error("Horizontal overflow "+JSON.stringify(before));
  const metrics=await cmd("Page.getLayoutMetrics");
  const image=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
   clip:{x:0,y:0,width,height:Math.min(10000,Math.ceil(metrics.cssContentSize.height)),scale:1}});
  const file="three-mode-"+size+"-"+width+".png";
  writeFileSync(join(out,file),Buffer.from(image.data,"base64"));
  await cmd("Page.reload",{ignoreCache:false});
  await until("document.querySelectorAll('[aria-label=\"知识点目录\"] button')[0]?.textContent.includes('自评能够复述')");
  records.push({size,width,file,masteryShared:true,reloadPersisted:true,overflow:false});
  console.log(JSON.stringify(records.at(-1)));
 }
 writeFileSync(join(out,"results.json"),JSON.stringify({origin,records},null,2));
}finally{
 socket?.close();chrome.kill("SIGTERM");await sleep(400);
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
