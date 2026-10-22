# ContinueLeanringWithAI

AI 驱动的个人学习网站：长期整理学习资料、Blog、题库、交互实验和学习成果。

## 项目现状（2026-10-22）

- 根目录保留 V4.1–V4.3 的 Python 内容流水线：PPTX 解析、SHA-256 指纹、增量处理、私有内容存储和导入接口；完整测试 33/33 通过（含 V4.5 导出测试）。
- 原 V1–V4.1 Next.js / React / TypeScript 网站源码已经找回，放在 [`web/`](web/)；不再处于“网站源码缺失”状态。
- V4.5 已把现有 Python 流水线处理的两份合成 PPTX 接入网站：`/sources` 列出 2 份资料，`/sources/demo/[documentId]` 逐页展示标题、正文、表格和来源位置；PR #10 已合并（merge `3694a02`）并上线。
- 当前 GitHub Pages 地址仍是旧的静态审查预览：[https://colddreamxiaowd.github.io/ContinueLeanringWithAI/](https://colddreamxiaowd.github.io/ContinueLeanringWithAI/)。V4.6 转向动态 Next.js 部署，正式公网功能需在 Vercel 配置 Supabase 与飞书环境变量。
- V4.6 公网多用户资料库正在开发：邮箱/密码账号、每个用户独立授权飞书、递归文件夹索引、TXT/图片/PDF 在线预览和其他二进制文件下载；需要 Vercel + Supabase 环境变量后才能完成线上验收。
- 真实飞书 API 验证仍未执行；真实课程文件、来源元数据和私人课件未进入公开仓库。

来源归档：`ContinueLeanringWithAI_V4_1_review.zip`，SHA-256 `cf93040b36f9a1f5711fd8caff01304dd353e2ca8d905cd2d65920318981035a`。恢复记录见 [`docs/PROJECT_INITIALIZATION.md`](docs/PROJECT_INITIALIZATION.md)。

## 网站（web/）

```bash
cd web
npm ci
npm run dev          # http://localhost:3000
npm run test:models  # 5/5
npm run test:v3      # 14/14
npm run test:v45     # 5/5
npm run typecheck
npm run build        # 静态导出到 web/out/（15 个页面）
npm run check:v45:static
```

主要路由：`/`、`/courses`、`/courses/[slug]`、`/read/[slug]`、`/sources`、`/sources/demo/[documentId]`、`/experiments`、`/experiments/sparse-transpose`、`/review/v2`、`/review/v4`。

网站 README、设计说明和运行边界见 [`web/README.md`](web/README.md)。公网资料库的环境配置与验收步骤见 [`docs/V46_PUBLIC_LIBRARY.md`](docs/V46_PUBLIC_LIBRARY.md)。

### 隐私边界

- 公开仓库不包含真实课程文件名、原始 SHA-256、真实页码映射或由真实课件派生的矩阵数据。
- V3 实验使用明确标记的合成样例 `web/content/v3-sample/source.json`。
- V4.5 网站演示只使用 `web/fixtures/v2/synthetic-stack-lesson.pptx` 与 `web/fixtures/v45/synthetic-integration-deck.pptx` 两份合成 Fixture，生成 `web/src/data/v45-demo/`。
- 原 V4.1 归档中的 `pipeline/`、v2/v4 Python 原型和真实来源提取脚本未复制到 `web/`。
- 原归档不含 `review-preview/`；恢复版指向实际存在的 `web/public/lab-v3.html` 和 `web/public/v4-review.html`，没有伪造缺失文件。

## 飞书实验入口

| 入口 | 实际行为 | 文档 |
| --- | --- | --- |
| `feishu-inventory-manual.yml` | 手动通过应用凭证读取 PPTX 元数据，不下载 | [说明](docs/FEISHU_GITHUB_ACTIONS.md) |
| `feishu-user-inventory-manual.yml` | 手动通过用户 OAuth 读取 PPTX 数量，不下载 | [说明](docs/FEISHU_USER_OAUTH.md) |
| `feishu-hash-manual.yml` | **手动**临时下载 PPTX、校验结构、计算 SHA-256；仅缓存匿名化指纹 | [说明](docs/FEISHU_HASH_INVENTORY.md) |

飞书实验工作流仍全部为手动触发。GitHub Pages 是旧的静态预览，已停止自动发布；公网动态版本通过 Vercel 部署，飞书访问由各网站用户单独授权。GitHub Actions 不接收生产密钥，也不调用真实飞书。

飞书凭证只允许进入 GitHub Actions Secrets；不要写入源码、日志、PR 或聊天。

## 测试入口

```bash
# 根目录 Python 流水线（V4.1–V4.5 共 33 项）
python -m unittest discover -s tests -p "test_*.py" -v

# 网站
cd web
npm ci
npm run test:models
npm run test:v3
npm run test:v45
npm run typecheck
npm run build
npm run check:v45:static
```

网站 CI 见 `.github/workflows/v44-web-tests.yml`，针对 `web/**`、`scripts/**`、`tests/**`、`requirements-v42.txt` 及工作流自身变更执行 V4.5 导出复现校验、`npm ci`、三组测试、类型检查、默认与 Pages basePath 构建及静态页面检查。公开审查预览由 `.github/workflows/v44-pages.yml` 在 `main` 的 `web/` 变更后构建并发布到 `gh-pages` 分支；不包含后端、飞书调用或 secrets。

## 边界

- 合并与发布已由用户明确授权；当前仅部署静态审查预览，未启用后端、数据库或真实飞书。
- 不把真实课件、解析文本、凭证或用户令牌提交到公开仓库。
- 真实飞书内容处理需要明确授权和本地凭证；当前使用合成/离线数据。
- V4.6 公网资料库使用 Supabase 账号体系和每用户独立的飞书 OAuth；真实数据不会进入公开静态资源或 Git 仓库。
- 重要版本由 DEV 审查，用户保留最终合并与发布决定。
