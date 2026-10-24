# 知序核心学习闭环｜2026-10-24 研发交付与边界

基线：Cloudflare 发布分支 `deploy/cloudflare-vinext-preview-v1` 的已部署 G1 版本（`2ddf306b`）。
此文档对应独立功能分支 `feat/core-learning-math-20261024`；其验证和部署以对应 CI 和 PR 为准。

## 目标与实际交付

1. **G1-R 增量**：`/learn` 保留原 CoursePack v0.1 API；添加每用户本机最近课程 ID 的恢复、服务器保存的 `lastLocation`（章节/块）可选扩展，保留已有旧的 `completedBlockIds/answers/simStacks`。
2. **G2 可靠来源素材**：原有私有 Feishu Office reader 支持 `?format=chunks`。PPTX 依据 presentation slide ids + relationships 确认展示顺序，XLSX 依据 workbook sheet relationships 确认工作表名称；不存在可靠关系时明确标记 `locatorVerified=false`，不将文件编号冒称实际页码。产生 owner-scoped hash SourceChunks 并记录提取不足、图像未解析警告。原有 JSON reader 未破坏。
3. **G4-M L3 数学试点**：`/ui-lab/math/` 公开合成课程；`/learn/math/` 需要登录。两个不同结构的问题分别是不放回抽取和阳性后验筛查，确定性分数引擎、解释/引导/独立模式，数值输入、修改、判断、错题保留、迁移题及开放式原创笔记。切换模式不清空数据；本机自动保存和 JSON 导出。
4. **G5-H 小型事件链**：服务端 `GET/POST /api/learning/math-events` 需当前账号会话；对开放式解法只写 `unverified`；对客端提交的 `correct` 声称重新独立判定；记录 `user_id` 由会话取得；`client_event_id` 幂等。独立的 `learning_exploration_events` migration 不改旧进度或 v0.1 schema。
5. **现有产品**：Pixel Pop Shell、小知、三个综合 Demo 和 /library、/coursepacks 保持现有基线，不引入另一套视觉框架。

## 外部项目复用边界

| 候选 | 当前决定 | 原因 |
|---|---|---|
| MathLive / Compute Engine | 暂不引入 | 首轮问题需要的有理数运算可审计且依赖为零；等用户真正需要复杂数学输入、符号等价时接入成熟库 |
| JSXGraph | 暂不引入 | 现阶段先使用响应式 CSS 条形视觉解释条件事件；之后探索拖动点、几何或统计图再接入 |
| OpenMAIC | 仅调研制作流程 | 已有课程与 UI 不应换框架；自动多资料生成未经过真实来源质量验收 |

## 本轮验收与不应夸大的能力

- 纯数学模型：枚举组合校验、筛查后验、分数/小数/百分比输入、无效数据、状态恢复与未验证探索保存。
- 素材定位：复合测试 OOXML `ppt/presentation.xml` 和 Relationships，确认重新排序也不会伪造页码；确认 XLSX 显示工作表名称以及无完整关系数据时按不确定处理。
- 浏览器/云端：Next.js 生产构建、TypeScript、vinext、实际 workerd 和 Chromium 桌面 1440、平板 768、手机 390；对独立迁移题和刷新后恢复执行真实点击测试。
- 探索 API：使用本地**合成 Supabase HTTP 替身**执行两个账号的授权/隔离、判题复核、幂等、笔记未验证状态与受保护路由。

**不能宣称已完成：**
- 尚无实际 Supabase 登录账号及数据库 Migration 执行确认，不存在可核实的跨设备真实持久化证据。
- 尚未取得一份用户明确授权的真实飞书原件，因此没完成 G2 真实来源对照及 G3 多源高质量课程制作。
- G4 数学例题是明确标识的合成教学活动，不是自动从个人飞书课件生成。
- 尚无真实学习者“独立迁移能力提升”的教学实验证据，不能宣称 L3 教学成效已在真实用户中验证。
- G6 全自动生成与异步分析仍未研发。

## 真实上线的外部依赖

在 Cloudflare Worker Runtime Variables/Secrets 中配置 Supabase publishable URL/key 与服务器 secret，以及 Supabase 中执行 `202610220002_coursepacks.sql`、`202610240003_learning_explorations.sql` 等必要 migration。秘钥只由用户通过控制台输入，不复制进 GitHub 或聊天。

两名用户测试账号需验证：A 保存 CoursePack，B 无权读取、修改，A 可以恢复课程/章节/探索事件；RLS 直接客户端访问也拒绝 B。飞书授权则需要真实应用权限、回调 URL 和获授权来源文件。
