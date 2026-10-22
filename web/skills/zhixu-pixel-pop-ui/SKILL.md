---
name: zhixu-pixel-pop-ui
description: 维护知序 Learning Hub 的 Pixel Pop 视觉一致性和真实互动课程 UI。适用于页面设计、Next.js/React 组件实现、CoursePack 阅读/实验/做题页面、三档密度与小猫吉祥物；由 Qoder、Codex 和其他模型复用。
metadata:
  version: "1.0.0"
  product: "知序 Learning Hub"
---

# Pixel Pop — 知序统一设计 Skill

## 第一条：复用现有系统

必须先读：
1. \`docs/PIXEL_POP_DESIGN_SYSTEM.md\`（设计契约）
2. \`web/src/design/pixel-pop/spec.mjs\`（可机器读取的设计令牌）
3. \`web/src/design/pixel-pop/pixel-pop.css\`（真正生效的 CSS）
4. \`web/src/design/pixel-pop/primitives.tsx\`（组件及唯一小猫）
5. \`web/src/design/pixel-pop/pixel-pop-home.tsx\`（实际页面交互参照）
6. 本轮需要改动的真实 Next.js 页和 CoursePack 契约。

在这些文件确认后才能修改 UI，避免每个模型再发明一套界面。
如果需要新交互组件，先寻找仓库和 GitHub/Gitee 可复用成果，再按需添加。

## 不变的品牌基因

- 65% 新粗野主义：黑色明确描边、错位硬阴影、主视觉强调、大字阶层、紫蓝黄强对比。
- 25% 像素学院：固定 PixelCat，探索小细节、通关反馈。不得凭文本重新画小猫，不采用 P5 专有素材。
- 10% 留白：阅读页文字、数学图解、代码和答题区域始终安静清晰。
- 提供 \`minimal\`、\`balanced\`、\`normal\` 三档布局密度，**同一学习数据，同一套组件**。
- 禁止文档转视频功能；禁止把演示数据或虚构的进度当作用户真实结果。

## 开发执行顺序

1. 用一句话明确页面的用户任务：继续学、读懂、动手操作、独立做题、回溯来源。
2. 定义此页的一项主操作和一个成功反馈，再决定侧栏和补充信息是否需要。
3. 复用 \`PopPanel\`、\`PopButton\`、\`PixelCat\`、\`ProgressRing\` 和 \`.pp-*\` 令牌。
4. 使用真实功能。实验必须有输入、操作和状态；练习必须有答案与解释；来源展示必须有真实定位。
5. 让不同密度复用全部学习状态，不改变数据库及 CoursePack 契约。
6. 测试桌面 1440、平板 768、手机 390；检查长中文、表格/公式、键盘访问、焦点、低动态偏好。
7. 执行 \`cd web && npm run test:library && npm run typecheck && npm run build\`；通过后在 Preview 中人工核对目标画面。报告实际结果和未验收项目。
8. 新页面以独立 PR 提交；不得为了改样式一次重构飞书 OAuth 或 Supabase。

## 出货判定

最小交付：真实可访问的页面、至少一个真实交互、共享组件而非复制设计、三档密度、可核对的测试/截图。
停止条件：目标页面确实可用，比例与主视觉接近已认可的 Pixel Pop，未损坏学习数据。
没有浏览器截图时说明“CI 通过、尚未视觉验收”；不虚报 99.999% 还原度。

## 新模型起手提示词

> 采用 web/skills/zhixu-pixel-pop-ui/SKILL.md 执行 UI 开发。先读取设计契约、真实 CSS/组件和目标页面代码。严格复用 65/25/10 Pixel Pop，固定 PixelCat 和三档密度；优先实现真实课程交互，保留来源和学习记录。不做视频，不重画小猫，不换配色，不重搭一套 UI。实现后用仓库测试和实际预览验收，并明确哪些验收已完成。
