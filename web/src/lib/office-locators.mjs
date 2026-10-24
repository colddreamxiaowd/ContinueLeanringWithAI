// OOXML visible-order resolver; never infer slide order from slideN filenames when a manifest exists.
function attribute(tag,name) {
  const re=new RegExp("(?:^|\\s)"+name+"\\s*=\\s*[\"']([^\"']*)[\"']");
  return tag.match(re)?.[1]??null;
}
function relationships(xml) {
 const result=new Map();
 for(const tag of String(xml||"").match(/<Relationship(?=[\s/>])[^>]*>/g)||[]){
  const id=attribute(tag,"Id"),target=attribute(tag,"Target"),type=attribute(tag,"Type");
  if(!id||!target||!type||attribute(tag,"TargetMode")==="External")continue;
  result.set(id,{target,type});
 }
 return result;
}
function targetPath(part){
 if(typeof part!=="string")return null;
 return part.replace(/^\//,"").replace(/^\.\//,"");
}
export function pptxVisibleSlideOrder(parts){
 const manifest=parts.get("ppt/presentation.xml"),rels=parts.get("ppt/_rels/presentation.xml.rels");
 if(!manifest||!rels)return null;
 const lookup=relationships(rels);
 const ids=[...manifest.matchAll(/<p:sldId(?=[\s/>])[^>]*>/g)].map(x=>attribute(x[0],"r:id"));
 if(!ids.length||ids.some(x=>!x))return null;
 const output=[];
 for(const id of ids){
  const r=lookup.get(id);
  if(!r||!r.type.endsWith("/slide"))return null;
  const name=targetPath(r.target);
  const path=name?.startsWith("ppt/")?name:"ppt/"+name;
  if(!path||!/^ppt\/slides\/slide\d+\.xml$/.test(path)||!parts.has(path)||output.includes(path))return null;
  output.push(path);
 }
 if(output.length!==[...parts.keys()].filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).length)return null;
 return output;
}
export function xlsxVisibleSheetOrder(parts){
 const workbook=parts.get("xl/workbook.xml"),rels=parts.get("xl/_rels/workbook.xml.rels");
 if(!workbook||!rels)return null;
 const lookup=relationships(rels),names=[];
 const sheets=[...workbook.matchAll(/<sheet(?=[\s/>])[^>]*>/g)].map(x=>x[0]);
 if(!sheets.length)return null;
 for(const tag of sheets){
  const id=attribute(tag,"r:id"),label=attribute(tag,"name");
  const rel=lookup.get(id);
  if(!rel||!rel.type.endsWith("/worksheet")||!label)return null;
  const normalized=targetPath(rel.target);
  const part=normalized?.startsWith("xl/")?normalized:"xl/"+normalized;
  if(!part||!/^xl\/worksheets\/sheet\d+\.xml$/.test(part)||!parts.has(part)||names.some(x=>x.part===part))return null;
  names.push({part,label});
 }
 if(names.length!==[...parts.keys()].filter(p=>/^xl\/worksheets\/sheet\d+\.xml$/.test(p)).length)return null;
 return names;
}
