"use client";

import {BarChart3, CalendarDays, Check, ChevronRight, ClipboardCheck, Play} from "lucide-react";
import {PopPanel} from "../../primitives";
import styles from "./dashboard.module.css";

export type StudyTaskKind = "video" | "practice" | "quiz";
export type StudyTaskStatus = "not-started" | "in-progress" | "completed";
export interface DashboardStudyTask {
  id: string;
  title: string;
  kind: StudyTaskKind;
  status: StudyTaskStatus;
  durationMinutes: number;
  subtitle?: string;
}
export interface StudyTaskCardProps {
  title?: string;
  dateLabel?: string;
  tasks: readonly DashboardStudyTask[];
  onOpenTask?: (taskId: string) => void;
  onViewAll?: () => void;
  compact?: boolean;
  className?: string;
}
const TYPE_LABEL: Record<StudyTaskKind, string> = {video: "视频学习", practice: "动手练习", quiz: "章节测验"};
const STATE_LABEL: Record<StudyTaskStatus, string> = {
  "not-started": "未开始", "in-progress": "进行中", completed: "已完成",
};

export function StudyTaskCard({
  title = "今日学习", dateLabel, tasks, onOpenTask, onViewAll,
  compact = false, className = "",
}: StudyTaskCardProps) {
  return <PopPanel className={[styles.taskCard, compact ? styles.taskCompact : "", className].filter(Boolean).join(" ")}>
    <div className={styles.cardHeading}>
      <span className={[styles.headingIcon, styles.headingIconYellow].join(" ")} aria-hidden="true"><CalendarDays size={22}/></span>
      <h2>{title}</h2>
      {dateLabel && <span className={styles.taskDate}>{dateLabel}</span>}
      {onViewAll && <button type="button" className={styles.textAction} onClick={onViewAll}>查看全部 <ChevronRight size={18}/></button>}
    </div>
    {tasks.length === 0 ? <div className={styles.emptyTasks} role="status">
      <ClipboardCheck size={30} aria-hidden="true"/><strong>今天还没有学习任务</strong>
      <span>任务安排将在这里显示</span>
    </div> : <ul className={styles.taskList}>
      {tasks.map(task => {
        const statusText = STATE_LABEL[task.status];
        const kindText = TYPE_LABEL[task.kind];
        const content = <><span className={[styles.taskIcon, styles["taskKind_" + task.kind]].join(" ")} aria-hidden="true">
          {task.status === "completed" ? <Check size={21} strokeWidth={3}/> :
            task.kind === "quiz" ? <ClipboardCheck size={20}/> : <Play size={19} fill="currentColor"/>}
        </span>
        <span className={styles.taskText}><strong>{task.title}</strong>
          <small>{task.durationMinutes} 分钟 · <span className={styles["state_" + task.status]}>{statusText}</span>
            {!compact && task.subtitle ? <span> · {task.subtitle}</span> : null}
          </small></span>
        {task.status === "completed" ? <span className={styles.taskCompleted} aria-label="已完成"><Check size={18}/></span> :
          <span className={styles.taskBars} aria-hidden="true"><BarChart3 size={21}/></span>}</>;
        return <li key={task.id} className={[styles.taskRow, styles["taskState_" + task.status]].join(" ")}>
          {onOpenTask ? <button type="button" className={styles.taskAction} onClick={() => onOpenTask(task.id)}
            aria-label={kindText + "：" + task.title + "，" + statusText}>{content}</button> :
            <div className={styles.taskAction}>{content}</div>}
        </li>;
      })}
    </ul>}
  </PopPanel>;
}
