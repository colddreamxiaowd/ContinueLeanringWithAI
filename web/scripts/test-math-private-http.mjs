#!/usr/bin/env node
// Real Next.js HTTP routes and synthetic in-memory Supabase stand-in.
// Two distinct fake users exercise server-side owner filters and re-grading.
import {createServer} from "node:http";
import {spawn} from "node:child_process";
const host="127.0.0.1",supabasePort=3456,app="http://127.0.0.1:3001";
const ids={A:"11111111-1111-4111-8111-111111111111",B:"22222222-2222-4222-8222-222222222222"};
const records=new Map();
function respond(res,status,payload){
 res.writeHead(status,{"content-type":"application/json"});res.end(JSON.stringify(payload));
}
const mock=createServer(async(req,res)=>{
 const url=new URL(req.url||"/","http://127.0.0.1:3456");
 let body="";for await(const item of req)body+=item;
 if(url.pathname==="/auth/v1/user"){
  const token=req.headers.authorization;
  return token==="Bearer fake-a"?respond(res,200,{id:ids.A,email:"a@invalid.example"}):
    token==="Bearer fake-b"?respond(res,200,{id:ids.B,email:"b@invalid.example"}):
    respond(res,401,{error:"bad-session"});
 }
 if(url.pathname==="/rest/v1/learning_exploration_events"){
  if(req.method==="GET"){
   const user=url.searchParams.get("user_id")?.replace("eq.","");
   const rows=[...records.values()].filter(x=>x.user_id===user).sort((x,y)=>x.created_at.localeCompare(y.created_at));
   return respond(res,200,rows);
  }
  if(req.method==="POST"){
   const row=JSON.parse(body);
   const key=row.user_id+"/"+row.client_event_id;
   if(!records.has(key))records.set(key,{...row,id:"synthetic-"+records.size,created_at:new Date().toISOString()});
   return respond(res,201,null);
  }
 }
 return respond(res,404,{path:url.pathname,method:req.method});
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await new Promise(resolve=>mock.listen(supabasePort,host,resolve));
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname",host,"--port","3001"],{
 cwd:process.cwd(),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:3456",
 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"synthetic-publishable-key",
 SUPABASE_SECRET_KEY:"sb_secret_synthetic_only"},stdio:["ignore","pipe","pipe"]});
let stderr="";
server.stderr.on("data",x=>{stderr=(stderr+String(x)).slice(-3000);});
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const call=async(user,method="GET",event=null)=>fetch(app+"/api/learning/math-events",{
 method,headers:{"Content-Type":"application/json",...(user?{Cookie:"clai_access_token="+user}:{})},
 ...(event?{body:JSON.stringify(event)}:{})
});
try{
 let ready=false;for(let i=0;i<70;i++){
  if(server.exitCode!==null)throw Error("Next exited "+stderr);
  const r=await fetch(app+"/ui-lab/math/").catch(()=>null);
  if(r?.status===200){ready=true;break;}await delay(350);
 }
 check(ready,"Next.js did not serve /ui-lab/math "+stderr);
 check((await call(null)).status===401,"anonymous history should be 401");
 const event={clientEventId:"unique-attempt-a-001",activityId:"math-conditional-v1",
   kind:"attempt-submitted",payload:{stage:"draw",params:{red:3,blue:2},
   answer:"1/3",result:"correct",note:"我猜了错误答案"}};
 let response=await call("fake-a","POST",event);
 check(response.status===201,"A cannot POST math attempt: "+response.status);
 response=await call("fake-a","POST",event);
 check(response.status===201,"idempotent replay failed");
 const a=await (await call("fake-a")).json();
 check(a.events?.length===1,"A must have exactly one idempotent event");
 check(a.events[0].payload.result==="incorrect","server failed to rejudge false client success");
 const b=await (await call("fake-b")).json();
 check(b.events?.length===0,"B saw another user's math history");
 const note={clientEventId:"unique-note-a-0001",activityId:"math-conditional-v1",kind:"note-saved",
  payload:{stage:"screen",params:{prevalence:2,sensitivity:90,falsePositive:8},
   body:"我的开放式思路尚未验证",verification:"unverified"}};
 response=await call("fake-a","POST",note);
 check(response.status===201,"A cannot save note");
 const saved=await (await call("fake-a")).json();
 check(saved.events.length===2&&saved.events[1].payload.verification==="unverified",
  "Original solution must stay unverified");
 const corrupted={...note,clientEventId:"unique-note-a-0002",
    payload:{...note.payload,verification:"verified"}};
 check((await call("fake-a","POST",corrupted)).status===400,"untrusted claimed verification accepted");
 const privatePage=await fetch(app+"/learn/math/",{headers:{Cookie:"clai_access_token=fake-a"}});
 check(privatePage.status===200,"A private math page failed: "+privatePage.status);
 const without=await fetch(app+"/learn/math/",{redirect:"manual"});
 check(without.status===307||without.status===308,"unauthenticated private math must redirect");
 console.log(JSON.stringify({pass:true,sample:"SYNTHETIC two-account HTTP",
   ownedEventsA:saved.events.length,ownedEventsB:b.events.length,
   authoritativeRegrade:a.events[0].payload.result,privatePageHTTP:privatePage.status}));
}finally{
 server.kill("SIGTERM");mock.closeAllConnections();mock.close();await delay(350);
}
