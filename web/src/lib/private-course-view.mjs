import {validateCoursePack} from "./coursepack.mjs";

/** Private API rows are the only source of saved courses. Invalid stored packs never render. */
export function ownCourseRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row =>
    row && typeof row.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(row.id) &&
    validateCoursePack(row.pack).ok
  );
}

export function emptyCourseProgress() {
  return {completedBlockIds:[], answers:{}, simStacks:{}};
}

/** Keep only IDs from this pack when deriving UI progress; never invent completion. */
export function courseView(pack, state, activeChapterId) {
  if (!validateCoursePack(pack).ok) throw new Error("INVALID_COURSEPACK");
  const chapters = pack.chapters;
  const allBlocks = chapters.flatMap(ch => ch.blocks);
  const known = new Set(allBlocks.map(b => b.id));
  const completed = new Set(
    (Array.isArray(state?.completedBlockIds) ? state.completedBlockIds : []).filter(id => known.has(id))
  );
  const currentId = chapters.find(ch => ch.blocks.some(b => !completed.has(b.id)))?.id ?? chapters[0].id;
  const chosen = chapters.find(ch => ch.id === activeChapterId) ?? chapters.find(ch => ch.id === currentId);
  const summary = chapters.map(ch => ({
    id:ch.id, title:ch.title,
    status:ch.blocks.every(b => completed.has(b.id)) ? "completed" : ch.id === currentId ? "current" : "available",
  }));
  return {
    chapterId:chosen.id,
    chapters:summary,
    progressPercent:allBlocks.length ? Math.round(100 * completed.size / allBlocks.length) : 0,
    completedBlockIds:[...completed],
    completeCount:completed.size,
    totalCount:allBlocks.length,
  };
}

/** Return a full state for the existing PUT endpoint; only explanation/code are markable. */
export function markReadingComplete(pack,state,blockId) {
  const block = pack.chapters.flatMap(ch => ch.blocks).find(b => b.id === blockId);
  if (!block || !["explanation","code"].includes(block.type)) return null;
  const old = Array.isArray(state?.completedBlockIds) ? state.completedBlockIds : [];
  if (old.includes(blockId)) return null;
  return {
    completedBlockIds:[...old,blockId],
    answers:state?.answers && typeof state.answers === "object" ? state.answers : {},
    simStacks:state?.simStacks && typeof state.simStacks === "object" ? state.simStacks : {},
  };
}
