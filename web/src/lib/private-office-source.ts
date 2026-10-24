import {getCurrentUser} from "@/lib/public-auth";
import {dbSelectOne} from "@/lib/supabase-rest";
import {downloadFeishuFile} from "@/lib/feishu";
import {extractOfficeSections} from "@/lib/office-reader.mjs";
import {officeSourceChunks,sha256Office} from "@/lib/source-chunks.mjs";

const MAX_BYTES=15*1024*1024;
type PrivateFile={name:string;source_token:string;item_type:string};
const itemIdPattern=/^[0-9a-f-]{36}$/i;

// Sole authorized OOXML extraction boundary for the private reader and G3
// generator. No original binary is persisted or committed to Git.
export async function getPrivateOfficeSource(userId:string,itemId:string){
 if(!itemIdPattern.test(itemId))throw Error("ITEM_ID_INVALID");
 const item=await dbSelectOne<PrivateFile>("library_items",new URLSearchParams({
  select:"name,source_token,item_type",id:"eq."+itemId,user_id:"eq."+userId,limit:"1"
 }));
 if(!item)throw Error("ITEM_NOT_FOUND");
 if(item.item_type!=="file"||!/\.(pptx|docx|xlsx)$/i.test(item.name))throw Error("OFFICE_TYPE_UNSUPPORTED");
 const upstream=await downloadFeishuFile(userId,item.source_token);
 const body=upstream.body;
 if(!body)throw Error("FEISHU_DOWNLOAD_FAILED");
 const sizeHeader=Number(upstream.headers.get("content-length")||"0");
 if(sizeHeader>MAX_BYTES)throw Error("OFFICE_SIZE_UNSUPPORTED");
 const reader=body.getReader(),parts:Buffer[]=[];
 let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_BYTES){await reader.cancel().catch(()=>{});throw Error("OFFICE_SIZE_UNSUPPORTED");}
   parts.push(Buffer.from(value));
  }
 }finally{reader.releaseLock();}
 const original=Buffer.concat(parts);
 const sections=extractOfficeSections(original,item.name);
 const sourceHash=sha256Office(original);
 const sourceChunks=officeSourceChunks(sections,{
   ownerId:userId,libraryItemId:itemId,fileName:item.name,
   mimeType:"application/vnd.openxmlformats-officedocument",originalHash:sourceHash
 });
 return {itemId,fileName:item.name,sourceHash,sections,sourceChunks};
}
export function privateSourceError(error:unknown){
 const code=error instanceof Error?error.message:"OFFICE_READ_FAILED";
 const status=code==="ITEM_ID_INVALID"?400
   :code==="ITEM_NOT_FOUND"?404
   :code==="OFFICE_TYPE_UNSUPPORTED"?415
   :code==="OFFICE_SIZE_UNSUPPORTED"?413
   :code==="OFFICE_FILE_INVALID"||code==="OFFICE_NO_READABLE_CONTENT"?422
   :code==="FEISHU_REAUTH_REQUIRED"?401
   :code==="FEISHU_PERMISSION_DENIED"?403:502;
 return {code,status};
}
