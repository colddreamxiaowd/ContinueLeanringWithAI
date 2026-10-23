#!/usr/bin/env node
/** Capture real Next.js/Chromium Session B page at desktop/tablet/mobile widths.
 * Uses Chrome's CDP and Node 22's built-in WebSocket. No browser npm dependency.
 */
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

const binary=process.env.CHROME_BIN||"google-chrome";
const origin=process.env.PREVIEW_URL||"http://127.0.0.1:3001/ui-lab/session-d";
const folder=resolve(process.env.PREVIEW_OUT||"ui-preview-d");
mkdirSync(folder,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"pixel-pop-d-cdp-"));
const chrome=spawn(binary,[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--hide-scrollbars","--remote-allow-origins=*",
 "--remote-debugging-port=9234","--user-data-dir="+profile,
 "--window-size=1440,900","about:blank"
],{stdio:"ignore"});
let socket;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function waitChrome(){
 for(let i=0;i<60;i++){
  if(chrome.exitCode!==null)throw Error("Chrome exited: "+chrome.exitCode);
  try{
   const r=await fetch("http://127.0.0.1:9234/json/list");
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
   expression:`({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,height:document.documentElement.scrollHeight,title:document.title,cardCount:document.querySelectorAll('section').length,lab:!!document.querySelector('[aria-label="可交互的栈操作实验"]'),quiz:!!document.querySelector('section[aria-label="单选题"]'),root:!!document.querySelector('.pp-root')})`,
   returnByValue:true
  });
  const check=evalResult.result.value;
  if(!check?.root||!check.lab||!check.quiz||check.cardCount<4)throw Error("Expected real D Demo not rendered at "+name+": "+JSON.stringify(check));
  if(check.width>check.viewport+3)throw Error("Horizontal overflow at "+name+": "+JSON.stringify(check));
  const dimensions=await send("Page.getLayoutMetrics");
  const contentHeight=Math.min(19000,Math.ceil(dimensions.cssContentSize.height));
  if(name==="mobile"&&contentHeight>=3800)throw Error("Mobile presentation is still too long: "+contentHeight+"px (before: 4565px)");
  const screenshot=await send("Page.captureScreenshot",{
    format:"png",fromSurface:true,captureBeyondViewport:true,
    clip:{x:0,y:0,width,height:contentHeight,scale:1}
  });
  const filename=join(folder,"session-d-"+name+"-"+width+".png");
  writeFileSync(filename,Buffer.from(screenshot.data,"base64"));
  outputs.push({name,width,viewportHeight:height,capturedHeight:contentHeight,...check,file:filename});
  console.log(JSON.stringify(outputs.at(-1)));

  // Test the actual React event handlers inside a real Next.js browser page.
  async function assess(expression){
    const result=await send("Runtime.evaluate",{expression,returnByValue:true});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  const pushClicked=await assess(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Push 入栈'));if(!b)return false;b.click();return true})()`);
  if(!pushClicked)throw Error("Push button missing in "+name);
  await delay(470);
  const pushed=await assess(`({status:document.querySelector('[aria-label=\"可交互的栈操作实验\"] [role=\"status\"]')?.textContent,history:document.querySelectorAll('[aria-label=\"栈操作历史\"] li').length})`);
  if(!pushed.status.includes("栈顶 7")||pushed.history!==1)throw Error("Push failed "+JSON.stringify(pushed));
  if(name==="mobile"){
    const state=await assess(`(()=>{
      const live=document.querySelector('[aria-label="当前栈实时视图"]');
      const timeline=document.getElementById('learning-stack-timeline');
      const log=document.querySelector('[aria-label="栈操作历史"]');
      const gallery=[...document.querySelectorAll('section[aria-label="重试状态"],section[aria-label="正确答案"],section[aria-label="答案错误"]')];
      const picker=[...document.querySelectorAll('button')].filter(x=>x.textContent.includes('✓ 正确')||x.textContent.includes('× 错误')||x.textContent.includes('↻ 重试'));
      return {live:!!live&&getComputedStyle(live).display!=='none',
        timelineHidden:getComputedStyle(timeline).display==='none',
        logHidden:getComputedStyle(log).display==='none',
        galleries:gallery.filter(x=>x.getClientRects().length>0).length,
        picker:picker.length};
    })()`);
    if(!state.live||!state.timelineHidden||!state.logHidden||state.galleries!==1||state.picker!==3)
      throw Error("Mobile compact default is invalid "+JSON.stringify(state));
    const pic=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-mobile-push-live.png"),Buffer.from(pic.data,"base64"));
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('查看四步回放与操作日志'))).click()`);
    await delay(160);
    const expanded=await assess(`({
      steps:document.querySelector('#learning-stack-timeline')?.getClientRects().length,
      log:document.querySelector('[aria-label="栈操作历史"]')?.getClientRects().length,
      count:document.querySelectorAll('[aria-label="栈操作历史"] li').length
    })`);
    if(!expanded.steps||!expanded.log||expanded.count!==1)
      throw Error("Real history disclosure broken: "+JSON.stringify(expanded));
    const historyPic=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-mobile-history-open.png"),Buffer.from(historyPic.data,"base64"));
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('收起四步回放与日志'))).click()`);
    await delay(100);
    const closed=await assess(`getComputedStyle(document.querySelector('#learning-stack-timeline')).display==='none'`);
    if(!closed)throw Error("Timeline must close without losing current stack");
  }

  if(name==="desktop"){
    const afterPush=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-desktop-push.png"),Buffer.from(afterPush.data,"base64"));
  }
  await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('Pop 出栈'))).click()`);
  await delay(160);
  const popped=await assess(`({status:document.querySelector('[aria-label=\"可交互的栈操作实验\"] [role=\"status\"]')?.textContent,history:document.querySelectorAll('[aria-label=\"栈操作历史\"] li').length})`);
  if(!popped.status.includes("栈已空")||popped.history!==2)throw Error("Pop failed "+JSON.stringify(popped));
  if(name==="desktop"){
    const afterPop=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-desktop-pop.png"),Buffer.from(afterPop.data,"base64"));
  }
  await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('Pop 出栈'))).click()`);
  await delay(100);
  const empty=await assess(`({status:document.querySelector('[aria-label=\"可交互的栈操作实验\"] [role=\"status\"]')?.textContent,history:document.querySelectorAll('[aria-label=\"栈操作历史\"] li').length})`);
  if(!empty.status.includes("空栈")||empty.history!==2)throw Error("Empty Pop failed "+JSON.stringify(empty));
  await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('重置'))).click()`);
  await delay(100);
  const reset=await assess(`document.querySelectorAll('[aria-label=\"栈操作历史\"] li').length`);
  if(reset!==0)throw Error("Reset history failed");
  if(name==="mobile"){
    for(let k=0;k<6;k++){
      await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('Push 入栈'))).click()`);
      await delay(60);
    }
    const full=await assess(`document.querySelectorAll('[aria-label="栈操作历史"] li').length`);
    if(full!==6)throw Error("Capacity test setup failed: "+full);
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('Push 入栈'))).click()`);
    await delay(120);
    const blocked=await assess(`({
      text:document.querySelector('[aria-label="可交互的栈操作实验"] [role="status"]')?.textContent,
      count:document.querySelectorAll('[aria-label="栈操作历史"] li').length
    })`);
    if(!blocked.text.includes("栈已满")||blocked.count!==6)throw Error("Full-stack boundary regression "+JSON.stringify(blocked));
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('查看四步回放与操作日志'))).click()`);
    await delay(110);
    const visualStages=await assess(`document.querySelectorAll('#learning-stack-timeline > div').length`);
    if(visualStages!==4)throw Error("Expected four real operation stages, found "+visualStages);
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('重置'))).click()`);
    await delay(100);
  }

  await assess(`document.querySelector('section[aria-label=\"单选题\"] button[aria-label^=\"A，\"]').click()`);
  await delay(120);
  const wrong=await assess(`!!document.querySelector('section[aria-label=\"单选题\"] [aria-label=\"答案错误\"]')`);
  if(!wrong)throw Error("Wrong feedback missing");
  if(name==="desktop"){
    const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-desktop-quiz-wrong.png"),Buffer.from(image.data,"base64"));
  }
  await assess(`([...document.querySelectorAll('section[aria-label=\"单选题\"] button')].find(x=>x.textContent.includes('重新作答'))).click()`);
  await delay(110);
  const retried=await assess(`document.querySelector('section[aria-label=\"单选题\"]')?.textContent.includes('第 2 次尝试')`);
  if(!retried)throw Error("Retry count missing");
  await assess(`document.querySelector('section[aria-label=\"单选题\"] button[aria-label^=\"D，\"]').click()`);
  await delay(110);
  const correct=await assess(`!!document.querySelector('section[aria-label=\"单选题\"] [aria-label=\"正确答案\"]')`);
  if(!correct)throw Error("Correct feedback missing");
  if(name==="desktop"){
    const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-desktop-quiz-correct.png"),Buffer.from(image.data,"base64"));
  }
  await assess(`([...document.querySelectorAll('section[aria-label=\"单选题\"] button')].find(x=>x.textContent.includes('下一题'))).click()`);
  await delay(110);
  const next=await assess(`document.querySelector('section[aria-label=\"单选题\"]')?.textContent.includes('Push(5)')`);
  if(!next)throw Error("Next question not changed");
  if(name==="mobile"){
    const panel=await assess(`(()=>{
      const buttons=[...document.querySelectorAll('button')];
      const gallery=()=>[...document.querySelectorAll('section[aria-label="正确答案"],section[aria-label="答案错误"],section[aria-label="重试状态"]')].filter(e=>e.getClientRects().length).length;
      const button=(str)=>buttons.find(b=>b.textContent.includes(str));
      button("✓ 正确").click();
      return gallery();
    })()`);
    await delay(120);
    const currentGood=await assess(`document.querySelector('.'+document.querySelector('[aria-label="正确答案"]')?.className.split(' ')[0])!==null && !!document.querySelector('[aria-label="正确答案"]')?.getClientRects().length`);
    if(panel!==1||!currentGood)throw Error("Gallery should show exactly one correct feedback state");
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('× 错误'))).click()`);
    await delay(110);
    const wrongOnly=await assess(`!!document.querySelector('[aria-label="答案错误"]')?.getClientRects().length`);
    if(!wrongOnly)throw Error("Error gallery state not visible after switch");
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('展开学习目标与建议'))).click()`);
    await delay(100);
    const goals=await assess(`!!document.querySelector('[id="session-d-mastery-goals"]')?.getClientRects().length`);
    if(!goals)throw Error("Mastery detail expansion failed");
    await assess(`([...document.querySelectorAll('button')].find(x=>x.textContent.includes('收起学习目标与建议'))).click()`);
    await delay(100);
    const goalsHidden=await assess(`!document.querySelector('[id="session-d-mastery-goals"]')?.getClientRects().length`);
    if(!goalsHidden)throw Error("Mastery details did not collapse");
  }

  outputs.at(-1).interaction={push:true,pop:true,empty:true,reset:true,wrong,retried,correct,next};

 }

 // A-owned shell + D-owned real classroom composition — separate from the component showcase.
 const classroom=[];
 for(const [name,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await send("Page.navigate",{url:"http://127.0.0.1:3001/ui-lab/session-d/learning"});
  await delay(1800);
  async function dom(expression){
    const response=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(response.exceptionDetails)throw Error("Classroom browser JS: "+JSON.stringify(response.exceptionDetails));
    return response.result.value;
  }
  const before=await dom(`(()=>{
   const root=document.querySelector('[data-integration-surface="practice"]');
   const body=document.body.textContent||"";
   const controls=[...document.querySelectorAll('[aria-label="可交互的栈操作实验"] button')];
   return {root:!!root,brand:body.includes("知序"),nav:!!document.querySelector('[aria-label="学习中心侧边导航"]'),
    crumb:!!document.querySelector('[aria-label="面包屑导航"]'),density:!!root?.dataset.density,
    devLabels:["StackPlayground","QuizCard","AnswerFeedback"].filter(s=>body.includes(s)),
    scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
    controls:controls.filter(b=>/Push 入栈|Pop 出栈|重置/.test(b.textContent||""))
      .map(b=>({text:b.textContent.trim(),width:b.getBoundingClientRect().width,
        height:b.getBoundingClientRect().height}))};
  })()`);
  if(!before.root||!before.brand||!before.nav||!before.crumb||!before.density)
    throw Error("A+D complete shell missing at "+name+": "+JSON.stringify(before));
  if(before.devLabels.length||before.scroll>before.client+3)
    throw Error("Developer labels or overflow in learning page "+name+": "+JSON.stringify(before));
  if(before.controls.length!==3||before.controls.some(b=>b.height<38||b.width<65))
    throw Error("Push/Pop/reset controls too small "+name+": "+JSON.stringify(before));
  const dimensions=await send("Page.getLayoutMetrics");
  const fullHeight=Math.min(19000,Math.ceil(dimensions.cssContentSize.height));
  const image=await send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:true,
   clip:{x:0,y:0,width,height:fullHeight,scale:1}});
  const imageName="session-d-shell-"+name+"-"+width+".png";
  writeFileSync(join(folder,imageName),Buffer.from(image.data,"base64"));
  const click=(expr)=>dom(expr);
  await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("Push 入栈"))).click()`);
  await delay(220);
  const push=await dom(`document.querySelector('[aria-label="可交互的栈操作实验"] [role="status"]')?.textContent`);
  if(!push.includes("栈顶 7"))throw Error("A+D Push failed");
  if(name==="mobile"){
    const pushPic=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
    writeFileSync(join(folder,"session-d-shell-mobile-push.png"),Buffer.from(pushPic.data,"base64"));
    await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("查看四步回放与操作日志"))).click()`);
    await delay(140);
    const expanded=await dom(`({
      history:document.querySelectorAll('[aria-label="栈操作历史"] li').length,
      expanded:document.querySelector('[aria-label="栈操作历史"]')?.getClientRects().length>0,
      top:document.querySelector('[aria-label="当前栈实时视图"]')?.textContent
    })`);
    if(expanded.history!==1||!expanded.expanded||!expanded.top.includes("7"))
      throw Error("A+D mobile history disclosure changed actual stack "+JSON.stringify(expanded));
    await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("收起四步回放与日志"))).click()`);
  }
  await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("Pop 出栈"))).click()`);
  await delay(150);
  const pop=await dom(`document.querySelector('[aria-label="可交互的栈操作实验"] [role="status"]')?.textContent`);
  if(!pop.includes("栈已空"))throw Error("A+D Pop failed");
  await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("重置"))).click()`);
  await delay(100);
  const reset=await dom(`document.querySelectorAll('[aria-label="栈操作历史"] li').length`);
  if(reset!==0)throw Error("A+D reset failed");
  await click(`document.querySelector('[aria-label="单选题"] button[aria-label^="A，"]').click()`);
  await delay(180);
  const wrong=await dom(`({
    visible:!!document.querySelector('[aria-label="单选题"] [aria-label="答案错误"]'),
    score:document.querySelector('[aria-label="当前练习表现"]')?.textContent
  })`);
  if(!wrong.visible||!wrong.score.includes("0 / 1"))throw Error("A+D wrong/score failed "+JSON.stringify(wrong));
  await click(`([...document.querySelectorAll('[aria-label="单选题"] button')].find(b=>b.textContent.includes("重新作答"))).click()`);
  await delay(100);
  await click(`document.querySelector('[aria-label="单选题"] button[aria-label^="D，"]').click()`);
  await delay(180);
  const retry=await dom(`({
    correct:!!document.querySelector('[aria-label="单选题"] [aria-label="正确答案"]'),
    score:document.querySelector('[aria-label="当前练习表现"]')?.textContent,
    attempt:(document.querySelector('[data-learning-practice]')?.textContent||"").includes("第 2 次作答")
  })`);
  if(!retry.correct||!retry.score.includes("0 / 1")||!retry.attempt)
    throw Error("A+D retry must not score twice "+JSON.stringify(retry));
  await click(`([...document.querySelectorAll('[aria-label="单选题"] button')].find(b=>b.textContent.includes("下一题"))).click()`);
  await delay(130);
  const next=await dom(`document.querySelector('[aria-label="单选题"]')?.textContent.includes("Push(5)")`);
  if(!next)throw Error("A+D next question failed");
  await click(`document.querySelector('[aria-label="单选题"] button[aria-label^="A，"]').click()`);
  await delay(130);
  const twoScore=await dom(`document.querySelector('[aria-label="当前练习表现"]')?.textContent`);
  if(!twoScore.includes("1 / 2"))throw Error("A+D scored second question incorrectly "+twoScore);
  await click(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes("返回第一题"))).click()`);
  await delay(120);
  await click(`document.querySelector('[aria-label="单选题"] button[aria-label^="D，"]').click()`);
  await delay(130);
  const backScore=await dom(`document.querySelector('[aria-label="当前练习表现"]')?.textContent`);
  if(!backScore.includes("1 / 2"))throw Error("Returning to first question duplicated score "+backScore);
  classroom.push({name,width,height:fullHeight,before,flow:{push:true,pop:true,reset:true,wrong:true,retry:true,next:true,oneRecordPerQuestion:true},image:imageName});
  console.log("PASS A+D shell "+name+" "+JSON.stringify(classroom.at(-1)));
 }
 writeFileSync(join(folder,"classroom-results.json"),JSON.stringify({route:"/ui-lab/session-d/learning",classroom},null,2));
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 const reduce=await send("Runtime.evaluate",{expression:"matchMedia(\'(prefers-reduced-motion: reduce)\').matches",returnByValue:true});
 if(!reduce.result.value)throw Error("Reduced-motion test failed");
 writeFileSync(join(folder,"results.json"),JSON.stringify({origin,reducedMotion:true,outputs},null,2));
}finally{
 if(socket)socket.close();
 chrome.kill("SIGTERM");
 // Chrome may still be flushing its profile files after SIGTERM.
 await Promise.race([new Promise(resolve=>chrome.once("exit",resolve)),delay(1800)]);
 try { rmSync(profile,{recursive:true,force:true,maxRetries:6,retryDelay:180}); }
 catch(error) { console.warn("Deferred Chrome profile cleanup:",String(error)); }
}
