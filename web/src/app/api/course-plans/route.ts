import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {dbRequest} from "@/lib/supabase-rest";
import {getPrivateOfficeSource,privateSourceError} from "@/lib/private-office-source";
import {makePlanBundle,PLANNER_VERSION} from "@/lib/course-plan-modes.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f-]{36}$/i;
export async function GET(){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const q=new URLSearchParams({select:"id,source_name,source_sha256,planner_version,created_at",
   user_id:"eq."+user.id,order:"created_at.desc",limit:"30"});
  const families=await dbRequest("course_plan_families?"+q.toString());
  return NextResponse.json({families},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"COURSE_PLANS_UNAVAILABLE"},{status:503});}
}
export async function POST(request:Request){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const body=await request.text();
 if(body.length>1000)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
 let input:{libraryItemId?:unknown}|null=null;
 try{input=JSON.parse(body);}catch{}
 if(typeof input?.libraryItemId!=="string"||!uuid.test(input.libraryItemId))
   return NextResponse.json({error:"INVALID_SOURCE_ID"},{status:400});
 try{
  // The server rechecks ownership and downloads only with this user's Feishu token.
  // Never trust source chunks, user IDs or alleged source hashes sent from browsers.
  const source=await getPrivateOfficeSource(user.id,input.libraryItemId);
  const sections=source.sections.sections.map((part:{
   label:string;title:string;paragraphs:string[];locator?:unknown;
   locatorVerified?:boolean;warnings?:string[];extractionStatus?:string
  })=>({...part,locator:part.locator&&typeof part.locator==="object"?
   {...part.locator as object,label:part.label,verified:part.locatorVerified===true}:undefined}));
  const bundle=makePlanBundle({libraryItemId:source.itemId,fileName:source.fileName,
   sourceHash:source.sourceHash,sections});
  const q=new URLSearchParams({on_conflict:"user_id,library_item_id,source_sha256,planner_version"});
  const rows=await dbRequest<Array<{id:string}>>("course_plan_families?"+q.toString(),{
   method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},
   body:JSON.stringify({user_id:user.id,library_item_id:source.itemId,
    source_sha256:source.sourceHash,planner_version:PLANNER_VERSION,
    source_name:source.fileName,bundle})
  });
  if(!rows?.[0]?.id)throw Error("PLAN_SAVE_FAILED");
  return NextResponse.json({id:rows[0].id,plannerVersion:PLANNER_VERSION,
    topics:bundle.topics.length,sourceFileName:source.fileName,
    sourceLimited:bundle.source.limited},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof Error&&error.message==="SOURCE_NO_LEARNABLE_TEXT")
   return NextResponse.json({error:"SOURCE_NO_LEARNABLE_TEXT"},{status:422});
  const {code,status}=privateSourceError(error);
  if(status!==502||code.startsWith("FEISHU_"))
   return NextResponse.json({error:code},{status});
  return NextResponse.json({error:"COURSE_PLAN_GENERATION_FAILED"},{status:503});
 }
}
