"use client";

import {useState} from "react";
import {CourseProgressCard, type ChapterProgressStatus, type ProgressChapter} from "./CourseProgressCard";
import {SourceFileCard, type DashboardSourceFile, type SourceSyncState} from "./SourceFileCard";
import {StudyTaskCard, type DashboardStudyTask, type StudyTaskStatus} from "./StudyTaskCard";
import styles from "./demo.module.css";

const INITIAL_CHAPTERS: ProgressChapter[] = [
  {id: "ch1", title: "栈的基本概念", status: "completed"},
  {id: "ch2", title: "栈的 Push / Pop", status: "current"},
  {id: "ch3", title: "栈的应用场景", status: "available"},
  {id: "ch4", title: "综合练习", status: "available"},
  {id: "ch5", title: "章节测验", status: "locked"},
];
const INITIAL_FILES: DashboardSourceFile[] = [
  {id: "ppt", kind: "pptx", name: "数据结构.pptx", subtitle: "课程主讲内容 · 32 页 · 2 天前同步", outcome: "course", syncState: "synced"},
  {id: "pdf", kind: "pdf", name: "栈与队列_课后习题.pdf", subtitle: "习题与参考答案 · 12 页 · 3 天前同步", outcome: "practice", syncState: "synced"},
  {id: "md", kind: "markdown", name: "笔记：栈的实现与应用.md", subtitle: "个人笔记 · 4 天前同步", outcome: "supplement", syncState: "synced"},
  {id: "feishu", kind: "feishu", name: "面试高频：栈的常见题型", subtitle: "飞书云文档 · 1 页 · 5 天前同步", outcome: "course", syncState: "synced"},
  {id: "updating", kind: "pptx", name: "新增课程资料.pptx", subtitle: "模拟同步进度，可用按钮推进", outcome: "none", syncState: "syncing", syncPercent: 60},
  {id: "failed", kind: "pdf", name: "待重试的例题.pdf", subtitle: "模拟同步失败，可重试", outcome: "none", syncState: "error"},
];
const INITIAL_TASKS: DashboardStudyTask[] = [
  {id: "video", kind: "video", title: "栈的 Push / Pop", durationMinutes: 8, status: "in-progress"},
  {id: "practice", kind: "practice", title: "栈的应用场景", durationMinutes: 12, status: "not-started"},
  {id: "quiz", kind: "quiz", title: "章节测验", durationMinutes: 10, status: "completed"},
];

