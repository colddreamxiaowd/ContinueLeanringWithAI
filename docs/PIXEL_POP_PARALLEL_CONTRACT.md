# Pixel Pop · 并行开发契约 v1 (知序 Learning Hub)

## 事实与数量（基于 feature branch）

**8 个不同的已导出可复用组件**（不是 8 个已验收上架组件）：
\`PopPanel\`、\`PopButton\`、\`ProgressRing\`、\`Xiaozhi\`、
\`XiaozhiLayers\`、\`BrandHeader\`、\`StackMonument\`、\`CourseHero\`。

\`PixelCat\` 是小知兼容别名，不另算。\`MiniBadge\`、\`StackPlayground\`、
\`QuizCard\` 还只是 \`pixel-pop-home.tsx\` 中**不能直接从其他模块导入**的局部组件。
\`DashboardContent\`、\`ReaderContent\`、\`LabContent\`、
\`QuizContent\`、\`PixelPopHome\` 是组合页面，不算独立积木。

数目以 \`web/src/design/pixel-pop/spec.mjs\` 中
\`PIXEL_POP_COMPONENT_REGISTRY\` 为权威。
状态 \`css-coupled\`：只有祖先 \`.pp-root\` 和
\`pixel-pop.css\` 被正确加载时才有样式。
状态 \`visual-review\`：已可渲染，但概念图对照尚未最终签收。
**不能将“CI 通过”等同于“视觉还原已完成”。**

## 不变的品牌锁（不允许各会话私自修改）

1. **65% 新粗野主义 / 25% 像素学院 / 10% 安静留白**：是强调比例，不是面积像素配额。
2. 正文/按钮的设计令牌见 \`spec.mjs\`：\`ink #12121D\`、
   \`violet #7440FF\`、\`blue #246BFF\`、
   \`yellow #FFE342\`、\`mint #24DBA6\`、
   \`coral #FF6E75\`。组件 CSS 优先用 \`var(--pp-*)\`，不要再建局部设计令牌。
   **小知 25 色母稿与课程主题插画的原始颜色属于资产例外**，不能强制替换成 UI 色板。
3. 粗描边 3px、5px 硬阴影、明显的标题层级。正式阅读器/题干使用白底和清晰字阶；不要给正文、答题区加大量像素装饰。
4. 所有使用小知的地方导入现成 \`Xiaozhi\`；不可重绘、换脸、添加深色模式白边。
5. \`minimal\`、\`balanced\`、\`normal\` 是同一内容与操作状态的三档视觉密度。不得各自形成独立产品。
6. 不新做文档转视频、与 CoursePack 无关的周边功能，不把演示学习记录冒充真实数据。
7. 目标参考：用户选定的黄色新粗野主义首页（1448×1086）及阅读/实验/做题概念图。**尚未把所有批准截图作为带哈希资产放进仓库，不能只凭文字声称视觉保真**。截图必须与候选页面同视口对照。

## 多会话文件所有权

从同一份**冻结基线 SHA**创建每个分支。以当前契约分支
\`feat/pixel-pop-parallel-contract-v1\` 获准后的 HEAD 为基线，
在任务开始时记住确切 SHA；并行执行过程中不可悄悄漂移基线。
PR 都指向同一基线或由整合者重新择基；不能互相“接力改”公共文件。

| 工作会话 | 一次最多三块 | 唯一允许写入的前端目录 | 禁止越界 |
| --- | --- | --- | --- |
| A · 框架 | \`SidebarNav\`、\`DensitySwitch\`、\`BreadcrumbTrail\` | \`web/src/design/pixel-pop/workstreams/shell/\` | 不修改现有 \`BrandHeader\`、设计 token |
| B · 首页卡片 | \`CourseProgressCard\`、\`SourceFileCard\`、\`StudyTaskCard\` | \`.../workstreams/dashboard/\` | 不改来源接口或写假真实进度 |
| C · 阅读器 | \`LessonContent\`、\`ChapterOutline\`、\`SourceCitation\` | \`.../workstreams/reader/\` | 不另建主题，不破坏来源追溯 |
| D · 学习交互 | **先抽取** \`StackPlayground\`、\`QuizCard\`，再做 \`AnswerFeedback\` | \`.../workstreams/learning/\` | 不独立改教程数据源或 CoursePack schema |
| I · 整合者（单人） | 接入首页、阅读、实验、做题；解决跨文件冲突 | **唯一**有权调整 \`page.tsx\`、全局 \`pixel-pop.css\`、\`primitives.tsx\`、\`spec.mjs\`、\`mascot/**\`、\`blocks/lego*.\` | 不重画已签收的各零件 |

各工作会话只在自己的 `workstreams/<领域>/` 目录内写组件、样式及 `Demo.tsx` 预览模块；
如需测试，可额外创建唯一命名的 `web/tests/library/pixel-pop-<领域>-*.test.mjs`。
中央 `/ui-lab` 路由由整合者统一接入各会话 Demo，避免并行修改同一路由。
共享 `pixel-pop.css` 在此阶段仍是容器基础样式，独立预览必须显式提供 `.pp-root` 祖先；
新组件的局部 CSS 尽量只通过 `var(--pp-*)` 使用规范值。

所有会话对其他目录只读。每批不超过 3 块，使用独立 CSS Module，
**单个零件单独渲染并截屏**，接口/状态由调用者传入。实现时阅读已有
\`PopPanel\`、\`PopButton\`、\`ProgressRing\` 的代码，而不是复刻另一版。
如需要修改共享接口，仅在 PR 描述写变更提案，不由工作会话自行改共享文件。
原有真实 Feishu / CoursePack 的 PR #19 / #20 尚未合并；接入由整合者决定。

## 自检和交付

- 输出组件 \`tsx\` + 局部 CSS Module + 独立案例预览 + 针对真实交互的轻量测试。
- 附 1440px、768px、390px **真实截图**，标记每项是否实际完成。
- 检查 3 档密度、正常/深色、小知 24px 和 32px、键盘操作、无横向滚动、错误反馈。
- \`cd web && npm run test:library && npm run typecheck && npm run build\`。
- 对照参考图：几何、颜色/字重、描边/阴影、像素资产与留白逐项打分；
  记录仍有差异，不得仅以截图“差不多”过审。
- 禁止自行合并 PR、重写全站 CSS、引入不必要的大型 UI 框架。

## 多会话共同起手提示词

> 你是知序 Learning Hub 的 Pixel Pop 组件精修设计师，只负责本会话分配的 2–3 块积木。
> 从整合者指定的同一个冻结基线 SHA 创建自己的工作分支；
> 先读 \`docs/PIXEL_POP_DESIGN_SYSTEM.md\`、
> \`docs/PIXEL_POP_LEGO_WORKFLOW.md\`、
> \`docs/PIXEL_POP_PARALLEL_CONTRACT.md\`、
> \`docs/XIAOZHI_CHARACTER_BIBLE.md\`、
> \`web/src/design/pixel-pop/spec.mjs\`、
> \`web/src/design/pixel-pop/primitives.tsx\` 和本会话相关真实页面。
> 保持新粗野主义 65%／像素学院 25%／安静留白 10%；小知只导入共用组件。
> 你只能写本会话指定的 \`workstreams/<你的领域>/\` 文件，
> 不得直接覆盖全局 CSS、主页面、token、母版或其他会话代码。
> 优先让组件可运行、有真实 Props 与交互状态；每批最多三个；完成后提交独立 PR，
> 附三种宽度真实截图、测试结果和与概念图仍有的差异。
> 不要求整合者接受未经视觉验收的设计，不擅自合并。
