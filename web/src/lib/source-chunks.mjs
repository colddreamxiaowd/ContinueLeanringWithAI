import {createHash} from "node:crypto";
const hash=(text)=>createHash("sha256").update(text).digest("hex");
const text=(value)=>typeof value==="string"?value:"";
/**
 * Materialize internal, owner-scoped SourceChunk evidence without changing
 * existing CoursePack v0.1 sourceRefs or storing private file bytes in Git.
 * Locator provenance is explicit: filenames alone do not prove actual slide order.
 */
export function officeSourceChunks(result,{ownerId,libraryItemId,fileName,mimeType,originalHash}){
 if(!result||!Array.isArray(result.sections)||!ownerId||!libraryItemId||
   !fileName||!originalHash||!/^[a-f0-9]{64}$/i.test(originalHash))throw Error("SOURCE_CHUNK_METADATA_REQUIRED");
 return result.sections.slice(0,500).map((section,index)=>{
   const plain=(Array.isArray(section.paragraphs)?section.paragraphs:[]).filter(x=>typeof x==="string").join("\n").slice(0,60000);
   const locator=section.locator||{kind:"section",value:String(index+1)};
   const locatorLabel=text(section.label).slice(0,350);
   const verified=section.locatorVerified===true;
   const warnings=[...(Array.isArray(section.warnings)?section.warnings:[])].filter(x=>typeof x==="string").slice(0,10);
   if(!verified)warnings.unshift("原件可见顺序尚未核验；不可将此定位当成已证实来源");
   const identity=hash([libraryItemId,originalHash,locator.kind,locator.value,hash(plain)].join("\n"));
   return {
    id:"src-"+identity.slice(0,24),ownerId,libraryItemId,
    fileName,mimeType:mimeType||"application/octet-stream",
    locator:{kind:locator.kind,value:text(locator.value),label:locatorLabel,verified},
    text:plain,originalHash,contentHash:hash(plain),
    extractionStatus:verified&&warnings.length===0?"complete":"partial",
    warnings,extractedAt:new Date().toISOString()
   };
 });
}
export function sha256Office(bytes){return createHash("sha256").update(bytes).digest("hex");}
