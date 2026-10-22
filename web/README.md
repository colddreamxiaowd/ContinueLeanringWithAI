# 知序 Learning Hub · 原 V4.1 网站恢复版

> 本目录是找回的原始 ContinueLeanringWithAI V4.1 Next.js 网站源码，按 V4.4 任务放入主仓库的 `web/`，不替代根目录的 Python 内容流水线。

## 来源与恢复边界

- 来源：用户指定的 `dev_网站` 会话中的 `ContinueLeanringWithAI_V4_1_review.zip` 附件。
- 归档 SHA-256：`cf93040b36f9a1f5711fd8caff01304dd353e2ca8d905cd2d65920318981035a`。
- 归档中的原始 Python 原型 `pipeline/`、v2/v4 Python 脚本和真实课程来源元数据**没有**复制到公开仓库。
- 真实课程文件、文件名、SHA-256、页码映射和派生矩阵数据没有进入本目录；V3 页面改用明确标记的合成样例 `content/v3-sample/source.json`。
- 原始 V4.1 归档不含 `review-preview/`；本目录保留现有页面，并把预览入口指向实际存在的 `public/lab-v3.html` 与 `public/v4-review.html`。没有伪造缺失的历史预览文件。

## 技术栈

- Next.js 16（App Router，`output: "export"`）
- React 19
- TypeScript 5.8+
- 原生 CSS 设计 token（`src/app/globals.css`）
- 固定受信 C++17 → WebAssembly 稀疏矩阵实验

## 页面路由

| 路由 | 内容 |
| --- | --- |
| `/` | 学习工作台首页 |
| `/courses` | 课程体系 |
| `/courses/[slug]` | 课程章节 |
| `/read/[slug]` | 技术文章阅读器 |
| `/sources` | 资料管理状态 |
| `/experiments` | 交互实验索引 |
| `/experiments/sparse-transpose` | 稀疏矩阵快速转置实验 |
| `/review/v2` | V2 合成课件处理审查 |
| `/review/v4` | V4.1 资料与内容工作台 |

## 本地运行与验证

要求 Node.js 22+（本轮验证环境：Node v24.12.0，npm 11.6.2）。

```bash
cd web
npm ci
npm run dev          # http://localhost:3000
npm run test:models  # 5/5
npm run test:v3      # 14/14
npm run typecheck
npm run build        # 静态导出到 out/
```

生产构建是静态导出，输出位于 `out/`；预览时不要使用 `next start`，可用任意静态文件服务器：

```bash
python -m http.server 8000 -d out
# 打开 http://localhost:8000
```

本轮实际验证结果：

- `npm ci`：通过。
- `npm run test:models`：5/5 通过。
- `npm run test:v3`：14/14 通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，Next.js 16.4.2 生成 13 个静态页面；课程页、阅读页、实验页和两个审查页均生成。
- 本地静态预览：`out/` 经本地 HTTP 服务打开后显示“知序 Learning Hub”首页。

## 数据与隐私

- `content/v2-fixture/` 是开发者生成的合成栈课件，用于流水线审查。
- `content/v3-sample/source.json` 是明确标记的合成稀疏矩阵样例；不对应任何真实课程文件。
- `fixtures/v2/synthetic-stack-lesson.pptx` 是合成 PPTX，不是用户上传的课件。
- 真实飞书授权、真实课件下载、数据库、账号、自动发布、部署和每日调度均未启用。
- 本目录不包含 `.env`、Token、认证信息或私人课件。

## 与根目录流水线的关系

根目录保留已有的 V4.1–V4.3 Python 内容流水线（PPTX 解析、SHA-256 指纹、增量处理、私有内容存储与导入接口）。`web/` 只负责前端网站，不覆盖或重复实现根目录流水线；两者的后续接入需要在单独任务中验证。
