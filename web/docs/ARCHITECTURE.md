# ARCHITECTURE · V1 技术方案

## 分层

```text
ChatGPT Project（讨论、审查）
           ↓
GitHub（代码、Skill、发布 Markdown、PR 审查）  ←  飞书（原件、资料登记；未配置）
           ↓                                   ↓
                未来受控内容处理后端
           ↓
Web（Next.js / React / TypeScript） → 未来 PostgreSQL（答题及学习状态）
```

## V1 已建

- Next.js App Router 静态输出 (`output: export`)，部署前必须完成真实构建验证。
- 同构设计 token：`src/app/globals.css` CSS 变量，默认浅色、完整深色变量与响应式。
- 路由：概览、课程、课程章节、文章、资料状态、实验规划。
- `src/data/catalog.json` 为演示数据唯一真源；TypeScript 类型定义在 `src/data/catalog.ts`。
- 原 V4.1 归档未包含 `review-preview/`；公开恢复版保留 Next.js 路由与 `public/lab-v3.html`、`public/v4-review.html` 作为审查入口，不伪造缺失文件。
- 纯函数 `src/lib/learning-model.mjs` 支持知识结构遍历、搜索、来源链接状态检查、重复 ID 检测。

## 后续数据库概念（设计方向，尚未实现）

`SourceDocument(id, sha256, external_id, version, mime, sync_state)` → `KnowledgePoint(id, course_id, chapter_id)` → `ArticleVersion(id, point_ids, source_refs, review_status, published_at)` → `QuestionVersion(id, knowledge_point_ids, source_refs, verified_answer)`。

学习记录独立于内容：`StudyEvent`, `Attempt`, `MasteryEvidence`, `ReviewSchedule`。用户活动不通过 Git commit 保存。

## 权限边界

- GitHub 认证连接已验证可读写指定私有仓库；本 V1 只在审查分支提出改动，未经批准不合并。
- 飞书当前无 ChatGPT 直接连接，后续采用飞书自建应用/开放平台 API，验证 token 范围、文件权限、下载解析、回写与事件/轮询权限。
- 自动生产与发布要使用安全保管的服务端密钥、幂等任务 key、独立审校；ChatGPT 原生定时任务不可假定能读 Project 附件。
- V1 没有登录、代码执行或发布 API；它们不是隐式完成项。

## V2 已实现的最小内容服务（2026-10-21）

见 [`V2_INGESTION.md`](V2_INGESTION.md)。离线 Python 命令读取 PPTX 并将来源页码/哈希、知识点、版本化草稿、待核验题库存为文件和本地 SQLite。Web `/review/v2` 仅展示静态合成课件审查成果，不从浏览器写文件或调用模型。后续模型生成须经受控后端或服务端环境变量显式启用，不能由客户端直接发送密钥。V2 Python 原型未包含在 `web/` 恢复快照中；本节保留设计记录。

## V3 · 浏览器本地代码执行

`experiments/sparse-transpose/engine.cpp` → 使用 `clang++ --target=wasm32-unknown-unknown` 编译成 `public/wasm/sparse_transpose.wasm` → 浏览器的 `WebAssembly.instantiate(...)` → `src/lib/sparse-lab-controller.mjs` 封装真实状态 → `public/lab-v3.html` 渲染/交互（在 `/experiments/sparse-transpose` 通过 iframe 集成）。

同一个 C++ 源文件另由 `g++` 生成原生测试程序，与独立的列优先朴素转置程序核对。V3 不引入任意用户代码运行器，避免将其投放到 Next.js 主业务进程。
