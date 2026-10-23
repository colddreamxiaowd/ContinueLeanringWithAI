"use client";

import Link from "next/link";
import {AlertCircle, ArrowRight, CheckCircle2, ChevronRight, CloudOff, FileCode2, FileQuestion, FileText, FolderOpen, Link2, LoaderCircle, RefreshCw} from "lucide-react";
import {PopPanel} from "../../primitives";
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
  course: "已生成课程", practice: "已生成练习", supplement: "作为补充资料", none: "尚未生成",
};
function fileIcon(kind: SourceFileKind) {
  switch (kind) {
    case "pptx": return <span className={styles.fileGlyph}>P</span>;
    case "pdf": return <FileText size={25} aria-hidden="true"/>;
    case "markdown": return <FileCode2 size={25} aria-hidden="true"/>;
    case "feishu": return <Link2 size={26} aria-hidden="true"/>;
    default: return <FileQuestion size={25} aria-hidden="true"/>;
  }
}
function syncLabel(file: DashboardSourceFile) {
  if (file.syncState === "synced") return "已同步";
  if (file.syncState === "syncing") {
    return "同步中" + (Number.isFinite(file.syncPercent) ? " · " + Math.min(100, Math.max(0, Math.round(file.syncPercent!))) + "%" : "");
  }
  return file.syncState === "error" ? "同步失败" : "未同步";
}
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
      <CloudOff size={30} aria-hidden="true"/>
      <strong>暂无资料</strong><span>同步资料后会显示在这里</span>
    </div> : <ul className={styles.fileList}>
      {files.map(file => {
        const openable = Boolean(file.href || onOpenFile);
        const detail = <><span className={[styles.fileIcon, styles["kind_" + file.kind]].join(" ")} aria-hidden="true">{fileIcon(file.kind)}</span>
          <span className={styles.fileText}><strong title={file.name}>{file.name}</strong>
            {!compact && file.subtitle && <small>{file.subtitle}</small>}
            {file.syncState !== "synced" && <span className={[styles.fileSyncInline, file.syncState === "error" ? styles.fileError : ""].join(" ")} role="status">
              {file.syncState === "syncing" ? <LoaderCircle size={13} aria-hidden="true"/> : file.syncState === "error" ? <AlertCircle size={13} aria-hidden="true"/> : <CloudOff size={13} aria-hidden="true"/>}
              {syncLabel(file)}
            </span>}
          </span><span className={[styles.outcomeTag, styles["outcome_" + file.outcome]].join(" ")}>{OUTCOME_LABELS[file.outcome]}</span>
          {openable && <ChevronRight className={styles.fileChevron} size={18} aria-hidden="true"/>}</>;
        return <li className={styles.fileRow} key={file.id}>
          {file.href ? <Link href={file.href} className={styles.fileOpen} aria-label={"打开资料：" + file.name}>{detail}</Link> :
            onOpenFile ? <button type="button" className={styles.fileOpen} onClick={() => onOpenFile(file.id)} aria-label={"打开资料：" + file.name}>{detail}</button> :
              <div className={styles.fileOpen}>{detail}</div>}
          {file.syncState === "error" && onRetrySync && <button className={styles.retryButton} type="button" onClick={() => onRetrySync(file.id)} aria-label={"重试同步：" + file.name}><RefreshCw size={15}/> 重试</button>}
          {file.syncState === "syncing" && Number.isFinite(file.syncPercent) && <div className={styles.syncTrack}
            role="progressbar" aria-label={file.name + "同步进度"} aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.max(0, Math.round(file.syncPercent!)))}>
            <span style={{width: Math.min(100, Math.max(0, file.syncPercent!)) + "%"}}/>
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
