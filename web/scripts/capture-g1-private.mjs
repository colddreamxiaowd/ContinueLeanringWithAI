#!/usr/bin/env node
/** Real Next.js+Chromium UI over an explicitly SYNTHETIC, in-memory Supabase HTTP stand-in.
 * Never claim this as a live user/database/Feishu acceptance test.
 */
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

const origin="http://127.0.0.1:3001";
const out=resolve("../g1-private-preview");
const mockPort=3456;
const uuid="11111111-1111-4111-8111-111111111111";
const user="22222222-2222-4222-8222-222222222222";
const fixture={schemaVersion:"0.1",version:1,visibility:"private",title:"G1 合成已保存课程 · 数据结构",
 description:"此课程在本次隔离验收中通过真实 Next.js POST 进入本地内存数据库替身；非真实飞书课件。",
 sourceRefs:[{id:"src01",fileName:"合成数据结构讲义.pptx",locator:"合成第12页"}],
 chapters:[{id:"stack",title:"栈与后进先出",blocks:[
   {id:"text01",type:"explanation",markdown:"Push 把元素放入栈顶；Pop 从栈顶取出元素。",sourceRefIds:["src01"]},
   {id:"code01",type:"code",language:"python",source:"stack = [1, 2]\\nstack.append(3)"},
   {id:"sim01",type:"stack-simulator",initial:[1],capacity:6},
   {id:"quiz01",type:"quiz",prompt:"Push(1)、Push(2) 后，Pop 得到什么？",options:["1","2"],answerIndex:1,hint:"最后放入的 2 先弹出。"}
 ]}]};
