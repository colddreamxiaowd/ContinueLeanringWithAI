// CoursePack v0.1: data-only lessons, never executable user-provided HTML/JS.
export const COURSEPACK_SCHEMA_VERSION = "0.1";
const text = (v, n=1000) => typeof v === "string" && v.trim().length > 0 && v.length <= n;
const arr = (v, max) => Array.isArray(v) && v.length <= max;
const id = v => text(v,80) && /^[a-zA-Z0-9_-]+$/.test(v);
function validateBlock(b, errors, location) {
  if (!b || typeof b !== "object" || Array.isArray(b) || !id(b.id)) {
    errors.push(location + ": invalid block/id"); return;
  }
  if (b.type === "explanation") {
    if (!text(b.markdown, 18000)) errors.push(location + ": explanation requires markdown");
  } else if (b.type === "code") {
    if (!text(b.language, 32) || !text(b.source,12000))
      errors.push(location + ": code requires language and source");
  } else if (b.type === "quiz") {
    if (!text(b.prompt,1000) || !arr(b.options,6) || b.options.length < 2 ||
      !b.options.every(o => text(o,500)) ||
      !Number.isInteger(b.answerIndex) || b.answerIndex < 0 ||
      b.answerIndex >= b.options.length)
      errors.push(location + ": invalid quiz");
    if (b.hint !== undefined && !text(b.hint,1500)) errors.push(location + ": invalid hint");
  } else if (b.type === "stack-simulator") {
    if (!arr(b.initial,12) || !b.initial.every(v=>Number.isSafeInteger(v)) ||
      !Number.isInteger(b.capacity) || b.capacity < Math.max(1,b.initial.length) ||
      b.capacity > 20) errors.push(location + ": invalid stack simulator");
  } else errors.push(location + ": unsupported block type");
  if (b.sourceRefIds !== undefined && (!arr(b.sourceRefIds,30) ||
      !b.sourceRefIds.every(id))) errors.push(location + ": invalid source references");
}
export function validateCoursePack(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {ok:false,errors:["CoursePack must be an object"]};
  if (value.schemaVersion !== COURSEPACK_SCHEMA_VERSION)
    errors.push("unsupported schemaVersion");
  if (!text(value.title,160)) errors.push("title required");
  if (!text(value.description,2000)) errors.push("description required");
  if (!Number.isInteger(value.version) || value.version < 1)
    errors.push("version must be a positive integer");
  if (value.visibility !== undefined && value.visibility !== "private")
    errors.push("v0.1 imports must be private");
  if (!arr(value.sourceRefs,100)) errors.push("sourceRefs must be an array");
  else {
    const ids = new Set();
    for (const [i,r] of value.sourceRefs.entries()) {
      if (!r || !id(r.id) || !text(r.fileName,400) || !text(r.locator,500)) {
        errors.push("invalid sourceRef at " + i); continue;
      }
      if (ids.has(r.id)) errors.push("duplicate sourceRef id"); ids.add(r.id);
    }
  }
  if (!arr(value.chapters,60) || value.chapters.length === 0)
    errors.push("at least one chapter required");
  else {
    const used = new Set(), refIds = new Set((Array.isArray(value.sourceRefs)?value.sourceRefs:[]).map(r=>r?.id));
    let count = 0;
    for (const [c,chapter] of value.chapters.entries()) {
      if (!chapter || !id(chapter.id) || !text(chapter.title,180) ||
        !arr(chapter.blocks,60) || !chapter.blocks.length) {
        errors.push("invalid chapter at " + c); continue;
      }
      if (used.has(chapter.id)) errors.push("duplicate chapter/block id " + chapter.id);
      used.add(chapter.id);
      for (const [i,block] of chapter.blocks.entries()) {
        validateBlock(block,errors,"chapter "+c+" block "+i);
        if (id(block?.id)) {
          if (used.has(block.id)) errors.push("duplicate chapter/block id "+block.id);
          used.add(block.id);
        }
        if (Array.isArray(block?.sourceRefIds)) for(const rid of block.sourceRefIds)
          if(!refIds.has(rid)) errors.push("unresolved source reference "+rid);
        count++;
      }
    }
    if(count>400) errors.push("too many blocks");
  }
  return {ok:errors.length===0,errors};
}
