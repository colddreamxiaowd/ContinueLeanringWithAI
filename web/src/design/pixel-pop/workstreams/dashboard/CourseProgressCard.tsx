"use client";

import {BarChart3, BookOpen, Check, ChevronRight, LockKeyhole, Play, Trophy} from "lucide-react";
import {PopButton, PopPanel, ProgressRing} from "../../primitives";
import {courseProgressSummary} from "./card-state.mjs";
import styles from "./dashboard.module.css";

export type ChapterProgressStatus = "completed" | "current" | "available" | "locked";
export interface ProgressChapter {
  id: string;
  title: string;
  status: ChapterProgressStatus;
}
export interface CourseProgressCardProps {
  title?: string;
  /** Learning activity completion (including reading/practice), not completed chapters / chapter count. */
  progressPercent: number;
  /** Canonical source of chapter completion; never infer chapter status from progressPercent. */
  chapters: readonly ProgressChapter[];
  onOpenChapter?: (chapterId: string) => void;
  onContinue?: () => void;
  onViewAll?: () => void;
  onCertificate?: () => void;
  compact?: boolean;
  className?: string;
}

/** Purely controlled; source data and navigation stay owned by CoursePack/parent. */
export function CourseProgressCard({
  title = "学习进度", progressPercent, chapters, onOpenChapter, onContinue,
  onViewAll, onCertificate, compact = false, className = "",
}: CourseProgressCardProps) {
  const summary = courseProgressSummary(progressPercent, chapters);
  const current = chapters.find(chapter => chapter.status === "current");
  const detailsText = summary.total === 0 ? "尚无章节" : summary.completed + " / " + summary.total + " 章节已完成";
  return <PopPanel className={[styles.progressCard, compact ? styles.progressCompact : "", className].filter(Boolean).join(" ")}>
    <div className={styles.cardHeading}>
      <span className={[styles.headingIcon, styles.headingIconMint].join(" ")} aria-hidden="true"><BarChart3 size={22} strokeWidth={3}/></span>
      <h2>{title}</h2>
      {!compact && onViewAll && <button className={styles.textAction} type="button" onClick={onViewAll}>查看全部 <ChevronRight size={18}/></button>}
    </div>
    <div className={styles.progressBody}>
      <ProgressRing value={summary.percent} label="学习任务进度"/>
      <div className={styles.progressDetails}>
        <strong className={styles.progressCount}>{detailsText}</strong>
        {summary.fullyComplete && <div className={styles.finishMessage}><Trophy size={17} aria-hidden="true"/> 恭喜完成全部学习！</div>}
        {summary.allChaptersCompleted && !summary.fullyComplete &&
          <div className={styles.progressIncompleteHint}>章节已完成，仍有学习活动待完成</div>}
        {compact ? <div className={styles.progressCompactAction}>
          {summary.fullyComplete && onCertificate ? <PopButton variant="outline" onClick={onCertificate}>查看证书</PopButton> :
            current && onContinue ? <PopButton variant="blue" onClick={onContinue}><Play size={14} fill="currentColor" aria-hidden="true"/> 继续学习</PopButton> :
            <span className={styles.mutedText}>{summary.fullyComplete ? "全部学习已完成" : summary.allChaptersCompleted ? "还有未完成的学习活动" : current ? "当前章节可继续学习" : "暂无可继续的章节"}</span>}
        </div> : <ol className={styles.chapterList}>
          {chapters.length === 0 && <li className={styles.emptyChapter}>课程尚无章节</li>}
          {chapters.map((chapter, index) => {
            const disabled = chapter.status === "locked";
            const activatable = !disabled && Boolean(onOpenChapter);
            const label = <><span className={[styles.chapterMarker, chapter.status === "completed" ? styles.markerDone : "", chapter.status === "current" ? styles.markerCurrent : ""].join(" ")} aria-hidden="true">
              {chapter.status === "completed" ? <Check size={16} strokeWidth={3}/> : chapter.status === "current" ? <Play size={12} fill="currentColor"/> : disabled ? <LockKeyhole size={12}/> : null}
            </span><span className={styles.chapterLabel}>{index + 1}. {chapter.title}</span></>;
            const chapterClasses = [styles.chapterItem, chapter.status === "current" ? styles.chapterCurrent : "", disabled ? styles.chapterLocked : ""].filter(Boolean).join(" ");
            return <li key={chapter.id}>
              {activatable ? <button type="button" aria-current={chapter.status === "current" ? "step" : undefined}
                aria-label={(chapter.status === "completed" ? "已完成" : chapter.status === "current" ? "正在学习" : "可学习") + "：" + chapter.title}
                className={chapterClasses} onClick={() => onOpenChapter?.(chapter.id)}>{label}</button> :
                <span aria-label={(disabled ? "未解锁" : chapter.status === "completed" ? "已完成" : "可学习") + "：" + chapter.title}
                  className={chapterClasses}>{label}</span>}
            </li>;
          })}
        </ol>}
      </div>
    </div>
    {!compact && <div className={styles.progressExplanation}>学习任务进度含章内阅读与练习；章节完成数按章节状态统计。</div>}
    {!compact && summary.fullyComplete && onCertificate && <div className={styles.progressFooter}>
      <PopButton variant="outline" onClick={onCertificate}><BookOpen size={16} aria-hidden="true"/> 查看证书</PopButton>
    </div>}
  </PopPanel>;
}
