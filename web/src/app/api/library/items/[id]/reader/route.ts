import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {getPrivateOfficeSource,privateSourceError} from "@/lib/private-office-source";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const {id}=await context.params;
  const source=await getPrivateOfficeSource(user.id,id);
  if(new URL(request.url).searchParams.get("format")==="chunks"){
   return NextResponse.json({sourceChunks:source.sourceChunks,sourceCount:source.sourceChunks.length},{
    headers:{"Cache-Control":"private, no-store"}});
  }
  return NextResponse.json(source.sections,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const {code,status}=privateSourceError(error);
  return NextResponse.json({error:code},{status});
 }
}
