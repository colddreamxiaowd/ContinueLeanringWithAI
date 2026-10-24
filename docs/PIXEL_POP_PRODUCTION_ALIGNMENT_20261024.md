# 知序｜Pixel Pop 生产跨页面一致性修复 · 2026-10-24

## 直接证据与根因

2026-10-24 用户在同一线上站点截图了：
- /read/circular-queue：旧版侧栏与顶栏；深色背景上的信息区层级和对比度异常
- /library：旧版 AppShell，真实索引 38 条但云盘浏览报 `FEISHU_APP_NOT_CONFIGURED`
- /sources：Cloudflare 运行时出错
- /courses：旧壳，卡片与背景不匹配
- /coursepacks：旧壳，按钮前还显示了字面 `\n`

源码核对：正式路由的 `AppShell` 与首页 `PixelPopHome` 分别渲染独立顶栏、侧栏与主题组件；源码并非完全漏合并，但集成 PR 的一部分视觉边界从未落到这些页面。PR #37 于 2026-10-24 13:40:29 UTC **随后合并至 main**，不会自动更新现有 Cloudflare 预览部署分支。

## 已完成的修复

1. 从首页抽出 `PixelPopSiteShell`，让真实首页、旧正式业务页共享**同一个 React 外壳和 CSS**：Logo、顶栏、课程搜索、响应式导航、3 档密度、浅/深色切换、唯一母版 Xiaozhi / PixelCat。
2. 保留原 AppShell 服务端业务内容，用极薄的兼容层接入新外壳；通过作用域内的可读纸张面板与设计令牌修复亮暗模式中的黑底深字。
3. `/sources` 的 `v45-demo-data` 从运行时 `node:fs` 同步读取迁移为构建时**静态 JSON import**，使 Cloudflare workerd 真正可以渲染其页面及合成幻灯片详情。
4. 私人飞书库缺 `FEISHU_APP_ID`、`FEISHU_APP_SECRET` 或历史 `FEISHU_TOKEN_ENCRYPTION_KEY` 时，展示明确错误信息，并自动切换到此前已有的「我的资料」索引视图；**不会声称授权 Token 已能实时访问云端文件**。
5. `/sources` 明确区分公开合成资料与真实私人资料，移除旧版固定断言「网站实时同步 = 0」。
6. 修复 CoursePack 页可见的字面 `\n`。
7. 窄屏将被挤压的搜索改成完整可展开输入框，并让 `/courses?q=...` 实际过滤课程、呈现空结果与清除筛选。

## 不动的边界

- 不修改小知原生 SVG 与已批准的 25 色母版，统一调用已有 PixelCat React 导出；避免复刻/白边倒退。
- 不修改 Supabase 数据、Token 或任何鉴权 API；保留旧账号与 38 条索引。
- 缺失的飞书 Runtime Secrets 由账号所有者在 Cloudflare 添加，**本 PR 不添加假 Token、不读密钥、不将私有文件公开**。
- 首页目前展示的学习进度仍为明确标记的演示，不混淆为私人 CoursePack。

## 验收

- `npm run test:v45`、`npm run test:library`、`npm run typecheck`、`npm run build`
- `npx vinext check`、`npm run build:vinext`
- Cloudflare workerd 的 `/`、`/courses/`、`/read/circular-queue/`、`/sources/` 与合成详情 HTTP 200；`/library/`、`/coursepacks/` 未登录跳转登录。
- Chromium 1440x900 / 768x1024 / 390x844 实际导航、内容对比度、溢出、主题切换持久化、课程真实搜索及移动端展开搜索；截图见 Workflow artifact。
- 推送到预览分支后，独立 Workflow 复跑公网 URL 的完整浏览器验收。
- **剩余人工项**：使用真实账号进入 `/library`、`/coursepacks` 并核对数据库及真实飞书 OAuth 刷新；用户签收视觉细节。
