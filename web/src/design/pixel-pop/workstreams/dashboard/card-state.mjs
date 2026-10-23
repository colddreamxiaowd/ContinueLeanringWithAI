/**
 * Pixel Pop B: pure display derivations shared by the three controlled cards.
 * progressPercent is an external learning-activity metric (chapter reading,
 * practice, checkpoints). It is NOT the proportion of completed chapters.
 * Completed chapters always come from explicit chapter.status.
 */
export function courseProgressSummary(progressPercent, chapters) {
  const percent = Number.isFinite(progressPercent)
    ? Math.max(0, Math.min(100, Math.round(progressPercent))) : 0;
  const total = chapters.length;
  const completed = chapters.filter(chapter => chapter.status === "completed").length;
  const allChaptersCompleted = total > 0 && completed === total;
  const fullyComplete = allChaptersCompleted && percent === 100;
  const hasCurrent = chapters.some(chapter => chapter.status === "current");
  return {percent, total, completed, allChaptersCompleted, fullyComplete, hasCurrent};
}

/** Sync status has precedence over derived-course badges until synced. */
export function sourceStatusPresentation(file) {
  switch (file.syncState) {
    case "syncing":
      return {kind: "syncing", label: Number.isFinite(file.syncPercent)
        ? "同步中 · " + Math.max(0, Math.min(100, Math.round(file.syncPercent))) + "%" : "同步中"};
    case "error": return {kind: "error", label: "同步失败"};
    case "not-synced": return {kind: "pending", label: "未同步"};
    default: return {kind: "synced", label: "已同步"};
  }
}

/** Task state and task kind stay orthogonal, including for completed tasks. */
export function taskStatusPresentation(task) {
  const typeLabels = {video: "视频学习", practice: "动手练习", quiz: "章节测验"};
  const statusLabels = {"not-started": "未开始", "in-progress": "进行中", completed: "已完成"};
  return {type: typeLabels[task.kind] ?? "", status: statusLabels[task.status] ?? ""};
}
