// Chromium CDP screenshot harness for the actual built Next.js route; Node 22 only.
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
const base=process.env.SESSION_C_BASE||"http://127.0.0.1:3100";
const root="test-artifacts/session-c";
const bin=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/chromium"].find(x=>x&&existsSync(x));
if(!bin)throw Error("Chrome not installed");
await mkdir(root,{recursive:true});
const chrome=spawn(bin,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--remote-debugging-port=9333","--remote-allow-origins=*","--user-data-dir=/tmp/session-c-browser-"+process.pid,
 "--window-size=1440,900","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let wsUrl;
for(let i=0;i<80;i++){try{wsUrl=(await (await fetch("http://127.0.0.1:9333/json/version")).json()).webSocketDebuggerUrl;break;}catch{await sleep(250);}}
if(!wsUrl)throw Error("Chrome did not expose DevTools");
const socket=new WebSocket(wsUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let seq=0;const pending=new Map();
socket.onmessage=e=>{const v=JSON.parse(e.data);if(!v.id)return;const p=pending.get(v.id);if(!p)return;pending.delete(v.id);v.error?p.reject(Error(v.error.message)):p.resolve(v.result);};
const cmd=(method,params={},sid)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error("Timeout "+method));}},20000);});
const target=(await cmd("Target.createTarget",{url:"about:blank"})).targetId;
const sid=(await cmd("Target.attachToTarget",{targetId:target,flatten:true})).sessionId;
const page=(method,params={})=>cmd(method,params,sid);
await page("Page.enable");await page("Runtime.enable");
await cmd("Browser.grantPermissions",{origin:base,permissions:["clipboardReadWrite","clipboardSanitizedWrite"]});
const evaluate=async expression=>{const r=await page("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error("Page evaluate failed: "+JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=async (expression,name)=>{for(let i=0;i<80;i++){if(await evaluate(expression).catch(()=>false))return;await sleep(250);}throw Error("Missing UI: "+name);};
const results={source:"Actual Next.js production build",url:base+"/ui-lab/session-c",captures:[],checks:[]};
try{
 await page("Page.navigate",{url:results.url});
 await wait("!!document.querySelector('[data-reader-block=lesson]')","lesson");
 await sleep(1000);
 for(const width of [1440,768,390]){
   await page("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:900,deviceScaleFactor:1,mobile:false});
   await sleep(320);
   const info=await evaluate("({scroll:document.documentElement.scrollWidth,client:window.innerWidth,title:document.querySelector('[data-reader-block=lesson] h1')?.textContent})");
   if(info.scroll>width+2)throw Error("Horizontal overflow: "+width+" => "+info.scroll);
   const shot=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
   const file="nextjs-session-c-"+width+".png";
   await writeFile(root+"/"+file,Buffer.from(shot.data,"base64"));
   results.captures.push({width,file,...info});
 }
 await page("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='复制')||{}).click?.()");
 await wait("[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('复制'))","copy feedback");
 const copied=await evaluate("navigator.clipboard.readText().then(x=>x.includes('class Stack'))");
 if(!copied)throw Error("Actual clipboard did not receive code");
 results.checks.push("copy writes code to clipboard");
 await evaluate("([...document.querySelectorAll('button[aria-label^=\"查看引用\"]')][0]||{}).click?.()");
 await wait("!!document.querySelector('[data-citation-id]')","citation detail");
 results.checks.push("citation selection");
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='正常')||{}).click?.()");
 await wait("document.querySelector('.pp-root')?.getAttribute('data-density')==='normal'","density");
 results.checks.push("density mode");
 await evaluate("([...document.querySelectorAll('button[aria-expanded]')].find(b=>b.textContent.includes('第 4 章'))||{}).click?.()");
 await wait("[...document.querySelectorAll('button[aria-expanded]')].some(b=>b.textContent.includes('第 4 章')&&b.getAttribute('aria-expanded')==='true')","expand chapter");
 await evaluate("(()=>{const b=[...document.querySelectorAll('button[aria-expanded]')].find(b=>b.textContent.includes('第 4 章'));b.parentElement.querySelector('ol button').click()})()");
 await wait("document.activeElement?.id==='s41'","chapter scroll + focus");
 results.checks.push("cross-chapter section focus and scroll");
 await writeFile(root+"/browser-results.json",JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
}finally{socket.close();chrome.kill("SIGTERM");}
