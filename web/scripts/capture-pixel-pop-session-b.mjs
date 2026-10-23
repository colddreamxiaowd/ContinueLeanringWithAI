#!/usr/bin/env node
/** Capture real Next.js/Chromium Session B page at desktop/tablet/mobile widths.
 * Uses Chrome's CDP and Node 22's built-in WebSocket. No browser npm dependency.
 */
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

const binary=process.env.CHROME_BIN||"google-chrome";
const origin=process.env.PREVIEW_URL||"http://127.0.0.1:3001/ui-lab/session-b";
const folder=resolve(process.env.PREVIEW_OUT||"ui-preview-b");
mkdirSync(folder,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"pixel-pop-cdp-"));
const chrome=spawn(binary,[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--hide-scrollbars","--remote-allow-origins=*",
 "--remote-debugging-port=9223","--user-data-dir="+profile,
 "--window-size=1440,900","about:blank"
],{stdio:"ignore"});
let socket;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function waitChrome(){
 for(let i=0;i<60;i++){
  if(chrome.exitCode!==null)throw Error("Chrome exited: "+chrome.exitCode);
  try{
   const r=await fetch("http://127.0.0.1:9223/json/list");
   if(r.ok){const pages=await r.json();const page=pages.find(p=>p.type==="page");
    if(page?.webSocketDebuggerUrl)return page.webSocketDebuggerUrl;}
  }catch{}
  await delay(200);
 }
 throw Error("Chrome debugging endpoint never appeared");
}

try{
 const url=await waitChrome();
 socket=new WebSocket(url);
 await new Promise((resolve,reject)=>{
  socket.addEventListener("open",resolve,{once:true});
  socket.addEventListener("error",reject,{once:true});
 });
 let serial=0;
 const pending=new Map();
 socket.addEventListener("message",event=>{
  const msg=JSON.parse(event.data);
  if(msg.id&&pending.has(msg.id)){
   const [resolve,reject]=pending.get(msg.id);pending.delete(msg.id);
   msg.error?reject(Error(msg.error.message)):resolve(msg.result);
  }
 });
 function send(method,params={}){
  const id=++serial;
  return new Promise((resolve,reject)=>{
   pending.set(id,[resolve,reject]);
   socket.send(JSON.stringify({id,method,params}));
  });
 }
 await send("Page.enable");
 await send("Runtime.enable");
 const outputs=[];
 for(const [name,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await send("Emulation.setDeviceMetricsOverride",{
    width,height,deviceScaleFactor:1,mobile:width<600
  });
  await send("Page.navigate",{url:origin});
  await delay(2300);
  const evalResult=await send("Runtime.evaluate",{
   expression:"({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,height:document.documentElement.scrollHeight,title:document.title,cardCount:document.querySelectorAll('.pp-panel').length,root:!!document.querySelector('.pp-root')})",
   returnByValue:true
  });
  const check=evalResult.result.value;
  if(!check?.root||check.cardCount<3)throw Error("Expected real B Demo not rendered at "+name+": "+JSON.stringify(check));
  if(check.width>check.viewport+3)throw Error("Horizontal overflow at "+name+": "+JSON.stringify(check));
  const dimensions=await send("Page.getLayoutMetrics");
  const contentHeight=Math.min(19000,Math.ceil(dimensions.cssContentSize.height));
  const screenshot=await send("Page.captureScreenshot",{
    format:"png",fromSurface:true,captureBeyondViewport:true,
    clip:{x:0,y:0,width,height:contentHeight,scale:1}
  });
  const filename=join(folder,"session-b-"+name+"-"+width+".png");
  writeFileSync(filename,Buffer.from(screenshot.data,"base64"));
  outputs.push({name,width,viewportHeight:height,capturedHeight:contentHeight,...check,file:filename});
  console.log(JSON.stringify(outputs.at(-1)));
 }
 writeFileSync(join(folder,"results.json"),JSON.stringify({origin,outputs},null,2));
}finally{
 if(socket)socket.close();
 chrome.kill("SIGTERM");
 rmSync(profile,{recursive:true,force:true});
}
