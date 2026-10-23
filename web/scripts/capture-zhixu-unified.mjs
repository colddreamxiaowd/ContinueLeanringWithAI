#!/usr/bin/env node
/** One SHA / one Next.js 16 process / 3 complete A+B+C+D pages / three widths. */
import {spawn} from "node:child_process";
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join} from "node:path";
const host=process.env.ZHIXU_PREVIEW_ORIGIN||"http://127.0.0.1:3001";
const out=resolve(process.env.ZHIXU_PREVIEW_OUT||"../unified-preview");
const prefix="/ui-lab/integrated/";
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"zhixu-unified-"));
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--hide-scrollbars","--remote-allow-origins=*","--remote-debugging-port=9273",
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"
],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const output={kind:"actual Next.js 16 + React 19 + Chromium CDP",origin:host,views:[]};
let socket;
try{
 let url;
 for(let i=0;i<80&&!url;i++){
  if(chrome.exitCode!==null)throw Error("Chrome exited: "+chrome.exitCode);
  try{const r=await fetch("http://127.0.0.1:9273/json/list");
   if(r.ok)url=(await r.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;
  }catch{}
  if(!url)await sleep(200);
 }
 if(!url)throw Error("Chromium debugging endpoint unavailable");
 socket=new WebSocket(url);
 await new Promise((yes,no)=>{socket.addEventListener("open",yes,{once:true});socket.addEventListener("error",no,{once:true});});
 let seq=0;const waiting=new Map();
 socket.addEventListener("message",event=>{
  const v=JSON.parse(event.data);
  if(v.id&&waiting.has(v.id)){
   const [yes,no]=waiting.get(v.id);waiting.delete(v.id);
   v.error?no(Error(v.error.message)):yes(v.result);
  }
 });
 const cmd=(method,params={})=>new Promise((yes,no)=>{
  const id=++seq;waiting.set(id,[yes,no]);
  socket.send(JSON.stringify({id,method,params}));
 });
 await cmd("Page.enable");await cmd("Runtime.enable");
 async function js(expression){
  const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("Browser runtime exception: "+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
 }
 async function until(expression,label){
  for(let i=0;i<65;i++){if(await js(expression).catch(()=>false))return;await sleep(180);}
  throw Error("Timeout waiting for "+label);
 }
 async function click(selector){
  const ok=await js("(function(){const x=document.querySelector("+JSON.stringify(selector)+");if(!x)return false;x.click();return true})()");
  if(!ok)throw Error("Click target absent: "+selector);
  await sleep(150);
 }
 async function button(text,selector="button"){
  const ok=await js("(function(){const x=[...document.querySelectorAll("+JSON.stringify(selector)+")].find(el=>el.textContent.includes("+JSON.stringify(text)+"));if(!x)return false;x.click();return true})()");
  if(!ok)throw Error("Button absent: "+text);
  await sleep(150);
 }
 async function view(id){
  await until("location.pathname==="+JSON.stringify(prefix+id)+"&&!!document.querySelector('[data-integrated-page=\""+id+"\"]')","page "+id);
  await sleep(210);
  const metrics=await js("(function(){return {path:location.pathname,page:document.querySelector('[data-integrated-page]')?.dataset.integratedPage,brand:document.querySelectorAll('header a[aria-label=\"知序 Learning Hub 首页\"]').length,roots:document.querySelectorAll('.pp-root').length,nav:document.querySelectorAll('aside[aria-label=\"学习中心侧边导航\"] nav a[href]').length,density:document.querySelector('.pp-root')?.dataset.density,scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,devLabels:/SidebarNav|QuizCard|StackPlayground/.test(document.querySelector('main')?.textContent||'')}})()");
  if(metrics.path!==prefix+id||metrics.page!==id||metrics.brand!==1||metrics.roots!==1||metrics.nav!==3||metrics.devLabels||metrics.scrollWidth>metrics.viewport+3)
   throw Error("Visual shell gate "+id+": "+JSON.stringify(metrics));
  return metrics;
 }
 async function capture(id,name,w,h){
  const layout=await cmd("Page.getLayoutMetrics");
  const contentH=Math.min(14000,Math.ceil(layout.cssContentSize.height));
  const r=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
   clip:{x:0,y:0,width:w,height:contentH,scale:1}});
  const filename="unified-"+id+"-"+name+"-"+w+".png";
  writeFileSync(join(out,filename),Buffer.from(r.data,"base64"));
  return {file:filename,height:contentH,viewport:[w,h]};
 }
 for(const [name,w,h] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await cmd("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
  await cmd("Page.navigate",{url:host+prefix+"home"});
  await until("!!document.querySelector('[data-integrated-page=\"home\"]')&&document.querySelector('[data-shell-ready]')?.dataset.shellReady==='true'","hydrated home");
  const home=await view("home");
  const cards=await js("({cards:document.querySelectorAll('[data-integrated-cards]>section').length,hero:!!document.querySelector('#lego-course-title'),demo:document.body.textContent.includes('合成示例数据')})");
  if(cards.cards!==3||!cards.hero||!cards.demo)throw Error("B card/hero or demonstration label missing");
  await click('button[aria-haspopup="true"]');
  await button("正常",'[role="radio"]');
  await until("document.querySelector('.pp-root')?.dataset.density==='normal'","normal density");
  const shots=[await capture("home",name,w,h)];
  await click('a[href="'+prefix+'reader"]');
  const reader=await view("reader");
  const readCheck=await js("({lesson:!!document.querySelector('[data-reader-block=\"lesson\"]'),outline:!!document.querySelector('[data-reader-block=\"outline\"]'),citation:!!document.querySelector('[data-reader-block=\"citation\"]')})");
  if(reader.density!=="normal"||!readCheck.lesson||!readCheck.outline||!readCheck.citation)
   throw Error("Complete C reader or density persistence absent: "+JSON.stringify(readCheck));
  shots.push(await capture("reader",name,w,h));
  await click('button[aria-label^="查看引用"]');
  await click("a[data-read-to-practice]");
  const practice=await view("practice");
  if(practice.density!=="normal")throw Error("Density lost on practice");
  const exercise=await js("({lab:!!document.querySelector('[aria-label=\"可交互的栈操作实验\"]'),quiz:!!document.querySelector('section[aria-label=\"单选题\"]')})");
  if(!exercise.lab||!exercise.quiz)throw Error("Incomplete D practice");
  shots.push(await capture("practice",name,w,h));
  await button("Push 入栈");
  const pushed=await js("document.querySelector('[aria-label=\"可交互的栈操作实验\"] [role=\"status\"]')?.textContent");
  if(!pushed?.includes("栈顶 7"))throw Error("Push actual array state not updated: "+pushed);
  await button("Pop 出栈");
  const popped=await js("document.querySelector('[aria-label=\"可交互的栈操作实验\"] [role=\"status\"]')?.textContent");
  if(!popped?.includes("栈已空"))throw Error("Pop failed "+popped);
  await button("重置");
  await click('section[aria-label="单选题"] button[aria-label^="A，"]');
  await until("!!document.querySelector('section[aria-label=\"单选题\"] [aria-label=\"答案错误\"]')","incorrect feedback");
  await button("重新作答",'section[aria-label="单选题"] button');
  await click('section[aria-label="单选题"] button[aria-label^="D，"]');
  await until("!!document.querySelector('section[aria-label=\"单选题\"] [aria-label=\"正确答案\"]')","correct feedback");
  shots.push(await capture("practice-answered",name,w,h));
  await button("下一题",'section[aria-label="单选题"] button');
  const next=await js("document.querySelector('section[aria-label=\"单选题\"]')?.textContent.includes('Push(5)')");
  if(!next)throw Error("Next quiz does not replace question");
  await click("a[data-practice-to-home]");
  const returned=await view("home");
  if(returned.density!=="normal")throw Error("Cross-page density lost");
  output.views.push({name,width:w,pass:true,home,reader,practice,cards,readCheck,exercise,
   crossPageDensity:returned.density,sequence:"home → reader → practice → home",shots});
  console.log(JSON.stringify({name,width:w,pass:true,images:shots.map(x=>x.file)}));
 }
 writeFileSync(join(out,"browser-results.json"),JSON.stringify(output,null,2));
}finally{
 socket?.close();chrome.kill("SIGTERM");
 await Promise.race([new Promise(r=>chrome.once("exit",r)),sleep(1400)]);
 try{rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:160});}catch{}
}