export default function DashboardCardsDemo() {
  const [density, setDensity] = useState<"minimal" | "balanced" | "normal">("balanced");
  const [chapters, setChapters] = useState<ProgressChapter[]>(INITIAL_CHAPTERS);
  const [files, setFiles] = useState<DashboardSourceFile[]>(INITIAL_FILES);
  const [tasks, setTasks] = useState<DashboardStudyTask[]>(INITIAL_TASKS);
  const [lastAction, setLastAction] = useState("点击课程、文件或任务，查看独立组件的真实交互回调。");
  const selectChapter = (id: string) => {
    const chapter = chapters.find(item => item.id === id);
    if (!chapter || chapter.status === "locked") return;
    setChapters(previous => previous.map(item => {
      const status: ChapterProgressStatus = item.id === id ? "current" : item.status === "current" ? "available" : item.status;
      return {...item, status};
    }));
    setLastAction("已选择章节：" + chapter.title + "（只更新演示组件的本地状态）");
  };
  const openTask = (id: string) => {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    setTasks(previous => previous.map(item => {
      const status: StudyTaskStatus = item.id === id && item.status === "not-started" ? "in-progress" : item.status;
      return {...item, status};
    }));
    setLastAction("打开任务：" + task.title + " · " + task.kind);
  };
  const retryFile = (id: string) => {
    setFiles(previous => previous.map(item => {
      const syncState: SourceSyncState = item.id === id ? "syncing" : item.syncState;
      return item.id === id ? {...item, syncState, syncPercent: 0} : item;
    }));
    setLastAction("已触发模拟同步重试：" + id);
  };
  const advanceSync = () => {
    setFiles(previous => previous.map(item => {
      if (item.syncState !== "syncing") return item;
      const syncState: SourceSyncState = (item.syncPercent ?? 0) >= 100 ? "synced" : "syncing";
      return {...item, syncState, syncPercent: syncState === "synced" ? 100 : Math.min(100, (item.syncPercent ?? 0) + 20)};
    }));
    setLastAction("手动推进模拟同步进度（非真实飞书同步）");
  };
  return <div className="pp-root" data-density={density}>
    <main className={styles.demo} aria-label="B 工作流 · 首页卡片独立预览">
      <header className={styles.demoHeader}>
        <div><span className={styles.demoEyebrow}>PIXEL POP / WORKSTREAM B</span>
          <h1>首页学习卡片组件</h1>
          <p>三块独立积木 · 用合成内容展示状态与操作，不使用真实 CoursePack 记录。</p></div>
        <fieldset className={styles.densitySwitch}><legend>布局密度</legend>
          {(["minimal","balanced","normal"] as const).map(mode => <button key={mode} type="button"
            aria-pressed={density === mode} onClick={() => setDensity(mode)}>{mode}</button>)}
        </fieldset>
      </header>
      <div className={styles.demoStatus} role="status">{lastAction}</div>
      <section className={styles.section} aria-label="组件二：课程进度卡">
        <div className={styles.sectionHead}><span>02</span><h2>CourseProgressCard</h2><p>受控章节状态 / 继续学习 / 完成进度</p></div>
        <div className={styles.progressExamples}>
          <CourseProgressCard progressPercent={68} chapters={chapters} onOpenChapter={selectChapter}
            onContinue={() => setLastAction("继续学习：" + (chapters.find(item => item.status === "current")?.title ?? "无当前章节"))}
            onViewAll={() => setLastAction("查看全部章节")}/>
          <div className={styles.compactExamples}>
            <div className={styles.variantCase}><span className={styles.variantTag}>低进度状态（0–30%）</span>
            <CourseProgressCard compact progressPercent={20} chapters={[
              {id:"v1",title:"第一节",status:"completed"},
              {id:"v2",title:"第二节",status:"current"},
              {id:"v3",title:"第三节",status:"available"},
              {id:"v4",title:"第四节",status:"available"},
              {id:"v5",title:"第五节",status:"available"}]} onContinue={() => setLastAction("继续学习低进度课程")}/></div>
            <div className={styles.variantCase}><span className={styles.variantTag}>已完成状态</span>
            <CourseProgressCard compact progressPercent={100} chapters={[
              {id:"a",title:"已完成第一节",status:"completed"},
              {id:"b",title:"已完成第二节",status:"completed"}]}
              onCertificate={() => setLastAction("查看结课证书（演示动作）")}/></div>
          </div>
        </div>
      </section>
      <section className={styles.section} aria-label="组件三：学习资料卡">
        <div className={styles.sectionHead}><span>03</span><h2>SourceFileCard</h2><p>文件类型 / 生成结果 / 同步状态</p></div>
        <div className={styles.sourceExamples}>
          <SourceFileCard files={files.slice(0,4)} onOpenFile={id => setLastAction("打开资料：" + id)}
            onViewAll={() => setLastAction("查看全部资料")}/>
          <div className={styles.compactExamples}>
            <div className={styles.variantCase}><span className={styles.variantTag}>同步中 / 失败状态</span>
            <SourceFileCard title="同步状态" compact files={files.slice(4)}
              onOpenFile={id => setLastAction("选择资料：" + id)} onRetrySync={retryFile}/></div>
            <button type="button" className={styles.demoButton} onClick={advanceSync}>推进模拟同步 +20%</button>
            <div className={styles.variantCase}><span className={styles.variantTag}>空状态</span>
              <SourceFileCard title="空状态" compact files={[]}/></div>
          </div>
        </div>
      </section>
      <section className={styles.section} aria-label="组件四：今日学习任务卡">
        <div className={styles.sectionHead}><span>04</span><h2>StudyTaskCard</h2><p>视频 / 练习 / 测验 · 三种任务状态</p></div>
        <div className={styles.taskExamples}>
          <StudyTaskCard dateLabel="演示日程" tasks={tasks} onOpenTask={openTask}
            onViewAll={() => setLastAction("查看所有学习任务")}/>
          <StudyTaskCard title="任务状态样例" compact tasks={tasks} onOpenTask={openTask}/>
          <StudyTaskCard title="空状态" compact tasks={[]}/>
        </div>
      </section>
    </main>
  </div>;
}
