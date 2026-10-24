# 知序 × 网页版 ChatGPT 固定项目会话｜制课交接协议 v1

## 产品边界

这是用户主动完成的**文件交接 + ChatGPT 制课 + CoursePack 导入**闭环，不是直接通过 API 将消息注入指定 ChatGPT 网页对话。当前 ChatGPT 网页会话与 OpenAI API Responses/Conversations 数据存储不互通，没有供第三方站点依照私聊 URL 写入该对话的公开机制。本项目**不索取 ChatGPT Cookies、身份 Token、账号密码，不模拟登录或劫持浏览器会话**。

用户自己提供的固定 ChatGPT 项目会话地址只在其当前浏览器 `localStorage` 保存 `zhixu_course_gpt_chat_link_v1`；**不会提交到公开 GitHub、发送到知序后端或自动变成其他用户的默认会话**。

## 当前真实功能

1. 打开登录后的 `/learn/gpt-handoff/`，可直接选择本机 PPTX / PDF / DOCX / XLSX / Markdown / TXT。选择文件只在浏览器保留名称/大小，**不上传知序后端**；真正原件需在 ChatGPT 网页中亲自附加。
2. 或登录 `/learn/plans/`，选择飞书授权资料并生成三模式课程族，在其底部新交接区下载：
   - `zhixu-gpt-handoff-*.json`：来源 SHA-256、完整可提取段落、来源定位及可信度、知识点 ID、当前制课模式、可选自评掌握状态。大于安全上限时拒绝，而非无声截断。
   - 原始 Office 文件：`GET /api/library/items/[id]/original`，复用所有权检查和 15 MiB 限制，下载时带 `Cache-Control: private, no-store`。飞书 App 未配置或权限失效会明确失败，**不把私人文件做成免鉴权公链**。
3. 用户将资料文件与交接 JSON 上传到所选 ChatGPT 项目对话，复制专门的制课指令，选择 A 忠实、B 深度、C 应试。GPT 输出一个可以独立保存的 CoursePack v0.1 JSON。
4. 在同一交接区选取 GPT 输出的 JSON（或粘贴纯 JSON），先以现有 `validateCoursePack` 规则校验，再经 `POST /api/coursepacks` 服务端二次校验，以当前登录账号私人保存。
5. 对话超过上下文窗口时：先在旧会话人工核对进展，填入已完成、剩余、已确认的教学决定，下载 `zhixu-session-continuation-*.md`。从同一 ChatGPT **项目**新建聊天，附上原件、交接包、续接提示及已有成品，防止上下文丢失。

## 目前支持的 CoursePack v0.1 交互

- `explanation` 讲解（Markdown 纯文本/结构化显示）。
- `quiz` 多项选择题（2–6 选项、确定正确答案、进度记录）。
- `code` 源码阅读（只读，不执行）。
- `stack-simulator` 栈操作实验（仅数据结构栈主题合理）。

**不能任意让 GPT 生成 React/JS 并在知序执行**：避免 XSS 与不受控互动。概率滑块的真实实践位于独立 `/learn/math`；未来可以经过审核加入 CoursePack 新 block 类型。目前如果教学需要不支持的可交互实验，让 GPT 另提组件建议，不能混入 v0.1 JSON。

## 操作步骤

1. 在 `/learn/gpt-handoff/` 粘贴你私人 ChatGPT 项目会话 URL，点击保存。
2. 选择本地文件，或先使用 `/learn/plans/` 的飞书文件；选教学模式。
3. 点击「生成并下载交接包」；用单独的「下载授权原始课件」（如可用）获取源文件。
4. 点击「复制制课指令」和「打开固定制课会话」，**在 ChatGPT 中手动附上原始课件和交接 JSON**，发送制课指令。
5. 在 ChatGPT 中下载 `coursepack-*.json`；回到知序交接区导入、预览并点击「确认保存私人课程」；最后进入 `/coursepacks/` 或 `/learn/` 真正学习。
6. 达到上限时先让 GPT 总结上一会话，再下载续接提示，在**原 ChatGPT 项目**开新的会话继续（不是让网站自动访问聊天历史）。

## 正式联网验收

- 不存在硬编码私人会话 URL 或 ChatGPT Cookies / Token。
- 未登录 `/learn/gpt-handoff/` 跳转登录；未登录下载原件 HTTP 401；不同用户查询别人的资料索引下载得到 404。
- 生成出口保持图片/公式等未提取内容的风险提示，上传原始文件仍是必要步骤。
- 合成三模式 public `/ui-lab/plan-modes/` 可验证生成交接包按钮、指令及导入 UI，但公开演示**不进行真实私人数据库写入**。
- 生成的 JSON 必须经过浏览器和后端两次格式校验；格式通过并不保证计算题正确或来源引用真实。
- `course_concept_mastery` 的三模式自评记录仍在 G3 课程族层；**CoursePack v0.1 课内测验进度尚未自动关联到课程族共享掌握表**，不能宣称已经打通。
- 生产私有飞书文件端到端仍需 Cloudflare 飞书运行时凭据及用户实际授权文件。

## 后续完全自动化的可选分支

A. 用户本人授权的本地浏览器 Agent：从可信授权源导出后在已登录的个人 ChatGPT 网页中完成上传、发言与下载，需本地会话和明确人工授权；云端 Worker 不持有用户登录 Cookie。
B. 自建 OpenAI API Responses 制课服务：可实现真正后台自动生成/入库，但生成结果**不会自动变成上述网页版 ChatGPT 私人固定会话的消息**，调用量也与网页版额度分开。
C. 在 ChatGPT 项目中接入经 OAuth 授权的专用 App/MCP：由 ChatGPT 主动读取/写入知序受控 API，需要插件安装授权与额外安全实现，不依赖私聊 URL。

默认先沿 A 的人工确认型浏览器交接 MVP 保证真实资料、安全和数据正确性。
