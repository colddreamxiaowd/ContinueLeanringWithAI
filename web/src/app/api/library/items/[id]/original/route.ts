import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/public-auth";
import {getPrivateOfficeSource,privateSourceError} from "@/lib/private-office-source";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const mimeByExt:Record<string,string>={
 pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
 docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401,
  headers:{"Cache-Control":"private, no-store"}});
 try{
  const {id}=await context.params;
  // Same owner-bound read and 15 MiB limit as the G3 source processor.
  const file=await getPrivateOfficeSource(user.id,id);
  const filename=file.fileName.replace(/[\r\n"\\/]/g,"_").slice(0,220);
  const ext=filename.toLowerCase().split(".").pop()||"";
  const mime=mimeByExt[ext]||"application/octet-stream";
  const data=new Uint8Array(file.original);
  return new NextResponse(data,{
   headers:{
    "Content-Type":mime,
    "Content-Length":String(data.byteLength),
    "Content-Disposition":`attachment; filename="zhixu-source.${ext}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff"
   }
  });
 }catch(error){
  const {code,status}=privateSourceError(error);
  return NextResponse.json({error:code},{status,
   headers:{"Cache-Control":"private, no-store"}});
 }
}
