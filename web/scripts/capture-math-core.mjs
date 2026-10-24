#!/usr/bin/env node
// Actual Chrome/CDP automation for self-guided learning on local workerd.
// No mocked DOM or screenshot substituted for browser interaction.
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join} from "node:path";
const origin=process.env.ZHIXU_PREVIEW_ORIGIN||"http://127.0.0.1:3001";
const out=resolve(process.env.ZHIXU_PREVIEW_OUT||"../math-workbench-preview");
const port=9278;
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"math-ci-"));
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--remote-allow-origins=*","--remote-debugging-port="+port,
 "--user-data-dir="+profile,"--window-size=1440,900","about:blank"
],{stdio:["ignore","ignore","pipe"]});
let stderr="";
chrome.stderr.on("data",chunk=>{stderr=(stderr+String(chunk)).slice(-2000);});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket;
try{
 let wsUrl;
 for(let i=0;i<140&&!wsUrl;i++){
  const res=await fetch("http://127.0.0.1:"+port+"/json/list").catch(()=>null);
  if(res?.ok)wsUrl=(await res.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl;
  if(!wsUrl)await delay(200);
 }
 if(!wsUrl)throw Error("Chrome CDP not ready "+stderr);
 socket=new WebSocket(wsUrl);
 await new Promise((ok,fail)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",fail,{once:true});});
 let seq=0;const queue=new Map();
 socket.addEventListener("message",event=>{const payload=JSON.parse(event.data);
  if(queue.has(payload.id)){const [resolve,reject]=queue.get(payload.id);queue.delete(payload.id);
   payload.error?reject(Error(payload.error.message)):resolve(payload.result);}
 });
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;
   queue.set(id,[resolve,reject]);socket.send(JSON.stringify({id,method,params}));});
 const js=async(source)=>{const r=await cmd("Runtime.evaluate",{expression:source,awaitPromise:true,returnByValue:true});
   if(r.exceptionDetails)throw Error("Browser exception "+JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const until=async(expression)=>{for(let i=0;i<80;i++){if(await js(expression).catch(()=>false))return;await delay(180);}
  throw Error("Browser assertion timed out: "+expression);};
 const click=async(selector)=>{const v=await js("(()=>{const x=document.querySelector("+JSON.stringify(selector)+");if(!x)return false;x.click();return true})()");
  if(!v)throw Error("No click target: "+selector);await delay(130);};
 const button=async(label)=>{const v=await js("(()=>{const x=[...document.querySelectorAll('button')].find(x=>x.textContent.includes("+JSON.stringify(label)+"));if(!x)return false;x.click();return true})()");
  if(!v)throw Error("Button absent: "+label);await delay(130);};
 const type=async(selector,value)=>{const success=await js("(()=>{const x=document.querySelector("+JSON.stringify(selector)+");if(!x)return false;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(x,"+JSON.stringify(value)+");x.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  if(!success)throw Error("input missing "+selector);};
 await cmd("Page.enable");await cmd("Runtime.enable");
 const results=[];
 for(const [name,w,h] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
   await cmd("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
   await cmd("Page.navigate",{url:origin+"/ui-lab/math/"});
   await until("!!document.querySelector('[data-math-workbench]')&&document.querySelector('[data-shell-ready]')?.dataset.shellReady==='true'");
   const initial=await js("({h:document.querySelector('[data-math-workbench] h2')?.textContent,scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth})");
   if(initial.scroll>initial.width+3)throw Error("Math horizontal overflow: "+JSON.stringify(initial));
   await click('button[aria-pressed="false"][type="button"]'); // select guided mode (first unpressed)
   await button("独立挑战");
   await type("#math-probability-answer","1/3");
   await button("验证我的答案");
   await until("!!document.querySelector('[class*=feedback]')");
   await type("#math-probability-answer","1/2");
   await button("验证我的答案");
   await until("document.body.textContent.includes('计算通过')");
   await button("进入不同结构的迁移挑战");
   await until("document.querySelector('[data-math-stage]')?.dataset.mathStage==='screen'");
   await type("#math-probability-answer","45/241");
   await button("验证我的答案");
   await until("document.body.textContent.includes('计算通过')");
   const layout=await cmd("Page.getLayoutMetrics");
   const shot=await cmd("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
     clip:{x:0,y:0,width:w,height:Math.min(Math.ceil(layout.cssContentSize.height),10000),scale:1}});
   const file="math-workbench-"+name+"-"+w+".png";
   writeFileSync(join(out,file),Buffer.from(shot.data,"base64"));
   await cmd("Page.reload",{ignoreCache:false});
   await until("document.querySelector('[data-math-stage]')?.dataset.mathStage==='screen'&&document.querySelector('#math-probability-answer')?.value==='45/241'");
   const metrics=await js("({stage:document.querySelector('[data-math-stage]')?.dataset.mathStage,attempts:document.body.textContent.includes('2 次尝试'),scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth})");
   if(metrics.scroll>metrics.width+3)throw Error("Post-refresh overflow");
   results.push({name,w,pass:true,file,metrics});
   console.log(JSON.stringify({name,w,pass:true,file,metrics}));
 }
 writeFileSync(join(out,"math-browser-results.json"),JSON.stringify({origin,results},null,2));
}finally{
 socket?.close();chrome.kill("SIGTERM");
 await delay(450);try{rmSync(profile,{recursive:true,force:true});}catch{}
}
