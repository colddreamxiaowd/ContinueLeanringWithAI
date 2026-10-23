"use client";

import {BarChart3, BookOpen, Check, ChevronRight, LockKeyhole, Play, Trophy} from "lucide-react";
import {PopButton, PopPanel, ProgressRing} from "../../primitives";
import styles from "./dashboard.module.css";

export type ChapterProgressStatus = "completed" | "current" | "available" | "locked";
export interface ProgressChapter {
  id: string;
  title: string;
  status: ChapterProgressStatus;
}
export interface CourseProgressCardProps {
  title?: string;
  progressPercent: number;
  chapters: readonly ProgressChapter[];
  onOpenChapter?: (chapterId: string) => void;
  onContinue?: () => void;
  onViewAll?: () => void;
  onCertificate?: () => void;
  compact?: boolean;
  className?: string;
}

/** Controlled visual component: neither progress nor chapter completion is saved here. */
export function CourseProgressCard({
  title = "学习进度", progressPercent, chapters, onOpenChapter, onContinue,
  onViewAll, onCertificate, compact = false, className = "",
}: CourseProgressCardProps) {
  const progress = Number.isFinite(progressPercent) ? Math.min(100, Math.max(0, Math.round(progressPercent))) : 0;
  const completed = chapters.filter(chapter => chapter.status === "completed").length;
  const current = chapters.find(chapter => chapter.status === "current");
  const finished = chapters.length > 0 && completed === chapters.length;
  return <PopPanel className={[styles.progressCard, compact ? styles.progressCompact : "", className].filter(Boolean).join(" ")}>
    <div className={styles.cardHeading}>
      <span className={[styles.headingIcon, styles.headingIconMint].join(" ")} aria-hidden="true"><BarChart3 size={22} strokeWidth={3}/></span>
      <h2>{title}</h2>
      {!compact && onViewAll && <button className={styles.textAction} type="button" onClick={onViewAll}>查看全部 <ChevronRight size={18}/></button>}
    </div>
    <div className={styles.progressBody}>
      <ProgressRing value={progress} label="课程进度"/>
      <div className={styles.progressDetails}>
        <strong className={styles.progressCount}>{completed} / {chapters.length} 章节已完成</strong>
        {finished ? <div className={styles.finishMessage}><Trophy size={17} aria-hidden="true"/> 恭喜完成本章！</div> : null}
        {compact ? <div className={styles.progressCompactAction}>
          {finished && onCertificate ? <PopButton variant="outline" onClick={onCertificate}>查看证书</PopButton> :
            current && onContinue ? <PopButton variant="blue" onClick={onContinue}><Play size={14} fill="currentColor" aria-hidden="true"/> 继续学习</PopButton> :
            <span className={styles.mutedText}>{current ? "当前章节可继续学习" : "暂无待学章节"}</span>}
        </div> : <ol className={styles.chapterList}>
          {chapters.length === 0 && <li className={styles.emptyChapter}>课程尚无章节</li>}
          {chapters.map((chapter, index) => {
            const disabled = chapter.status === "locked";
            const activatable = !disabled && Boolean(onOpenChapter);
            const label = <><span className={[styles.chapterMarker, chapter.status === "completed" ? styles.markerDone : "", chapter.status === "current" ? styles.markerCurrent : ""].join(" ")} aria-hidden="true">
                {chapter.status === "completed" ? <Check size={16} strokeWidth={3}/> : chapter.status === "current" ? <Play size={12} fill="currentColor"/> : chapter.status === "locked" ? <LockKeyhole size={13}/> : null}
              </span><span className={styles.chapterLabel}>{index + 1}. {chapter.title}</span></>;
            return <li key={chapter.id}>
              {activatable ? <button type="button" aria-current={chapter.status === "current" ? "step" : undefined}
                className={[styles.chapterItem, chapter.status === "current" ? styles.chapterCurrent : ""].join(" ")}
                onClick={() => onOpenChapter?.(chapter.id)}>{label}</button> :
                <span className={[styles.chapterItem, disabled ? styles.chapterLocked : "", chapter.status === "current" ? styles.chapterCurrent : ""].join(" ")}>{label}</span>}
            </li>;
          })}
        </ol>}
      </div>
    </div>
    {!compact && finished && onCertificate && <div className={styles.progressFooter}>
      <PopButton variant="outline" onClick={onCertificate}><BookOpen size={16} aria-hidden="true"/> 查看证书</PopButton>
    </div>}
  </PopPanel>;
}
