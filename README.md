# ContinueLeanringWithAI

AI 驱动的个人学习网站：长期整理学习资料、Blog、题库、交互实验和学习成果。

## 项目现状（2026-10-22）

- 根目录保留 V4.1–V4.3 的 Python 内容流水线：PPTX 解析、SHA-256 指纹、增量处理、私有内容存储和导入接口；完整测试 33/33 通过（含 V4.5 导出测试）。
- 原 V1–V4.1 Next.js / React / TypeScript 网站源码已经找回，放在 [`web/`](web/)；不再处于“网站源码缺失”状态。
- V4.5 已把现有 Python 流水线处理的两份合成 PPTX 接入网站：`/sources` 列出 2 份资料，`/sources/demo/[documentId]` 逐页展示标题、正文、表格和来源位置；PR #10 已合并（merge `3694a02`）并上线。
- 网站已在本地完成依赖安装、类型检查、测试和生产构建，生成 15 个静态页面；已部署 GitHub Pages 公开审查预览：[https://colddreamxiaowd.github.io/ContinueLeanringWithAI/](https://colddreamxiaowd.github.io/ContinueLeanringWithAI/)（静态只读，不是生产环境）。
- V4.6-A 本地私有访问网关正在独立分支开发：固定回环监听、限时签名会话、只读资料 API；首轮测试只使用合成数据，尚未合并或部署。
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

网站 README、设计说明和运行边界见 [`web/README.md`](web/README.md)。网站与根目录 Python 流水线保持目录边界；本轮没有把飞书读取强行接入前端。

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

飞书工作流仍全部为 `workflow_dispatch`，没有定时执行、内容生成或自动发布。网站另有 `.github/workflows/v44-pages.yml`，在 `main` 的 `web/**` 变更后构建 GitHub Pages 静态预览；不包含飞书调用或 secrets。用户令牌可能过期；Actions Cache 不是长期内容数据库。

飞书凭证只允许进入 GitHub Actions Secrets；不要写入源码、日志、PR 或聊天。

## 测试入口

```bash
# 根目录 Python 流水线（V4.1–V4.5 基线 33 项；V4.6-A 新测试在独立 PR 中验证）
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
- V4.6-A 本地私有网关仅在独立分支开发；本地原型不等于生产认证服务，真实私有存储接入仍需单独核准。
- 重要版本由 DEV 审查，用户保留最终合并与发布决定。
