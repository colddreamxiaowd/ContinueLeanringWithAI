---
name: svg-fidelity-engineering
description: 将已确认的 PNG/像素插画或既有 SVG 变成可编辑、可复现、可交付的原生 SVG。用于检查 SVG 假矢量（内嵌位图）、保真追踪、去白边、语义分层、缩放光学校正和真实浏览器渲染验收；适用于知序 A/B/C/D 所有涉及图标、插画、像素角色与 SVG 的后续任务。
---

# SVG Fidelity Engineering · 共享工程 Skill

## 唯一目标
让设计资产沿着 **参考素材 → 可编辑母版 → 语义图层 → 真实组件 → 可验证预览** 的顺序可靠复用。禁止用“看起来差不多”的重画版本替代已经认可的参考图。没有 SVG 资产的纯文字/布局任务不必做额外矢量化。

## 前置材料
1. 用户认可的原始 PNG/SVG 和参考设计图；标注图尺寸、SHA-256、版权来源和变更边界。
2. 当前网页里真实使用的 SVG/TSX/CSS、设计 tokens、小知母版和显示容器。
3. 交付用途：静态图标、24/32px 头像、可编辑部件或实际动画（它们要求不同）。
4. 若只有 RGB 合成截图，人工签收的前景蒙版是必需的。不能称算法自动抠出的 Alpha 为原始真值。

## 实际采用的方法（来自小知，不虚构）
- OpenCV：连通域、候选蒙版与闭运算；必须人工审查背景/白色物体混淆。
- Pillow/NumPy：读取 RGBA、颜色统计、校验前景像素。
- **颜色游程合并**：按同色像素逐行建游程，跨行垂直合并成矩形，再写入真实 `<path>`；不是把 PNG 包在 SVG 的 `<image>` 中。
- CairoSVG：原尺寸 SVG→PNG，比较前景 RGB、Alpha 与认可母版；Inkscape CLI 独立交叉渲染。
- Chromium：检查 390/768/1440 容器，DPR 1/2，亮色/深色，24/32/48/96/160px。
- TSX/CSS Modules：单一组件入口，尽量 inline path；通过控制语义状态实现真实交互，不为每个页面重新画图。
- VTracer、ImageTracerJS 仅作为复杂曲线/渐变追踪的备选；不能说它们生成了小知最终母版。

## 处理顺序
1. **inspect**：确认 SVG viewBox、<path>、<image>、<filter>、<mask>、文字字体依赖、CSS filter/drop-shadow 和 clip。
2. **确定输入类型**：少色硬边 RGBA 用像素精确路径；RGB 截图先审蒙版；复杂照片/抗锯齿插画采用成熟描摹并人工调曲线。
3. **建立不可变母版**：保留原始色值、轮廓、局部不对称和装饰，不因 UI 品牌色板而改写角色真实颜色。
4. **真正可编辑**：至少路径不是内嵌位图；要编辑帽子/五官还须语义 `<g data-part="...">`。分层后不重叠、不丢像素，静态重组必须与批准母版一致。
5. **深色去白边**：先诊断 halo 是背景混合、stroke、filter、阴影、圆形裁切还是二次 SVG `<image>` 采样；不删除角色正常的白色本体。
6. **缩放光学稿**：在 24/32px 检查嘴、眼、帽檐/图标关键线条。必要时提供独立 optical variant，不能因此改动大尺寸母版。
7. **真实浏览器复核**：用户要求的 A/B/C/D 预览均须有现场页面，不允许以 AI 概念图或仅 CI 通过作为截图证据。
8. **最终交付**：SVG 母版、组件 API、Demo 入口、差异与边界、截图和测试说明。零像素误差仅说明“选定基准尺寸 + 认可前景”内的 RGB/Alpha 保真，不代表任意缩放或艺术验收必然合格。

## 小知工程验证锚点
- `web/public/pixel-pop/xiaozhi-traced-master.svg`：573×573 的 25 色原生路径母版。
- `web/src/design/pixel-pop/mascot/XiaozhiLayers.tsx`：12 个部件，静态合成与母版 179751 个前景像素完全一致。
- `web/scripts/build-xiaozhi-layers.mjs --check`：检查分层生成的一致性。
- `web/tests/library/xiaozhi-native-vector.test.mjs` 与 `xiaozhi-semantic-fidelity.test.mjs`：防止退化成嵌图 SVG、颜色/轮廓漂移。
- `docs/XIAOZHI_VECTOR_FORENSICS.md`、`docs/XIAOZHI_EDGE_OPTICAL_RIG_FIX.md`：记录背景分离、深色白边和光学尺寸的正确证据边界。
- 一律通过现有 `Xiaozhi` 组件使用小知，**不得从概念图生成第二只小猫**。

## A/B/C/D 如何使用本 Skill
- A：导航图标 / 学士帽头像 / 深色边缘 / 折叠侧栏的小尺寸光学版。
- B：文件图标、奖杯、进度插画；只改卡片内容相关 SVG，通用 CSS 不需要像素矢量化。
- C：阅读页教学插图、算法图表、来源图标；数学文本和文档引用不受 SVG 像素规则干扰。
- D：Push/Pop/Stack 插画、状态变化和答题反馈小知；**静态外观保真与真正动画的状态正确性分开测试**。

## 验收级别
- A：原尺寸输入前景 RGB/Alpha 重渲染对比（适用时）。
- B：网页实拍尺寸、深浅主题、DPR，无严重糊边、白边、裁切或横向溢出。
- C：部件编辑与动作更新，不改变无关图层，关键动画与真实交互数据一致。

## 每轮不可省略的预览
阅读 `docs/PIXEL_POP_PREVIEW_ACCEPTANCE.md` 并遵守。每个会话每轮在本地可预览 Demo，提交整合者拥有的 Next.js `/ui-lab/session-{a,b,c,d}` 挂载需求；整合者须出实际 URL，或 GitHub Actions Chromium 截图 artifact + 可复现本地链接。
**只有截图，没有页面入口 = 不通过可交互预览验收**；Vercel 配额耗尽时使用 GitHub Actions 截图 artifact，保持本地 Next.js 命令可运行。

## 输出格式
记录：输入文件及版本、所选方法、真实发生的代码修改、失败/成功原因、运行命令、CI URL、可打开的网页预览 URL（或明确说明托管不可用）、桌面/平板/手机截图、已发现差异、下一轮仅需调整什么。未经实际验证不声称 99.99% 或像素级一致。

完整通用脚本包（Python 路径追踪、蒙版建议、CairoSVG 校验、浏览器截图）另以版本化 `svg-fidelity-engineering-skill-v1.0.zip` 提供；在代理环境需要该批量脚本时应安装完整包。仓库自带的小知重建脚本可独立使用。
