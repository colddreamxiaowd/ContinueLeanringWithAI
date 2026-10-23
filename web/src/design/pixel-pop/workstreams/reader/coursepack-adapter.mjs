/**
 * CoursePack v0.1 -> Session C read-only view model.
 * It does NOT replace web/src/lib/coursepack.mjs validation on the CoursePack branch.
 * No new block types or source fields are added to the persisted protocol.
 */
const blockName={explanation:"概念讲解",code:"源码阅读",quiz:"理解检测","stack-simulator":"互动实验"};
const hasId=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]+$/.test(x);

/**
 * @param {any} pack Validated CoursePack v0.1 object (not a schema validator)
 * @param {{chapterId?:string,completedBlockIds?:string[],activeBlockId?:string,sourceLinks?:Record<string,string>,mode?:"private"|"demo"}} [options]
 */
export function adaptCoursePackV01(pack,{chapterId,completedBlockIds=[],activeBlockId,sourceLinks={},mode="private"}={}){
  if(!pack||pack.schemaVersion!=="0.1"||!Array.isArray(pack.chapters)||!Array.isArray(pack.sourceRefs))
    throw new Error("需要经过 CoursePack v0.1 校验的数据");
  const chapter=pack.chapters.find(c=>c.id===chapterId)??pack.chapters[0];
  if(!chapter||!Array.isArray(chapter.blocks))throw new Error("未找到可阅读的章节");
  const completed=new Set(completedBlockIds);
  const active=activeBlockId||chapter.blocks[0]?.id||"";
  const chapters=pack.chapters.map(c=>({id:c.id,label:c.title,sections:c.blocks.map((b,i)=>({
    id:b.id,label:`${i+1}. ${blockName[b.type]||"课程内容"}${b.type==="quiz"?" · "+(b.prompt||"").slice(0,28):""}`,
    status:completed.has(b.id)?"done":b.id===active?"current":"pending"
  }))}));
  const sourceRefs=new Map(pack.sourceRefs.filter(r=>hasId(r.id)).map(r=>[r.id,r]));
  const citedIds=new Set();
  const blocks=[];
  chapter.blocks.forEach((b,i)=>{
    const id=hasId(b.id)?b.id:`invalid-${i}`;
    const refs=Array.isArray(b.sourceRefIds)?b.sourceRefIds.filter(hasId):[];
    refs.forEach(ref=>citedIds.add(ref));
    if(b.type==="explanation"){
      blocks.push({type:"heading",id,number:String(i+1),title:"概念讲解"});
      const chunks=String(b.markdown||"").split(/\n\s*\n/g).filter(Boolean);
      (chunks.length?chunks:[""]).forEach((chunk,index)=>{
        const content=[{text:chunk}];
        if(index===(chunks.length||1)-1)refs.forEach(ref=>content.push({text:"",citationId:ref}));
        blocks.push({type:"paragraph",content});
      });
    }else if(b.type==="code"){
      blocks.push({type:"code",id,language:String(b.language||"text"),code:String(b.source||"")});
      if(refs.length)blocks.push({type:"paragraph",content:refs.map(ref=>({text:"",citationId:ref}))});
    }else if(b.type==="quiz"||b.type==="stack-simulator"){
      blocks.push({type:"activity",id,kind:b.type,label:b.type==="quiz"?String(b.prompt||"课程练习"):"在课程互动区操作栈、验证学习内容。"});
      if(refs.length)blocks.push({type:"paragraph",content:refs.map(ref=>({text:"",citationId:ref}))});
    }
  });
  const citations=[...citedIds].map((id,i)=>{
    const ref=sourceRefs.get(id);
    return {id,label:String(i+1),title:ref?.fileName||`引用 ${id} 未找到`,
      description:ref?"此处仅展示课程提供的来源线索，尚未核对原始材料内容。":"课程内容引用了不存在的 sourceRef；请检查课程包。",
      sourceTitle:ref?.fileName,location:ref?.locator,
      ...(ref&&typeof sourceLinks[id]==="string"?{href:sourceLinks[id]}:{}),
      provenance:ref?(mode==="demo"?"demo":"private"):"unverified"};
  });
  return {lesson:{id:chapter.id,title:chapter.title,breadcrumb:[pack.title,chapter.title],blocks},
    chapters,citations,activeSectionId:active};
}