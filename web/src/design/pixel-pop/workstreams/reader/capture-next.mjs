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
   await page("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:width===768?1024:900,deviceScaleFactor:1,mobile:false});
   await sleep(320);
   const info=await evaluate("({scroll:document.documentElement.scrollWidth,client:window.innerWidth,title:document.querySelector('[data-reader-block=lesson] h1')?.textContent})");
   if(info.scroll>width+2)throw Error("Horizontal overflow: "+width+" => "+info.scroll);
   const shot=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
   const file="nextjs-session-c-"+width+".png";
   await writeFile(root+"/"+file,Buffer.from(shot.data,"base64"));
   results.captures.push({width,file,...info});
   const fold=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   await writeFile(root+"/nextjs-session-c-"+width+"-firstfold.png",Buffer.from(fold.data,"base64"));
 }
 await page("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 // Actual scrolling, not a full-page stitched screenshot, determines sticky behavior.
 const before=await evaluate("(()=>{const el=document.querySelector('[data-reader-block=outline]')?.parentElement;return {top:el?.getBoundingClientRect().top,position:el?getComputedStyle(el).position:'missing',height:document.documentElement.scrollHeight}})()");
 await evaluate("window.scrollTo({top:Math.min(840,document.documentElement.scrollHeight-innerHeight-200),behavior:'instant'})");
 await sleep(380);
 const middle=await evaluate("(()=>{const outline=document.querySelector('[data-reader-block=outline]')?.parentElement;const source=document.querySelector('[data-reader-block=citation]')?.parentElement;return {scrollY:window.scrollY,outlineTop:outline?.getBoundingClientRect().top,sourceTop:source?.getBoundingClientRect().top,outlinePosition:outline?getComputedStyle(outline).position:'missing',sourcePosition:source?getComputedStyle(source).position:'missing'}})()");
 if(middle.scrollY<200||middle.outlinePosition!=="sticky"||middle.sourcePosition!=="sticky"||
    Math.abs(middle.outlineTop-14)>9||Math.abs(middle.sourceTop-14)>9)
    throw Error("Long-scroll sticky sidebars failed: "+JSON.stringify({before,middle}));
 results.sticky={before,middle};
 const midShot=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
 await writeFile(root+"/nextjs-session-c-1440-midscroll.png",Buffer.from(midShot.data,"base64"));
 results.checks.push("real document scroll keeps both side columns sticky");
 await evaluate("window.scrollTo({top:0,behavior:'instant'})");await sleep(100);
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='复制')||{}).click?.()");
 await wait("[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('复制'))","copy feedback");
 const copied=await evaluate("navigator.clipboard.readText().then(x=>x.includes('class Stack'))");
 if(!copied)throw Error("Actual clipboard did not receive code");
 results.checks.push("copy writes code to clipboard");
 await evaluate("([...document.querySelectorAll('button[aria-label^=\"查看引用\"]')][0]||{}).click?.()");
 await wait("!!document.querySelector('[data-citation-id]')","citation detail");
 results.checks.push("citation selection");
 // Hovering a different source is temporary; pointer leave restores the clicked selection.
 const at=await evaluate("(()=>{const b=[...document.querySelectorAll('[data-reader-block=citation] ol button')][1];const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()");
 await page("Input.dispatchMouseEvent",{type:"mouseMoved",x:at.x,y:at.y});
 await wait("document.querySelector('[data-citation-id]')?.getAttribute('data-citation-id')==='cite-2'","temporary source hover");
 const hoverShot=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
 await writeFile(root+"/nextjs-session-c-1440-citation-hover.png",Buffer.from(hoverShot.data,"base64"));
 await page("Input.dispatchMouseEvent",{type:"mouseMoved",x:6,y:6});
 await wait("document.querySelector('[data-citation-id]')?.getAttribute('data-citation-id')==='cite-1'","return to selected citation");
 results.checks.push("source hover is temporary and restores selected citation");
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='正常')||{}).click?.()");
 await wait("document.querySelector('.pp-root')?.getAttribute('data-density')==='normal'","density");
 results.checks.push("density mode");
 await evaluate("([...document.querySelectorAll('button[aria-expanded]')].find(b=>b.textContent.includes('第 4 章'))||{}).click?.()");
 await wait("[...document.querySelectorAll('button[aria-expanded]')].some(b=>b.textContent.includes('第 4 章')&&b.getAttribute('aria-expanded')==='true')","expand chapter");
 await evaluate("(()=>{const b=[...document.querySelectorAll('button[aria-expanded]')].find(b=>b.textContent.includes('第 4 章'));b.parentElement.querySelector('ol button').click()})()");
 await wait("document.activeElement?.id==='s41'","chapter scroll + focus");
 results.checks.push("cross-chapter section focus and scroll");

 // Reset to the longer first chapter for mobile figure/code and overlay checks.
 await page("Page.navigate",{url:results.url});
 await wait("!!document.querySelector('[data-reader-block=lesson]')","mobile lesson");
 await page("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await sleep(400);
 const mobileMetrics=await evaluate("(()=>{const pre=document.querySelector('[data-reader-block=lesson] pre');const figure=document.querySelector('[data-reader-block=lesson] figure');const mobile=figure?.querySelector('svg:nth-of-type(2)');const labels=[...(mobile?.querySelectorAll('text')||[])].map(el=>({text:el.textContent,height:el.getBoundingClientRect().height}));return {codeFont:parseFloat(getComputedStyle(pre).fontSize),pageWidth:document.documentElement.scrollWidth,viewport:window.innerWidth,figureWidth:figure?.getBoundingClientRect().width,svgWidth:mobile?.getBoundingClientRect().width,svgLabels:labels}})()");
 if(mobileMetrics.codeFont<13||mobileMetrics.pageWidth>mobileMetrics.viewport+2||
    !mobileMetrics.svgLabels?.length||mobileMetrics.svgLabels.some(x=>x.height<12))
    throw Error("Mobile readability regression: "+JSON.stringify(mobileMetrics));
 results.mobileMetrics=mobileMetrics;
 const captureViewport=async file=>{await sleep(140);const shot=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});await writeFile(root+"/"+file,Buffer.from(shot.data,"base64"));};
 await evaluate("document.querySelector('[data-reader-block=lesson] figure')?.scrollIntoView({block:'center',behavior:'instant'})");
 await captureViewport("nextjs-session-c-390-diagram.png");
 await evaluate("document.querySelector('[data-reader-block=lesson] pre')?.scrollIntoView({block:'center',behavior:'instant'})");
 await captureViewport("nextjs-session-c-390-code.png");
 await evaluate("window.scrollTo({top:0,behavior:'instant'})");
 await evaluate("document.querySelector('[aria-controls=session-c-mobile-outline]')?.click()");
 await wait("document.querySelector('[aria-controls=session-c-mobile-outline]')?.getAttribute('aria-expanded')==='true'","mobile outline");
 await captureViewport("nextjs-session-c-390-outline.png");
 results.checks.push("mobile outline opens at reading top");
 await evaluate("([...document.querySelectorAll('#session-c-mobile-outline button')].find(b=>b.textContent.includes('3.3'))||{}).click?.()");
 await wait("document.activeElement?.id==='s33'","mobile chapter target focus");
 await sleep(180);
 const mobileAnchorTop=await evaluate("document.getElementById('s33')?.getBoundingClientRect().top");
 if(mobileAnchorTop<70||mobileAnchorTop>200)throw Error("Mobile anchor hidden by sticky toolbar: "+mobileAnchorTop);
 results.mobileAnchorTop=mobileAnchorTop;
 await captureViewport("nextjs-session-c-390-chapter-focus.png");
 results.checks.push("mobile chapter scrolls to visible focus below sticky controls");
 await evaluate("document.querySelector('[data-reader-block=lesson] button[aria-label^=\"查看引用\"]')?.click()");
 await wait("!![...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))","mobile citation panel");
 await captureViewport("nextjs-session-c-390-citation.png");
 results.checks.push("mobile citation opens readable panel");
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))?.click()");
 await wait("![...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))","mobile source closes");
 results.checks.push("mobile source panel dismisses without resetting chapter");

 await writeFile(root+"/browser-results.json",JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
}finally{socket.close();chrome.kill("SIGTERM");}