let savedCourse=null, savedProgress={completedBlockIds:[],answers:{},simStacks:{}},posts=0,puts=0;
const send=(res,status,data)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data));};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url||"/","http://127.0.0.1:"+mockPort).pathname;
 let raw="";for await(const chunk of req)raw+=chunk;
 if(path==="/auth/v1/user")return req.headers.authorization==="Bearer synthetic-g1-access"
   ?send(res,200,{id:user,email:"synthetic@invalid.example"}):send(res,401,{error:"unauthorized"});
 if(path==="/rest/v1/coursepacks"){
   if(req.method==="GET")return send(res,200,savedCourse?[savedCourse]:[]);
   if(req.method==="POST"){
     const payload=JSON.parse(raw);posts++;
     savedCourse={...payload,id:uuid,pack:payload.pack,title:payload.title,pack_version:1,created_at:"2026-10-24T00:00:00.000Z"};
     return send(res,201,[{id:uuid}]);
   }
 }
 if(path==="/rest/v1/coursepack_progress"){
   if(req.method==="GET")return send(res,200,savedCourse?[{state:savedProgress}]:[]);
   if(req.method==="POST"){savedProgress=JSON.parse(raw).state;puts++;return send(res,201,[{state:savedProgress}]);}
 }
 send(res,404,{error:"unexpected synthetic request",path});
});
await new Promise(ok=>server.listen(mockPort,"127.0.0.1",ok));
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"g1-chrome-"));
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--hide-scrollbars",
 "--remote-allow-origins=*","--remote-debugging-port=9274","--user-data-dir="+profile,
 "--window-size=1440,900","about:blank"
],{stdio:"ignore"});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let ws;
const result={environment:"SYNTHETIC local Supabase HTTP stand-in (not live database/account/Feishu)",browser:"Chromium + real Next.js build",shots:[]};
try{
 let url;
 for(let i=0;i<100&&!url;i++){
   try{const r=await fetch("http://127.0.0.1:9274/json/list");
     if(r.ok)url=(await r.json()).find(v=>v.type==="page")?.webSocketDebuggerUrl;}catch{}
   if(!url)await sleep(200);
 }
 if(!url)throw Error("Chrome CDP unavailable");
 ws=new WebSocket(url);
 await new Promise((yes,no)=>{ws.addEventListener("open",yes,{once:true});ws.addEventListener("error",no,{once:true});});
 let serial=0;const pending=new Map();
 ws.addEventListener("message",e=>{const v=JSON.parse(e.data);if(pending.has(v.id)){
   const [resolve,reject]=pending.get(v.id);pending.delete(v.id);v.error?reject(Error(v.error.message)):resolve(v.result);}});
 const cmd=(method,params={})=>new Promise((yes,no)=>{const id=++serial;pending.set(id,[yes,no]);ws.send(JSON.stringify({id,method,params}));});
 const js=async(expression)=>{const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
   if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const until=async(expression,label)=>{for(let i=0;i<100;i++){
   if(await js(expression).catch(()=>false))return;await sleep(180);}
   throw Error("Timeout waiting "+label);};
 const click=async(expression)=>{const ok=await js(expression);if(!ok)throw Error("Element absent: "+expression.slice(0,130));await sleep(230);};
 const navigate=async()=>{await cmd("Page.navigate",{url:origin+"/learn/"});await until("!!document.querySelector('[data-private-course-page]')","private UI");};
 await cmd("Page.enable");await cmd("Runtime.enable");await cmd("Network.enable");
 await cmd("Network.setCookie",{name:"clai_access_token",value:"synthetic-g1-access",url:origin,httpOnly:true,path:"/"});
 await navigate();
 await until("document.querySelector('#private-course-select')!==null","private selector");
 const created=await js("(async()=>{const r=await fetch('/api/coursepacks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pack:"+JSON.stringify(fixture)+"})});return {status:r.status,payload:await r.json()}})()");
 if(created.status!==201||posts!==1)throw Error("Synthetic POST did not persist a validated CoursePack via Next.js");
 await navigate();
 await until("document.querySelector('#private-course-select option[value="+JSON.stringify(uuid)+"]')!==null","saved course in list");
 await click("(function(){const e=document.querySelector('#private-course-select');e.value="+JSON.stringify(uuid)+";e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("!!document.querySelector('[data-reader-block=lesson]')","CoursePack-adapted reader");
 await click("(function(){const x=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('标记已阅读并保存'));if(!x)return false;x.click();return true})()");
 await until("document.body.textContent.includes('学习记录已保存到当前账号')","reading progress PUT");
 await click("(function(){const x=[...document.querySelectorAll('section[aria-label=单选题] button')].find(x=>x.getAttribute('aria-label')?.startsWith('B，'));if(!x)return false;x.click();return true})()");
 await until("document.body.textContent.includes('学习记录已保存到当前账号')&&document.body.textContent.includes('回答正确')","quiz interaction");
 await click("(function(){const x=[...document.querySelectorAll('[aria-label=可交互的栈操作实验] button')].find(x=>x.textContent.includes('Push 入栈'));if(!x)return false;x.click();return true})()");
 await until("document.body.textContent.includes('当前栈：[ 1, 7 ]')","stack push state");
 await click("(function(){const x=[...document.querySelectorAll('[aria-label=可交互的栈操作实验] button')].find(x=>x.textContent.includes('Pop 出栈'));if(!x)return false;x.click();return true})()");
 await click("(function(){const x=[...document.querySelectorAll('[aria-label=可交互的栈操作实验] button')].find(x=>x.textContent.includes('重置'));if(!x)return false;x.click();return true})()");
 await sleep(1000);
 if(puts<5||JSON.stringify(savedProgress.simStacks.sim01)!=="[1]")throw Error("Serialized Push/Pop/Reset was not persisted: "+JSON.stringify({puts,stack:savedProgress.simStacks}));
 // Reload ensures the UI restores progress through GET, not React-only in-memory state.
 await navigate();
 await until("!!document.querySelector('#private-course-select option[value="+JSON.stringify(uuid)+"]')","course recovered");
 await click("(function(){const e=document.querySelector('#private-course-select');e.value="+JSON.stringify(uuid)+";e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.body.textContent.includes('服务端记录的上次答案')","quiz answer restored from GET");
 const state=await js("({heading:document.querySelector('.pp-root h2')?.textContent,source:document.body.textContent.includes('合成数据结构讲义.pptx'),progress:document.body.textContent.includes('已完成'),quiz:document.body.textContent.includes('服务端记录的上次答案'),privatePage:!!document.querySelector('[data-private-course-page]')})");
 if(!state.source||!state.quiz||!state.privatePage||!savedProgress.completedBlockIds.includes("quiz01"))throw Error("Synthetic GET reload failed: "+JSON.stringify(state));
 for(const [label,w,h] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
   await cmd("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
   await sleep(400);
   const width=await js("({scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth})");
   if(width.scrollWidth>width.viewport+3)throw Error("Horizontal overflow "+label+" "+JSON.stringify(width));
   const box=await cmd("Page.getLayoutMetrics");
   const screenshot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,fromSurface:true,
     clip:{x:0,y:0,width:w,height:Math.min(Math.ceil(box.cssContentSize.height),14000),scale:1}});
   const file="g1-private-"+label+"-"+w+".png";
   writeFileSync(join(out,file),Buffer.from(screenshot.data,"base64"));
   result.shots.push({file,width:w,height:h,scrollWidth:width.scrollWidth});
 }
 result.savedViaNextPost=posts;result.progressWritesViaNextPut=puts;result.restoredState=savedProgress;result.ui=state;
 writeFileSync(join(out,"g1-browser-results.json"),JSON.stringify(result,null,2));
 console.log(JSON.stringify({synthetic:true,pass:true,shots:result.shots,posts,puts}));
} finally {
 ws?.close();chrome.kill("SIGTERM");server.close();
 await sleep(350);
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
