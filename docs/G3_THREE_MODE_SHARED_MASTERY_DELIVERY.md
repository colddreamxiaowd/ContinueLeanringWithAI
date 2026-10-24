# 知序 G3｜同一份资料三种课程方案与共享知识点掌握

版本 2026-10-24。开发基线 `79fc00bb2492070d87749cd8c4cd0f333a19a2e3`，目标为已有 Cloudflare 预览分支，**不会自动并入 main**。

## 用户工作流

1. 登录 `/learn/plans`；如果没有飞书文件，先到 `/library` 按既有流程连接飞书并同步授权文件夹。
2. 选择已经同步的 PPTX、DOCX 或 XLSX。点击「从这份资料生成三套课程」。
3. 服务端使用当前 Supabase 会话，检验 `library_items.user_id`，使用该账号飞书 OAuth token 下载单个文件（≤15 MiB），复用原有 Office Reader。
4. 提取原始可读文本与定位警告，计算文件 SHA-256，按源段落建立统一知识点列表。用确定性规则生成 **深度理解 / 课件忠实 / 纯应试** 三种教学策略；不把来源中没提到的内容伪装成事实，也不伪造考试高频题目。
5. 保存为一个课程族 `course_plan_families`，由 `(user_id,library_item_id,source_sha256,planner_version)` 唯一索引防止重复创建。所有方案复用同一组 `conceptId`，而不是生成互不兼容的三套进度。
6. 用户可以直接切换模式、选知识点、先独立作答、再查看原始摘录并核对；标记「已阅读/练习中」或者「自评能够复述」。
7. 标记通过私有 HTTP API 写入 `course_concept_mastery`。数据库安全函数验证家庭/知识点归属，通过 `greatest(old,new)` 原子升级状态。任何一个模式读到相同记录，刷新或者更换设备后按真实账号重新加载。
8. 原件被编辑后（SHA-256 改变）产生不同的课程族与掌握记录，不会套用过期成果。原文件仅从同步索引删除时，已生成课程与自评掌握记录继续存在。

## 基本交付

- `web/src/lib/course-plan-modes.mjs`：服务端从真实提取文本生成同源三方案，稳定知识点标识和策略契约。
- `web/src/lib/course-plan-view.mjs`：浏览器中的三模式教学任务、共享掌握等级、明确合成演示样例。
- `web/src/lib/private-office-source.ts`：Office Reader 和课程生成端点复用同一套所有权验证和一次性下载/提取。
- `GET/POST /api/course-plans`，`GET /api/course-plans/[id]`，`POST /api/course-plans/[id]/mastery`：账号受保护服务端路由。
- `/learn/plans`：真正的私人制课入口；`/ui-lab/plan-modes`：无真实资料的明确合成演示入口。
- `supabase/migrations/202610240004_three_mode_course_plans.sql`：课程族、共享自评掌握及原子写入 RPC；必须在原有 001–003 migrations **之后**执行。

## 生产数据库迁移和后台配置

1. 在自己的 Supabase 项目执行 `supabase/migrations/202610240004_three_mode_course_plans.sql`。新表 `course_plan_families`、`course_concept_mastery` 应存在并启用 RLS。
2. Worker Runtime Secrets 沿用原有 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY` 与 Feishu OAuth 配置，无新外部凭据。
3. 用两个真实账号 A/B 验收：A 生成、切换、更新掌握并重新登录；B 无法读取 A 的课程 ID 或修改 A 的知识点记录；并以普通 Supabase JWT 测试 RLS。
4. 用真正授权的 PPTX 逐页对照来源，以 15 MiB 和部分图像/公式的解析限制为准。

## 明确质量边界

此版本是**可靠的同源三种课程教学方案 + 共享知识点自评记录 MVP**，不是完整的 AI 教师。
- 没有调用大模型；先建立可信数据与交互闭环。讲解改写、自动出题、客观题判题、知识图谱、考前智能排程与复杂多资料融合依然属于后续 G3+ 开发。
- `level=1` 仅表示已学习或练习，`level=2` 仅表示用户自评能够复述；它们都**不等于**通过客观评测或独立迁移。
- 当前浏览器答题输入是页面草稿，不写入共享的掌握表；只有明确点击的掌握标记被保存。
- 源文本可能含表格、公式、幻灯片图片，Office Reader 会返回定位可信度和提取警告。未解析的材料不作无证据补写。
- 当前源码和 GitHub CI 使用合成数据验证。Supabase/Feishu 真实账户授权、生产 migration、真实文件准确性需在平台配置后实测。

## 自动化验收证据

- `npm run test:v45` 包含三模式规划纯函数测试、同源共享概念映射、版本隔离和来源为空拒绝制课。
- `npm run test:library` 确保之前的 PPTX/XLSX 文本提取仍正常。
- `node scripts/test-g3-private-http.mjs` 实际启动 Next.js，模拟两个不同 Supabase 用户并测试课程族隔离、掌握原子升级、非本族概念拒绝、受保护网页；这是**合成 HTTP 验证**，不是外部真实认证。
- `node scripts/capture-g3-three-mode.mjs` 在真实 workerd/Cloudflare URL 中以 1440/768/390 浏览器逐项切换三模式、自评、刷新恢复并保存截图。
