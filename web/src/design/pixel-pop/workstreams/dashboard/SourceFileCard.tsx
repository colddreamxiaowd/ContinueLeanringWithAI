"use client";

import Link from "next/link";
import {AlertCircle, ArrowRight, Check, CheckCircle2, ChevronRight, CloudOff, FileCode2, FileQuestion, FileText, FolderOpen, Link2, LoaderCircle, RefreshCw} from "lucide-react";
import {PopPanel} from "../../primitives";
import {sourceStatusPresentation} from "./card-state.mjs";
import styles from "./dashboard.module.css";

export type SourceFileKind = "pptx" | "pdf" | "markdown" | "feishu" | "other";
export type SourceOutcome = "course" | "practice" | "supplement" | "none";
export type SourceSyncState = "synced" | "syncing" | "not-synced" | "error";

export interface DashboardSourceFile {
  id: string;
  name: string;
  kind: SourceFileKind;
  subtitle?: string;
  outcome: SourceOutcome;
  syncState: SourceSyncState;
  syncPercent?: number;
  href?: string;
}
export interface SourceFileCardProps {
  title?: string;
  files: readonly DashboardSourceFile[];
  onOpenFile?: (fileId: string) => void;
  onRetrySync?: (fileId: string) => void;
  onViewAll?: () => void;
  compact?: boolean;
  className?: string;
}
const OUTCOME_LABELS: Record<SourceOutcome, string> = {
  course: "已生成课程", practice: "已生成练习", supplement: "补充资料", none: "暂无生成内容",
};

function fileIcon(kind: SourceFileKind) {
  switch (kind) {
    case "pptx": return <span className={styles.fileGlyph}>P</span>;
    case "pdf": return <FileText size={23} aria-hidden="true"/>;
    case "markdown": return <FileCode2 size={23} aria-hidden="true"/>;
    case "feishu": return <Link2 size={23} aria-hidden="true"/>;
    default: return <FileQuestion size={23} aria-hidden="true"/>;
  }
}
/** File type, synchronization and CoursePack generation are independent. */
export function SourceFileCard({
  title = "学习资料", files, onOpenFile, onRetrySync, onViewAll,
  compact = false, className = "",
}: SourceFileCardProps) {
  return <PopPanel className={[styles.sourceCard, compact ? styles.sourceCompact : "", className].filter(Boolean).join(" ")}>
    <div className={styles.cardHeading}>
      <span className={[styles.headingIcon, styles.headingIconBlue].join(" ")} aria-hidden="true"><FolderOpen size={21}/></span>
      <h2>{title}</h2>
      {onViewAll && <button type="button" className={styles.textAction} onClick={onViewAll}>查看全部 <ChevronRight size={18}/></button>}
    </div>
    {files.length === 0 ? <div className={styles.emptyFiles} role="status">
      <CloudOff size={29} aria-hidden="true"/>
      <strong>暂无资料</strong><span>飞书资料同步后会显示在这里</span>
    </div> : <ul className={styles.fileList}>
      {files.map(file => {
        const status = sourceStatusPresentation(file);
        const synced = file.syncState === "synced";
        const openable = Boolean(file.href || onOpenFile);
        const filename = file.name || "未命名资料";
        const detail = <>
          <span className={[styles.fileIcon, styles["kind_" + file.kind]].join(" ")} aria-hidden="true">{fileIcon(file.kind)}</span>
          <span className={styles.fileText}>
            <strong title={filename}>{filename}</strong>
            {!compact && file.subtitle && <small title={file.subtitle}>{file.subtitle}</small>}
            {compact && synced && <span className={styles.syncedText}><CheckCircle2 size={13} aria-hidden="true"/> 已同步</span>}
          </span>
          {!compact && synced ?
            <span className={[styles.outcomeTag, styles["outcome_" + file.outcome]].join(" ")}>{OUTCOME_LABELS[file.outcome]}</span> :
            !synced ? <span className={[styles.syncTag, styles["syncTag_" + status.kind]].join(" ")}>
              {status.kind === "syncing" ? <LoaderCircle size={14} aria-hidden="true"/> :
                status.kind === "error" ? <AlertCircle size={14} aria-hidden="true"/> : <CloudOff size={14} aria-hidden="true"/>}
              <span>{status.label}</span>
            </span> :
            <span className={styles.syncedIcon} aria-label="已同步"><Check size={16} strokeWidth={3}/></span>}
          {openable && <ChevronRight className={styles.fileChevron} size={18} aria-hidden="true"/>}
        </>;
        const accessibleLabel = "打开资料：" + filename + "，" + status.label;
        return <li className={[styles.fileRow, styles["fileRow_" + status.kind]].join(" ")} key={file.id}>
          {file.href ? <Link href={file.href} className={styles.fileOpen} aria-label={accessibleLabel}>{detail}</Link> :
            onOpenFile ? <button type="button" className={styles.fileOpen} onClick={() => onOpenFile(file.id)} aria-label={accessibleLabel}>{detail}</button> :
              <div className={styles.fileOpen}>{detail}</div>}
          {file.syncState === "error" && onRetrySync && <button className={styles.retryButton} type="button"
            onClick={() => onRetrySync(file.id)} aria-label={"重试同步：" + filename}><RefreshCw size={14} aria-hidden="true"/> 重试同步</button>}
          {file.syncState === "syncing" && Number.isFinite(file.syncPercent) &&
            <div className={styles.syncTrack} role="progressbar" aria-label={filename + "同步进度"}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, Math.round(file.syncPercent!)))}>
              <span style={{width: Math.max(0, Math.min(100, file.syncPercent!)) + "%"}}/>
            </div>}
        </li>;
      })}
    </ul>}
    {compact && files.length > 0 && <div className={styles.sourceSummary} aria-label="资料同步概况">
      <span><CheckCircle2 size={14} aria-hidden="true"/> {files.filter(file => file.syncState === "synced").length} 已同步</span>
      <span><RefreshCw size={14} aria-hidden="true"/> {files.filter(file => file.syncState === "syncing").length} 同步中</span>
      {onViewAll && <button type="button" onClick={onViewAll}>查看资料 <ArrowRight size={14}/></button>}
    </div>}
  </PopPanel>;
}
