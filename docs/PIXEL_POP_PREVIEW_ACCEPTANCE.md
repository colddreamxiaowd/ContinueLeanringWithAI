# 知序 Pixel Pop｜每批组件必须交付预览 · 验收契约 v1

**适用对象：Session A/B/C/D + 整合者 I。自本文件并入或明确选用后生效。**
这是可执行的交付标准；不是要求继续写报告、重跑无关审核或延后实际开发。
共同视觉基准是用户认可的概念图：65% 新粗野主义、25% 像素学院、10% 内容留白。SVG/像素角色使用 `.agents/skills/svg-fidelity-engineering/SKILL.md`。

## 0. 当期状态（2026-10-23）
- A #27（导航）：CI 通过，尚无实际 Next.js 三视口截图；A 有 `ShellDemo` 和视觉验证脚本。
- B #28（首页卡片）：CI 通过。整合者 #32 挂载了 `/ui-lab/session-b` 和 `/ui-lab/session-b/overview`，真实 Chromium 三视口截图已生成；Vercel 最新版受 build-rate-limit 限制。
- C #30（阅读）：CI 通过，有 Chromium 截图，但使用 React 16 兼容渲染壳和图标替身；Next.js 实装预览仍待补。
- D #29（交互）：CI 通过，栈/答题有实际行为单元测试；缺整合者挂载的真实 Next.js 三视口截图。

**四组可继续开发，但不据此认定高保真视觉全部合格。**

## 1. 每次迭代交付合约（不能只回一句“好了”）

每组在每批最多三个组件完成时必须交付：
1. **可以实际打开、点击的组件预览**，含正常/错误/空态/完成态等本批相关状态；
2. **三档真实截图**：1440×900、768×1024、390×844。至少 `balanced` 必须实拍；三档密度影响布局时补 `minimal/balanced/normal` 组合；
3. **运行方式**：公网 Preview URL（若部署成功）或独立本地 Next.js 页面路径 + 启动命令；GitHub Actions 截图 ZIP 供远程审阅；
4. **实际交互**：按钮能触发反馈，演示数据必须注明 Demo，不能把模拟进度当作已保存的 CoursePack 学习记录；
5. **视觉对照**：在相同视口与字体条件下对照用户批准的组件概念图，指出最多 3 个最重要的偏差，并直接修改本批代码；
6. **自动验证结果**：`cd web && npm run test:library && npm run typecheck && npm run build`，以及本批相关的状态测试；
7. **交付链接**：本批 GitHub PR + 截图 artifact + 预览入口。不能把 GitHub 构建日志或 AI 渲染概念图当作实际页面预览。

如果因 Vercel build-rate-limit 无法访问公网，也必须交付：
- 真正 Next.js 本地可复现的页面（`npm ci && npm run build && npm run start`）；以及
- GitHub Actions 上传的真实 Chromium 桌面/平板/手机截图；
- 预览地址明确标明**本地/云端不可访问**，不伪称部署成功。

## 2. 统一路由、文件所有权与顺序

整合者 I 单独拥有：
- `/ui-lab/session-a`：A 的 `ShellDemo`
- `/ui-lab/session-b`：B 的 `DashboardCardsDemo`
- `/ui-lab/session-b/overview`：B 的首页实际组合
- `/ui-lab/session-c`：C 的 `ReaderDemo`
- `/ui-lab/session-d`：D 的 `LearningDemo`

各工作会话只改自己的 `web/src/design/pixel-pop/workstreams/{shell,dashboard,reader,learning}/` 和唯一命名测试，不能直接抢公共路由或重绘小知。整合者在独立预览分支同步 A/B/C/D 的最新工作文件，挂载路由，构建并截图，然后将 URL/artifact 回填相应 PR。各工作会话收到实拍结果后才做最终视觉精修。

## 3. 浏览器证据矩阵

| 项目 | 验证要求 |
| --- | --- |
| 来源 | 真正 Next.js + React 版本；不能仅使用离线 HTML 或兼容渲染壳替代最终实拍 |
| 字体 | 中文字体已安装/可加载；避免全变方块造成的虚假排版通过 |
| 布局 | 1440 / 768 / 390 无水平溢出；长文字、文件名截断与按钮换行合理 |
| 主题 | 亮/暗至少检查本批可见场景；小知不额外产生亮色外描边 |
| 密度 | `minimal / balanced / normal` 意义一致且确实改变信息密度 |
| 内容 | 阅读/引用/实验/测验是真实可交互组件，示例数据明确标注 |
| 动效 | `prefers-reduced-motion` 可用，动画反映真实状态，不是假动图 |
| SVG | 使用共享 `svg-fidelity-engineering`；小知只来自固定母版 |

## 4. 建议参考实现

GitHub [PR #32](https://github.com/colddreamxiaowd/ContinueLeanringWithAI/pull/32) 已成功实现：
- Next.js 路由 `/ui-lab/session-b` 与组合页面；
- Chrome DevTools Protocol 截图脚本 `web/scripts/capture-pixel-pop-session-b.mjs`；
- `.github/workflows/pixel-pop-b-preview.yml` 自动上传 1440/768/390 实际截图 ZIP；
- 中文 Noto 字体安装、页面无横向溢出检查、有效组件存在性检查。

A/C/D **优先复用该截图基础设施**，只替换目标路由和组件存在性断言，避免三个会话分别造一套复杂的截图工具。完整 SVG 技术可以使用项目级 Skill，普通布局的截图不得被 SVG 校验替代。

## 5. 每个会话提交格式

```text
本批：A/B/C/D · <组件名 2–3 个>
PR 与 Commit：
本地页面：npm ci / npm run dev -> http://localhost:3000/ui-lab/session-?
在线 Preview：<真实 URL 或“Vercel 额度限制，暂无公网预览”>
截图：1440 / 768 / 390 的真实截图 ZIP 或 GitHub Actions artifact URL
交互：点了哪些控件 / 测了哪些状态 / 与用户数据是否隔离
SVG Fidelity Skill：本批使用在哪个素材上；若无 SVG 修改写“不适用”
测试：通过/失败的真实记录
概念图仍有的 1–3 个差异：
下一轮给用户可调的 1–3 个选项：
```

用户可以直接回复“改第二个卡片的高亮颜色／减弱描边／阅读区更宽”等，开发者以最新截图为输入迭代**同一个组件**，无需重新拆项目。
