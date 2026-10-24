import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/public-auth";
import { dbRequest, dbSelectOne, dbUpsert } from "@/lib/supabase-rest";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Params={params:Promise<{id:string}>};
function validState(s:unknown): s is {
  completedBlockIds:string[];answers:Record<string,number>;
  simStacks:Record<string,number[]>
} {
  if (!s || typeof s!=="object" || Array.isArray(s)) return false;
  const v=s as Record<string,unknown>;
  const ids=v.completedBlockIds,answers=v.answers,stacks=v.simStacks;
  if (!Array.isArray(ids)||ids.length>400||!ids.every(x=>typeof x==="string"&&x.length<=80)) return false;
  if (!answers||typeof answers!=="object"||Array.isArray(answers)||
    Object.keys(answers).length>400||!Object.entries(answers).every(([k,x])=>k.length<=80&&Number.isInteger(x)&&Number(x)>=0&&Number(x)<=10)) return false;
  if (!stacks||typeof stacks!=="object"||Array.isArray(stacks)||
    Object.keys(stacks).length>100||!Object.entries(stacks).every(([k,x])=>
      k.length<=80&&Array.isArray(x)&&x.length<=20&&x.every(n=>Number.isSafeInteger(n))))return false;
  // Optional v0.1-compatible bookmark: preserve current state and add only a small locator.
  if (v.lastLocation !== undefined) {
    const location=v.lastLocation;
    if(!location||typeof location!=="object"||Array.isArray(location))return false;
    const data=location as Record<string,unknown>;
    const valid=(x:unknown)=>x===undefined||(typeof x==="string"&&x.length<=80&&/^[A-Za-z0-9_-]*$/.test(x));
    if(!valid(data.chapterId)||!valid(data.blockId))return false;
  }
  return true;
}
async function checkOwner(userId:string,id:string) {
  if(!/^[0-9a-f-]{36}$/i.test(id))return false;
  const q=new URLSearchParams({select:"id",id:"eq."+id,user_id:"eq."+userId,limit:"1"});
  return Boolean(await dbSelectOne("coursepacks",q));
}
export async function GET(_req:Request,{params}:Params){
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
  const {id}=await params;
  try{
    if(!await checkOwner(user.id,id))return NextResponse.json({error:"NOT_FOUND"},{status:404});
    const q=new URLSearchParams({select:"state",coursepack_id:"eq."+id,user_id:"eq."+user.id,limit:"1"});
    const row=await dbSelectOne<{state:Record<string,unknown>}>("coursepack_progress",q);
    return NextResponse.json({state:row?.state||{completedBlockIds:[],answers:{},simStacks:{}}});
  }catch{return NextResponse.json({error:"PROGRESS_READ_FAILED"},{status:503});}
}
export async function PUT(req:Request,{params}:Params){
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
  const {id}=await params;const raw=await req.text();
  if(raw.length>24000)return NextResponse.json({error:"PROGRESS_TOO_LARGE"},{status:413});
  let state:unknown;
  try{state=JSON.parse(raw);}catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
  if(!validState(state))return NextResponse.json({error:"INVALID_PROGRESS"},{status:400});
  try{
    if(!await checkOwner(user.id,id))return NextResponse.json({error:"NOT_FOUND"},{status:404});
    await dbUpsert("coursepack_progress",{
      coursepack_id:id,user_id:user.id,state,updated_at:new Date().toISOString()
    },"coursepack_id,user_id");
    return NextResponse.json({saved:true});
  }catch{return NextResponse.json({error:"PROGRESS_SAVE_FAILED"},{status:503});}
}
