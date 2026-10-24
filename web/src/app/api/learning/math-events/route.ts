import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {dbRequest} from "@/lib/supabase-rest";
import {MATH_ACTIVITY_VERSION,validateParameters,judge} from "@/lib/math-conditional.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const MAX_BODY=8500;
const eventKinds=new Set(["attempt-submitted","note-saved"]);
type EventInput={activityId?:unknown;clientEventId?:unknown;kind?:unknown;payload?:unknown};
function inspect(input:EventInput){
  if(input.activityId!==MATH_ACTIVITY_VERSION||
    typeof input.clientEventId!=="string"||
    !/^[A-Za-z0-9_-]{8,110}$/.test(input.clientEventId)||
    typeof input.kind!=="string"||!eventKinds.has(input.kind)||
    !input.payload||typeof input.payload!=="object"||Array.isArray(input.payload))return null;
  const data=input.payload as Record<string,unknown>;
  const stage=data.stage;
  if(stage!=="draw"&&stage!=="screen")return null;
  if(!validateParameters(stage,data.params))return null;
  if(input.kind==="attempt-submitted"){
    if(typeof data.answer!=="string"||data.answer.length>50||
      typeof data.note!=="string"||data.note.length>1000||
      typeof data.result!=="string"||!["correct","incorrect","invalid"].includes(data.result))return null;
    // Server independently judges the exact answer: never trust client grading.
    const authoritative=judge(stage,data.params,data.answer).status;
    return {stage,params:data.params,answer:data.answer,note:data.note,result:authoritative};
  }
  if(typeof data.body!=="string"||data.body.trim().length<1||data.body.length>4000||
    data.verification!=="unverified")return null;
  return {stage,params:data.params,body:data.body,verification:"unverified"};
}
export async function GET(){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
   const qs=new URLSearchParams({select:"id,activity_id,kind,payload,created_at",
     user_id:"eq."+user.id,activity_id:"eq."+MATH_ACTIVITY_VERSION,order:"created_at.asc",limit:"100"});
   const rows=await dbRequest<unknown[]>("learning_exploration_events?"+qs.toString());
   return NextResponse.json({events:Array.isArray(rows)?rows:[]},
     {headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"EVENTS_READ_FAILED"},{status:503});}
}
export async function POST(request:Request){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const text=await request.text();
 if(text.length>MAX_BODY)return NextResponse.json({error:"EVENT_TOO_LARGE"},{status:413});
 let input:EventInput;
 try{input=JSON.parse(text);}catch{return NextResponse.json({error:"INVALID_JSON"},{status:400});}
 const payload=inspect(input);
 if(!payload)return NextResponse.json({error:"INVALID_EVENT"},{status:400});
 try{
   await dbRequest("learning_exploration_events?on_conflict=user_id,client_event_id",{
     method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=minimal"},
     body:JSON.stringify({user_id:user.id,activity_id:MATH_ACTIVITY_VERSION,
       client_event_id:input.clientEventId,kind:input.kind,payload})
   });
   return NextResponse.json({saved:true},{status:201});
 }catch{return NextResponse.json({error:"EVENT_SAVE_FAILED"},{status:503});}
}
