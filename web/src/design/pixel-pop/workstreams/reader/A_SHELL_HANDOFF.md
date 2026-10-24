# Session C → I 整合者：接入 Session A 共享外壳

## 版本锁与所有权
- C: PR #30 `feat/pixel-pop-reader-session-c`（以 PR HEAD 为准）
- A: PR #27 `feat/pixel-pop-shell-session-a-20261023` / 冻结用于本批回归的 SHA `92ce1bb2cf23d17a4f3bd68ce280deba17719314`
- 合同基线：`011d3aa5ea391b89cc551488ac3a2e528d018f6b`
- ShellIntegrationFrame / BrandHeader / SidebarNav / DensitySwitch / route 都由 I/A 管理；C 只管理 reader 目录以及 C 专用 QA 工作流。

## 现成的接口
在 I 拥有的页面层，使用 A 的 `ShellIntegrationFrame` 传入 `surface="reader"`, `navigation`, `crumbs`，在 `children` 中渲染 **`<ReaderDemo embedded />`** 做实验室验收（正式课程应渲染同一套 `LessonContent/ChapterOutline/SourceCitation`，由真实 CoursePack 提供 Props）。

`embedded` 专门用于消除 C 的独立 Hero、重复 `.pp-root` 与本地密度切换；外层 A frame 负责品牌/导航/密度的唯一状态源。该模式保留 C 的读文章、章节定位、复制代码、引用、移动目录、来源面板与 CoursePack v0.1 演示切换。演示数据严格标注合成，不指向飞书原件。

不要把 Demo 的固定讲义、学习目标或进度带到生产。真实课程先用 `web/src/lib/coursepack.mjs` 的 `validateCoursePack` 校验，再运行 `adaptCoursePackV01`；`sourceRefs[].locator` 仅是位置线索，真实 `href` 只允许来自有权限的来源库。

## 复现临时 A+C 整合预览（不会提交 A 文件到 C PR）

```bash
git checkout feat/pixel-pop-reader-session-c
git fetch --no-tags origin 92ce1bb2cf23d17a4f3bd68ce280deba17719314
git checkout FETCH_HEAD -- web/src/design/pixel-pop/workstreams/shell
node web/src/design/pixel-pop/workstreams/reader/prepare-shell-integration.mjs
cd web
npm ci
npm run dev
# http://localhost:3000/ui-lab/session-c
```

这些命令**会修改本地工作树**，适合临时验收目录或独立 worktree，执行后不要把 A 文件和临时生成的路由提交进 C PR。专属 `.github/workflows/session-c-next-preview.yml` 在 GitHub Actions 工作区自动生成上述组合并上传截图与交互 JSON；无需在你的正式工作区运行。

## 布局语义与验收
- A 顶层仅有一个 `.pp-root`；品牌 Header、SidebarNav、BreadcrumbTrail、DensitySwitch 都来自 A，不允许重复 Demo 页头。
- C `integratedReader` 用 container query 适配 A slot：桌面阅读正文 + 目录/来源组合侧栏；较窄容器纵向排列；390px 显示可展开的章节目录与独立来源面板。
- 只有桌面宽容器才要求右侧总容器 sticky；来源应在这个 sticky 容器内可滚动访问，**不要求来源详情和目录拥有两个并列 sticky 位**。
- 检查代码 CSS 计算字号不小于 13px；手机 SVG 原生文字不能被缩到 12px 以下；图示保持原生 SVG path；网页自身不横向溢出（代码块内部可以水平滚动）。
- 验证滚动中段的 sticky 坐标；真实 clipboard 内容；引文点击、悬停暂时预览及移出回退；跨章节 focus；A 抽屉 Escape；390px 章节定位、来源打开关闭。
- 每次真实 Chrome 截图应明确说明 Next.js 的具体组合 SHA，不把 Actions 临时组合等同于已合并线上发布。

## 合并决策
I 会话负责把 A、C PR 通过整合分支合成正式路由，并解决与 B 的最终布局冲突。C PR #30 保持 Draft，无权自行合并。验证完成不等于用户完成视觉签收。
