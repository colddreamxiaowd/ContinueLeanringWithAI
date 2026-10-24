import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {dbRequest,dbSelectOne} from "@/lib/supabase-rest";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f-]{36}$/i;
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const {id}=await context.params;
 if(!uuid.test(id))return NextResponse.json({error:"INVALID_FAMILY_ID"},{status:400});
 const raw=await request.text();
 if(raw.length>300)return NextResponse.json({error:"INVALID_MASTERY"},{status:413});
 let input:{conceptId?:unknown;level?:unknown}|null=null;
 try{input=JSON.parse(raw);}catch{}
 if(typeof input?.conceptId!=="string"||!/^concept_[a-f0-9]{20}$/.test(input.conceptId)||
    (input.level!==1&&input.level!==2))
  return NextResponse.json({error:"INVALID_MASTERY"},{status:400});
 try{
  // A current login may update only concepts inside this user's private family.
  // The DB function ALSO enforces existence and performs an atomic max(level).
  const owner=await dbSelectOne<{id:string;bundle:{topics?:Array<{id:string}>}}>("course_plan_families",new URLSearchParams({
   select:"id,bundle",id:"eq."+id,user_id:"eq."+user.id,limit:"1"}));
  if(!owner)return NextResponse.json({error:"PLAN_NOT_FOUND"},{status:404});
  if(!owner.bundle?.topics?.some(topic=>topic.id===input.conceptId))
   return NextResponse.json({error:"CONCEPT_NOT_IN_FAMILY"},{status:400});
  const rows=await dbRequest<Array<{saved_level:number}>>("rpc/record_course_concept_mastery",{
   method:"POST",body:JSON.stringify({p_user_id:user.id,p_family_id:id,
    p_concept_id:input.conceptId,p_level:input.level})
  });
  const level=rows?.[0]?.saved_level;
  if(level!==1&&level!==2)throw Error("MASTERY_WRITE_FAILED");
  return NextResponse.json({saved:true,conceptId:input.conceptId,level},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"MASTERY_WRITE_FAILED"},{status:503});}
}
