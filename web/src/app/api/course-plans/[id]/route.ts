import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {dbSelectOne,dbRequest} from "@/lib/supabase-rest";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f-]{36}$/i;
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const {id}=await context.params;
 if(!uuid.test(id))return NextResponse.json({error:"INVALID_FAMILY_ID"},{status:400});
 try{
  const family=await dbSelectOne<{id:string;bundle:unknown;source_name:string;created_at:string}>(
   "course_plan_families",new URLSearchParams({select:"id,bundle,source_name,created_at",
    id:"eq."+id,user_id:"eq."+user.id,limit:"1"}));
  if(!family)return NextResponse.json({error:"PLAN_NOT_FOUND"},{status:404});
  const mastery=await dbRequest<Array<{concept_id:string;level:number;updated_at:string}>>(
   "course_concept_mastery?"+new URLSearchParams({select:"concept_id,level,updated_at",
    family_id:"eq."+id,user_id:"eq."+user.id,limit:"100"}).toString());
  return NextResponse.json({family,mastery:Array.isArray(mastery)?mastery:[]},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"PLAN_READ_FAILED"},{status:503});}
}
