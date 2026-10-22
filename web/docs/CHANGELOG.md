# CHANGELOG

## V4.4 · 2026-10-22 · 原 V4.1 网站恢复 + GitHub Pages 预览

- 从用户指定的 `dev_网站` 会话恢复 `ContinueLeanringWithAI_V4_1_review.zip`（SHA-256 `cf93040b36f9a1f5711fd8caff01304dd353e2ca8d905cd2d65920318981035a`）。
- 将原 Next.js 网站放入 `web/`，保留首页、课程、阅读、资料、实验和两个审查页。
- 移除真实课程来源元数据；V3 改用 `content/v3-sample/source.json` 合成样例。
- 生成并提交 `web/package-lock.json`；`npm ci`、5 项模型测试、14 项 V3 测试、类型检查和生产构建通过。
- 新增仅针对 `web/` 的 CI；新增 GitHub Pages 静态审查预览工作流（构建时 `NEXT_PUBLIC_BASE_PATH=/ContinueLeanringWithAI`，发布到 `gh-pages` 分支），未调用真实飞书、未启用后端或生产发布。

> **恢复快照说明（V4.4）：** V2/V4 的 Python 原型与 `review-preview/` 未包含在 `web/` 恢复源码中；以下保留历史记录。当前可运行的是 Next.js 页面、合成数据与 V3 WebAssembly 实验。

## V2 · 2026-10-21（未发布、待审查）

- 新增 PPTX 逐页解析、SHA-256 文件指纹、页级变更识别、SQLite 版本化任务注册。
- 新增针对可识别“栈”知识点的离线草稿/题库生成，来源页码绑定和独立答案校验。
- 使用本轮合成的 4 页 PPTX 真实运行整条离线链路，生成 1 篇审查稿与 3 道题。
- 新增 `/review/v2` 静态审查路由；原归档未包含 `review-preview/v2.html`。
- 新增受控模型起草命令，但本轮不连接 OpenAI API，也不发送用户数据。
- 新增 V2 Python 测试、浏览器检查与记录；没有 GitHub 远端推送/合并/部署。

## V1 · 2026-10-21

- 首轮学习首页、课程目录、阅读器、演示数据模型与双主题。
- 使用静态浏览器预览做基础交互验证，尚无正式内容或生产部署。

## V3 · 2026-10-21 · 提交审查

- 原 V3 审查版曾使用真实课程材料；公开恢复版移除真实来源元数据，改用 `content/v3-sample/source.json` 合成样例。
- 新增固定可信 C++17 快速转置内核，编译至浏览器 WebAssembly，能够逐步运行/回退/运行到底。
- 新增交互矩阵、`cnum/cpot` 快照、独立朴素转置校验、预判题、提示与本地答题次数记录。
- 新增 Next.js 实验索引与实验路由；保留 V1/V2 的内容，并为离线审查生成单文件 HTML。
- 核验：14 项 WASM 核心自动测试（包含 200 组随机案例）；原归档记录 g++ 原生运行与 21 项 Chromium 检查；V4.4 补充 Next.js 生产构建验证。
- 安全边界：未引入任意 C++ 在线编译，尚未部署，未自动发布。

## V4（2026-10-21，待审查）

- 新增 `pipeline/v4.py`：本地/飞书文件枚举、哈希与提取文本版本比对、草稿处理编排、重试与未解决异常汇总。
- 新增 GitHub 持久状态仓库适配器、待审查草稿归档适配器、显式批准的 Draft PR 协议原型。
- 新增 `tests/v4/` 自动测试与 `.github/workflows/v4-manual-check.yml`（仅手动触发，无每日 schedule）。
- 用 V2 合成栈 PPT 和 V3 合成矩阵样例完成首轮本地扫描演示；公开版不包含真实课程文件。
- 尚未启用飞书授权、GitHub 远端自动写入、网站正式发布或每日调度。
