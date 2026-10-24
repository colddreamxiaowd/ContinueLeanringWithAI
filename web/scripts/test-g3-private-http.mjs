#!/usr/bin/env node
// Real Next.js HTTP E2E with two synthetic Supabase users.
// Fake database exists ONLY in this ephemeral test; no real credentials.
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {demoPlanBundle} from "../src/lib/course-plan-view.mjs";
const host="127.0.0.1",dbPort=3456,app="http://127.0.0.1:3001";
const users={A:"11111111-1111-4111-8111-111111111111",B:"22222222-2222-4222-8222-222222222222"};
const familyId="33333333-3333-4333-8333-333333333333";
const bundle=demoPlanBundle();
const family={id:familyId,user_id:users.A,source_name:"私人合成测试课件.pptx",bundle,
 source_sha256:bundle.source.sha256,planner_version:bundle.plannerVersion,created_at:new Date().toISOString()};
const levels=new Map();
const respond=(res,status,data)=>{
 res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data));
};
const serverMock=createServer(async(req,res)=>{
 const url=new URL(req.url||"/",`http://${host}:${dbPort}`);
 let body="";for await(const part of req)body+=part;
 if(url.pathname==="/auth/v1/user"){
  const key=req.headers.authorization;
  return key==="Bearer fake-a"?respond(res,200,{id:users.A,email:"a@invalid.example"}):
   key==="Bearer fake-b"?respond(res,200,{id:users.B,email:"b@invalid.example"}):
   respond(res,401,{error:"invalid token"});
 }
 if(url.pathname==="/rest/v1/library_items")return respond(res,200,[]);
 if(url.pathname==="/rest/v1/course_plan_families"){
  const owner=url.searchParams.get("user_id")?.replace("eq.","");
  const id=url.searchParams.get("id")?.replace("eq.","");
  const matches=owner===users.A&&(!id||id===familyId);
  if(!matches)return respond(res,200,[]);
  return respond(res,200,[family]);
 }
 if(url.pathname==="/rest/v1/course_concept_mastery"){
  const owner=url.searchParams.get("user_id")?.replace("eq.","");
  const id=url.searchParams.get("family_id")?.replace("eq.","");
  const rows=[...levels.entries()].filter(([key])=>key.startsWith(owner+"/"+id+"/"))
    .map(([key,level])=>({concept_id:key.split("/").at(-1),level,updated_at:new Date().toISOString()}));
  return respond(res,200,rows);
 }
 if(url.pathname==="/rest/v1/rpc/record_course_concept_mastery"&&req.method==="POST"){
  const input=JSON.parse(body);
  if(input.p_user_id!==users.A||input.p_family_id!==familyId||
   !bundle.topics.some(topic=>topic.id===input.p_concept_id)||
   ![1,2].includes(input.p_level))return respond(res,400,{error:"REJECTED"});
  const key=input.p_user_id+"/"+input.p_family_id+"/"+input.p_concept_id;
  const next=Math.max(levels.get(key)||0,input.p_level);
  levels.set(key,next);
  return respond(res,200,[{saved_level:next}]);
 }
 return respond(res,404,{error:"not found",path:url.pathname});
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await new Promise(ok=>serverMock.listen(dbPort,host,ok));
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname",host,"--port","3001"],{
 cwd:process.cwd(),env:{...process.env,
  NEXT_PUBLIC_SUPABASE_URL:`http://${host}:${dbPort}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"synthetic-publishable-key",
  SUPABASE_SECRET_KEY:"sb_secret_synthetic_only"},stdio:["ignore","pipe","pipe"]});
let stderr="";
server.stderr.on("data",chunk=>stderr=(stderr+String(chunk)).slice(-2000));
const check=(condition,message)=>{if(!condition)throw Error(message);};
const call=async(path,user,method="GET",payload)=>{
 return fetch(app+path,{method,headers:{...(user?{Cookie:"clai_access_token="+user}:{}),
  ...(payload?{"Content-Type":"application/json"}:{})},redirect:"follow",
  ...(payload?{body:JSON.stringify(payload)}:{})});
};
try{
 let running=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error("Next prematurely exited "+stderr);
  const r=await fetch(app+"/ui-lab/plan-modes/").catch(()=>null);
  if(r?.ok){running=true;break;}await sleep(250);
 }
 check(running,"Next unavailable "+stderr);
 check((await call("/api/course-plans",null)).status===401,"anonymous list must be denied");
 check((await call("/api/course-plans/"+familyId,null)).status===401,"anonymous family detail must be denied");
 const listA=await (await call("/api/course-plans","fake-a")).json();
 const listB=await (await call("/api/course-plans","fake-b")).json();
 check(listA.families.length===1,"user A should see own family");
 check(listB.families.length===0,"user B must not see user A family");
 const detail=await (await call("/api/course-plans/"+familyId,"fake-a")).json();
 check(Object.keys(detail.family.bundle.plans).length===3,"source family missing three modes");
 check(detail.family.bundle.topics.length===2,"shared concepts missing");
 check((await call("/api/course-plans/"+familyId,"fake-b")).status===404,"B read A detail");
 const originalPath="/api/library/items/44444444-4444-4444-8444-444444444444/original";
 check((await call(originalPath,null)).status===401,"anonymous original file must be denied");
 check((await call(originalPath,"fake-b")).status===404,"B cannot download unowned original");

 const conceptId=bundle.topics[0].id;
 const masteryPath="/api/course-plans/"+familyId+"/mastery";
 check((await call(masteryPath,"fake-b","POST",{conceptId,level:2})).status===404,"B wrote A mastery");
 check((await call(masteryPath,"fake-a","POST",{conceptId:"concept_"+"f".repeat(20),level:2})).status===400,
  "unknown concept should be rejected");
 let mark=await call(masteryPath,"fake-a","POST",{conceptId,level:2});
 check(mark.status===200,"A could not self-assess");
 check((await mark.json()).level===2,"incorrect level after self assessment");
 mark=await call(masteryPath,"fake-a","POST",{conceptId,level:1});
 check((await mark.json()).level===2,"older/lower event downgraded mastery");
 const persisted=await (await call("/api/course-plans/"+familyId,"fake-a")).json();
 check(persisted.mastery.length===1&&persisted.mastery[0].level===2,"shared mastery did not persist");
 const sameAcrossModes=persisted.family.bundle.topics[0].id===conceptId&&
  ["deep","faithful","exam"].every(mode=>persisted.family.bundle.plans[mode]);
 check(sameAcrossModes,"switching modes changed concept membership");
 check((await call("/api/course-plans/"+familyId,"fake-b")).status===404,"B saw A saved mastery");
 const saved=await call("/learn/plans/","fake-a");
 check(saved.status===200,"authenticated studio denied "+saved.status);
 const anon=await fetch(app+"/learn/plans/",{redirect:"manual"});
 check([307,308].includes(anon.status),"private studio not login protected");
 const userBGenerate=await call("/api/course-plans","fake-b","POST",
  {libraryItemId:"44444444-4444-4444-8444-444444444444"});
 check(userBGenerate.status===404,"must not generate from unowned library item");
 console.log(JSON.stringify({pass:true,test:"SYNTHETIC real HTTP multiuser",
  concepts:bundle.topics.length,modes:3,A_saved:2,B_list:0,B_denied:true,
  monotonic:true,privatePageHTTP:saved.status}));
}finally{
 server.kill("SIGTERM");serverMock.closeAllConnections();serverMock.close();await sleep(350);
}
