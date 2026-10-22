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
| `/sources` | 资料管理状态与 V4.5 合成演示资料 |
| `/sources/demo/[documentId]` | V4.5 合成资料逐页详情 |
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
npm run test:v45     # 5/5
npm run typecheck
npm run build        # 静态导出到 out/（15 个页面）
npm run check:v45:static
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
- `npm run test:v45`：5/5 通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，Next.js 16.4.2 生成 15 个静态页面；原有页面和两个合成资料详情页均生成。
- `npm run check:v45:static`：列表标题、详情页、页码、表格和 unsupported 提示通过。
- GitHub Pages basePath 构建与链接检查通过。
- 本地静态预览：`out/` 经本地 HTTP 服务打开后显示“知序 Learning Hub”首页。

## 数据与隐私

- `content/v2-fixture/` 是开发者生成的合成栈课件，用于流水线审查。
- `content/v3-sample/source.json` 是明确标记的合成稀疏矩阵样例；不对应任何真实课程文件。
- `fixtures/v2/synthetic-stack-lesson.pptx` 与 `fixtures/v45/synthetic-integration-deck.pptx` 都是合成 PPTX，不是用户上传的课件。
- `src/data/v45-demo/` 由现有 V4.3 流水线处理上述两份合成 Fixture 生成，包含 2 份资料、6 页；全部带 `synthetic` / `demo` 标记。
- 真实飞书授权、真实课件下载、数据库、账号和每日调度均未启用；GitHub Pages 静态审查预览已部署。
- 本目录不包含 `.env`、Token、认证信息或私人课件。

## V4.5 · 合成资料网站接入

- 数据链路：合成 PPTX → V4.3 `run_incremental()` → `read_document()` → `scripts/v45_export_synthetic.py` → `src/data/v45-demo/` → `/sources` → `/sources/demo/[documentId]`。
- 页面：列表显示 2 份合成资料（共 6 页）、版本和详情入口；详情页按页展示标题、正文层级、表格、页码和 `shape_index`，图片等 unsupported 块有明确提示。
- 安全：只处理白名单合成 Fixture；store 出现未知文档时导出直接失败；不读取真实飞书或私人课件。
- 详细说明与验证记录见 [`docs/V45_SYNTHETIC_INTEGRATION.md`](docs/V45_SYNTHETIC_INTEGRATION.md)。
- PR #10 已合并（merge `3694a02`）；main 上的 Pages 工作流已更新公开预览，V4.5 合成资料可在线上查看。

## 公开审查部署

- 公开审查预览：[https://colddreamxiaowd.github.io/ContinueLeanringWithAI/](https://colddreamxiaowd.github.io/ContinueLeanringWithAI/)
- 托管：GitHub Pages 项目站点（`gh-pages` 分支）；Next.js 静态导出，构建时使用 `NEXT_PUBLIC_BASE_PATH=/ContinueLeanringWithAI`。
- 工作流：`.github/workflows/v44-pages.yml`，仅在 `main` 的 `web/**` 变更后构建并发布到 `gh-pages` 分支。
- 这是静态只读审查预览，不是生产环境；没有后端、账号、数据库、飞书调用或自动发布。
- 本地 basePath 构建：

```bash
cd web
NEXT_PUBLIC_BASE_PATH=/ContinueLeanringWithAI npm run build
# Git Bash 下需在命令前加 MSYS_NO_PATHCONV=1，避免路径转换
```

## 与根目录流水线的关系

根目录保留已有的 V4.1–V4.3 Python 内容流水线（PPTX 解析、SHA-256 指纹、增量处理、私有内容存储与导入接口）。`web/` 只负责前端网站，不覆盖或重复实现根目录流水线；两者的后续接入需要在单独任务中验证。
