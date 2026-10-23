# 知序 Learning Hub · Pixel Pop Design System v1.0

这是人类设计师、Codex、Qoder 和其他模型共同遵循的**设计契约**，不是一份每次重新绘制的参考图片。

## 不可改变的视觉 DNA

**65% 新粗野主义，25% 像素学院，10% 轻量化留白。**这是视觉强调的相对权重，非面积占比。

- 新粗野主义：黑色粗描边、硬阴影、几何错位、大字阶层、黄紫蓝对比及明显按钮反馈；有鲜明主视觉，但**不模仿 Persona 5 的专有素材或菜单**。
- 像素学院：统一的小猫 PixelCat（仓库内 SVG 组件，不得换脸重绘）、有限像素装饰、轻量成就感与探索气氛。
- 留白：阅读正文、公式、代码、练习题坚持平静的白色底，保持合理行宽和清楚的层级；装饰绝不盖住教学信息。

统一风格三个密度：\`minimal\` 极简（收敛装饰）、\`balanced\` 较简（默认）、\`normal\` 正常（展示更多视觉元素）。
切换仅改变视觉密度，不改变学习内容、课程数据或已保存进度。

## 单一事实来源（从这里复用，不要重新发明）

| 路径 | 角色 |
| --- | --- |
| \`web/src/design/pixel-pop/spec.mjs\` | **机器可读的颜色、形态、权重、密度及组件清单** |
| \`web/src/design/pixel-pop/pixel-pop.css\` | 所有 \`.pp-root\` 内共享样式，桌面/移动布局 |
| \`web/src/design/pixel-pop/primitives.tsx\` | \`PopPanel\`, \`PopButton\`, \`PixelCat\`, \`ProgressRing\` |
| \`web/src/design/pixel-pop/pixel-pop-home.tsx\` | 页面结构与视图演示：主页、阅读、可运行栈实验、练习 |
| \`web/src/app/page.tsx\` | 新 UI 当前仅在分支首页预览 |
| \`web/tests/library/pixel-pop-design.test.mjs\` | 合同与设计密度回归测试 |

标志色值：\`ink #12121D\`、\`violet #7440FF\`、\`blue #246BFF\`、
\`yellow #FFE342\`、\`mint #24DBA6\`、\`coral #FF6E75\`。
卡片粗线 3px，偏移阴影 5px，基础圆角 14px。正文使用易读系统中文字体，不使用像素字体。

**设计原则：页面像漫画一样有性格，但课程像教材一样清楚。**同一套组件跨首页、课程阅读器、实验室、做题页、资料库复用。

## 组件及课程适配规则

\`PopPanel\` 是容器、\`PopButton\` 是基础操作反馈，\`PixelCat\` 是唯一吉祥物。
新教育内容使用现有 CoursePack JSON 白名单组件，不允许模型为每个章节生成任意 JS 注入主站。

- 阅读页：正文优先，目录和来源次要；数学公式/代码不变为装饰图。
- 实验页：真实可操作的模拟器居中，配输入、结果和步骤；不是只可看的动图。
- 做题页：一个明确的答题焦点，错误解释直接跟在题目之后；不靠夸张奖励干扰学习。
- 首页：继续学习是主要动作；私人飞书资料、课程和进度清楚可达；演示值必须标记为演示。
- 未来知识地图：可以游戏化探索，不能改变真实知识关系和完成条件。
- 不加入文档变视频功能。

## 面向其他模型的可复制启动指令

> 请先读取 docs/PIXEL_POP_DESIGN_SYSTEM.md、
> web/src/design/pixel-pop/spec.mjs、pixel-pop.css、primitives.tsx、pixel-pop-home.tsx。
> 你必须复用原有组件、色值与固定 PixelCat，不准私创另一套配色、变更小猫形象或把 P5 视觉素材移植过来。
> 设计配比固定为 65% 新粗野主义、25% 像素学院、10% 阅读留白。所有新页面同时支持 minimal/balanced/normal 三档密度。
> 使用现有 Next.js16/React19/Lucide 技术栈，优先真实可用的交互和 CoursePack 数据；最小增量开发，不重建整个网站。
> 提交前至少测试手机 390px、平板 768px、桌面 1440px 的布局，检查导航、按钮焦点、长中文、状态反馈、低动态偏好与 UI 模式切换；只报告实际执行过的测试与截图。
> 严格区分演示内容、私人飞书来源与真实学习进度。不要要求用户上传秘钥，未经明确授权不要自动发布私人内容。

## 真实验收与后续工程

当前版本的 Push、Pop、重置和答题反馈可在浏览器直接使用，但主页的课程/进度是**明确标记的示例**。
所有档位保存到当前浏览器 \`localStorage.zhixu_pixel_pop_density\`，不占用 Supabase 数据。
开发分支的主页变化不会自动变更生产站点；待人工查看 Vercel Preview 后再合并。

下一个增量：在 PR #19 / #20 完成后，把同一套共享 Pop 组件嵌入真正的个人 CoursePack 阅读器，与每个用户的课程来源及学习进度关联，不要重复发明第二套独立阅读器。

复用检索：
- https://github.com/neobrutalism/neobrutalism — MIT、shadcn 风格组件，参考交互轮廓与硬阴影；当前项目无 Tailwind，因此暂不整套接入。
- https://github.com/joangeldelarosa/pxlkit — 像素元素与图标参考；完整使用前核对许可。
- https://github.com/storybookjs/design-system — 组件文档与视觉回归的方法；暂不为早期页面引入完整基础设施。
