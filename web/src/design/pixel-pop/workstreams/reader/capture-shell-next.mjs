// Chromium CDP screenshot harness for the actual built Next.js route; Node 22 only.
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
const base=process.env.SESSION_C_BASE||"http://127.0.0.1:3100";
const root="test-artifacts/session-c-integrated";
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

const results={source:"A Shell + C Reader actual Next.js 16 production build",url:base+"/ui-lab/session-c",captures:[],checks:[]};
const capture=async file=>{const s=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});await writeFile(root+"/"+file,Buffer.from(s.data,"base64"));};
try{
 await page("Page.navigate",{url:results.url});
 await wait("!!document.querySelector('[data-integration-surface=reader] [data-session-c-embedded=true]')","A Shell composition");
 await wait("!!document.querySelector('[data-reader-block=lesson]')","C lesson");
 await sleep(850);
 const shell=await evaluate("({brand:!!document.querySelector('header a[aria-label=\"知序 Learning Hub 首页\"]'),nav:!!document.querySelector('[aria-label=\"学习中心侧边导航\"]'),outline:!!document.querySelector('[data-reader-block=outline]'),citations:!!document.querySelector('[data-reader-block=citation]'),roots:document.querySelectorAll('.pp-root').length,headers:document.querySelectorAll('[data-session-c-embedded] header').length})");
 if(!shell.brand||!shell.nav||!shell.outline||!shell.citations||shell.roots!==1||shell.headers!==0)throw Error("A+C shell wiring regression "+JSON.stringify(shell));
 results.shell=shell;
 results.checks.push("A shared BrandHeader SidebarNav BreadcrumbTrail and single density root wrap all three C blocks");
 for(const width of [1440,768,390]){
   const height=width===1440?900:width===768?1024:844;
   await page("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
   await sleep(400);
   const metrics=await evaluate("(()=>{const l=document.querySelector('[data-reader-block=lesson]');const p=l.querySelector('p');const code=l.querySelector('pre');const v=document.querySelector('.pp-root');return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,lessonWidth:l.getBoundingClientRect().width,paragraphFont:parseFloat(getComputedStyle(p).fontSize),codeFont:parseFloat(getComputedStyle(code).fontSize),density:v.dataset.density}})()");
   if(metrics.scrollWidth>width+2||metrics.lessonWidth<260||metrics.codeFont<13)throw Error("Viewport regression "+JSON.stringify({width,metrics}));
   await capture("integrated-"+width+"-firstfold.png");
   const full=await page("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
   await writeFile(root+"/integrated-"+width+"-full.png",Buffer.from(full.data,"base64"));
   results.captures.push({width,height,...metrics});
 }
 await page("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate("window.scrollTo({top:Math.min(840,document.documentElement.scrollHeight-innerHeight-200),behavior:'instant'})");
 await sleep(340);
 const sticky=await evaluate("(()=>{const a=document.querySelector('[data-integrated-reader-sidebar]');return {y:window.scrollY,top:a?.getBoundingClientRect().top,position:getComputedStyle(a).position,scrollHeight:a?.scrollHeight,clientHeight:a?.clientHeight,hasSource:!!a?.querySelector('[data-reader-block=citation]')}})()");
 if(sticky.y<200||sticky.position!=="sticky"||Math.abs(sticky.top-14)>14||!sticky.hasSource)throw Error("A shell sticky regression "+JSON.stringify(sticky));
 results.sticky=sticky;
 await capture("integrated-1440-midscroll.png");
 await evaluate("window.scrollTo({top:0,behavior:'instant'})");await sleep(180);
 // Real clipboard write then real clipboard read, not just the copied-button label.
 await evaluate("([...document.querySelectorAll('[data-reader-block=lesson] button')].find(b=>b.textContent.trim()==='复制')||{}).click?.()");
 await wait("[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('代码已复制'))","real code copy");
 const copied=await evaluate("navigator.clipboard.readText().then(x=>x.includes('class Stack'))");
 if(!copied)throw Error("Clipboard regression");
 results.checks.push("code copy writes real Python class to clipboard");
 // Citation click, hover preview, and demo source should never create a fabricated Feishu link.
 await evaluate("([...document.querySelectorAll('[data-reader-block=lesson] button[aria-label^=\"查看引用\"]')][0]||{}).click?.()");
 await wait("document.querySelector('[data-citation-id]')?.getAttribute('data-citation-id')==='cite-1'","source selection");
 const prov=await evaluate("({demo:document.querySelector('[data-reader-block=citation] [data-kind=demo]')?.textContent,link:!!document.querySelector('[data-reader-block=citation] a[target=_blank]')})");
 if(!prov.demo?.includes("合成演示")||prov.link)throw Error("Fabricated source risk "+JSON.stringify(prov));
 results.checks.push("provenance remains demo; no fabricated source link");
 const hover=await evaluate("(()=>{const b=[...document.querySelectorAll('[data-reader-block=citation] ol button')][1];b.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));return true})()");
 await wait("document.querySelector('[data-citation-id]')?.getAttribute('data-citation-id')==='cite-2'","citation hover");
 await evaluate("(()=>{const b=[...document.querySelectorAll('[data-reader-block=citation] ol button')][1];b.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}))})()");
 await wait("document.querySelector('[data-citation-id]')?.getAttribute('data-citation-id')==='cite-1'","citation hover revert");
 results.checks.push("source hover previews temporarily, then restores selected citation");
 // Use Session A's controlled density switch, not an invented C toggle.
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.includes('页面密度'))||{}).click?.()");
 await wait("!!document.querySelector('[role=radiogroup] [role=radio]')","A density menu");
 await evaluate("([...document.querySelectorAll('[role=radiogroup] [role=radio]')].find(b=>b.textContent.includes('正常'))||{}).click?.()");
 await wait("document.querySelector('.pp-root')?.dataset.density==='normal'","A shared density changes root");
 results.checks.push("A density changes the only .pp-root");
 const toggle=await evaluate("(()=>{const b=[...document.querySelectorAll('[data-reader-block=outline] button[aria-expanded]')].find(x=>x.textContent.includes('第 4 章'));if(!b)return false;b.click();b.parentElement.querySelector('ol button')?.click();return true})()");
 if(!toggle)throw Error("Chapter 4 navigation not found");
 await wait("document.activeElement?.id==='s41'","cross-chapter focus");
 results.checks.push("desktop chapter navigation focus remains operational");
 // Fresh route for phone, so viewport layout and state are not affected by desktop interactions.
 await page("Page.navigate",{url:results.url});
 await wait("!!document.querySelector('[data-session-c-embedded=true]')","reset mobile route");
 await page("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await sleep(420);
 const phone=await evaluate("(()=>{const pre=document.querySelector('[data-reader-block=lesson] pre');const svg=document.querySelector('[data-reader-block=lesson] figure svg:nth-of-type(2)');return {codeFont:parseFloat(getComputedStyle(pre).fontSize),svgWidth:svg?.getBoundingClientRect().width,textHeights:[...(svg?.querySelectorAll('text')||[])].map(x=>x.getBoundingClientRect().height),pageWidth:document.documentElement.scrollWidth}})()");
 if(phone.codeFont<13||phone.pageWidth>392||phone.svgWidth<225||phone.textHeights.some(h=>h<12))throw Error("Phone code or SVG unreadable "+JSON.stringify(phone));
 results.phone=phone;
 await evaluate("document.querySelector('[data-reader-block=lesson] figure')?.scrollIntoView({block:'center',behavior:'instant'})");
 await capture("integrated-390-diagram.png");
 await evaluate("document.querySelector('[data-reader-block=lesson] pre')?.scrollIntoView({block:'center',behavior:'instant'})");
 await capture("integrated-390-code.png");
 await evaluate("window.scrollTo({top:0,behavior:'instant'})");await sleep(130);
 // A mobile navigation and C mobile outline are separate, both usable.
 await evaluate("document.querySelector('button[aria-label=\"打开侧边导航\"]')?.click()");
 await wait("document.querySelector('[data-mobile-open=true]')!==null","A mobile shell nav");
 await page("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
 await wait("document.querySelector('[data-mobile-open=true]')===null","close A drawer on Escape");
 results.checks.push("A mobile navigation opens and Escape closes");
 await evaluate("document.querySelector('[aria-controls=session-c-mobile-outline]')?.click()");
 await wait("document.querySelector('[aria-controls=session-c-mobile-outline]')?.getAttribute('aria-expanded')==='true'","C mobile outline");
 await capture("integrated-390-outline.png");
 await evaluate("([...document.querySelectorAll('#session-c-mobile-outline button')].find(b=>b.textContent.includes('3.3'))||{}).click?.()");
 await wait("document.activeElement?.id==='s33'","mobile section focus");
 await sleep(150);
 const anchor=await evaluate("document.getElementById('s33')?.getBoundingClientRect().top");
 if(anchor<70||anchor>230)throw Error("Mobile anchor hidden or misplaced "+anchor);
 results.mobileAnchorTop=anchor;
 await capture("integrated-390-chapter-focus.png");
 results.checks.push("C mobile section remains visible below sticky controls");
 await evaluate("([...document.querySelectorAll('[data-reader-block=lesson] button[aria-label^=\"查看引用\"]')][0]||{}).click?.()");
 await wait("!![...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))","C phone source panel");
 await capture("integrated-390-citation.png");
 await evaluate("([...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))||{}).click?.()");
 await wait("![...document.querySelectorAll('button')].find(b=>b.textContent.includes('关闭来源'))","close C phone source");
 results.checks.push("C phone source opens, shows provenance, closes");
 await writeFile(root+"/browser-results.json",JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
}finally{socket.close();chrome.kill("SIGTERM");}
