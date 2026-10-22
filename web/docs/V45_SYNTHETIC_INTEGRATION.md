# V4.5 合成资料网站接入

状态：已完成并合并（PR #10，merge `3694a02`），公开预览已上线；仅使用合成 Fixture，不连接真实飞书或私人课件。

## 数据来源

- `web/fixtures/v2/synthetic-stack-lesson.pptx`：原有的 4 页合成栈课件。
- `web/fixtures/v45/synthetic-integration-deck.pptx`：V4.5 固定合成样例，含正文、表格和图片（图片在 V4.2 中标记为 unsupported）。

`web/fixtures/v45/synthetic-integration-deck.pptx` 由 `python scripts/v45_make_fixture.py` 从代码生成；生成后作为固定 Fixture 提交，不在构建时重新生成。

## 流水线

```text
合成 PPTX
  → V4.3 run_incremental()（复用现有解析/去重/索引）
  → V4.3 list_documents() / read_document()
  → scripts/v45_export_synthetic.py
  → web/src/data/v45-demo/index.json
  → web/src/data/v45-demo/documents/<document_id>.json
  → web/src/app/sources/page.tsx
  → web/src/app/sources/demo/[documentId]/page.tsx
```

生成命令（仓库根目录）：

```bash
python scripts/v45_export_synthetic.py
```

输出不含原始文件名、绝对路径、Token 或私人课件文本。重复处理同一固定 Fixture 会产生逐字节一致的 JSON。

## 数据契约

`index.json` 使用 `schema_version: v45-demo-v1`，每项包含：

- `document_id`、`source_sha256`、`current_version`
- `title`、`source_kind: synthetic_fixture`
- `slide_count`、`content_file`
- `synthetic: true`、`demo: true`

每份详情 JSON 保留 V4.2 的 `slides` 结构（`slide_number`、`title`、`blocks`），块类型包括 `text`、`table`、`unsupported`，并保留 `shape_index`。

## 页面

- `/sources`：原有真实资料状态 + “合成演示资料”区域；列出 2 份资料、总页数、版本与详情入口，不把演示数据计入真实同步数量。
- `/sources/demo/[documentId]`：`generateStaticParams()` 生成两份静态详情页；按页展示标题、正文层级、表格行、页码和 `shape_index`；图片等 unsupported 块显示明确提示；无效 ID 返回 404。
- 所有课件文本通过 React 文本节点渲染，不使用 `dangerouslySetInnerHTML`。

## GitHub Pages basePath

默认本地构建与 Pages 项目站点构建都验证：

```bash
cd web
npm run build
npm run check:v45:static

NEXT_PUBLIC_BASE_PATH=/ContinueLeanringWithAI npm run build
npm run check:v45:static -- --base-path /ContinueLeanringWithAI
```

在 Git Bash 下，`NEXT_PUBLIC_BASE_PATH` 和 `--base-path` 前需要加 `MSYS_NO_PATHCONV=1`，避免 MSYS 把 `/ContinueLeanringWithAI` 转成 Windows 路径。CI 使用 Linux，不受影响。

## 安全门

- 导出脚本只接受 `ALLOWED_FIXTURES` 白名单中的两个合成 Fixture。
- 如果 V4.3 store 中出现不属于白名单的文档，导出直接失败（`STORE_HAS_UNEXPECTED_DOCUMENTS`），不会把未知内容写进网站目录。
- 网站输出不复制 `.local/v43/` 或任何私人 store；store 默认使用 `.local/v45`（Git 忽略）。
- 静态检查会验证列表标题、详情页标题、页码、表格单元格和 unsupported 提示。

## 已验证

- `python -m unittest discover -s tests -p 'test_*.py'`：33/33 通过（原 30 项 + V4.5 3 项）。
- 两次导出的所有文件 SHA-256 完全一致。
- 2 份合成资料、共 6 页；PPTX 的表格和 unsupported 图片块均进入 JSON。
- `npm run test:v45`：5/5 通过。
- `npm run typecheck`：通过。
- 默认静态构建：15 个静态页面，包含两个资料详情页。
- Pages basePath 构建：通过，列表链接与详情页均带 `/ContinueLeanringWithAI` 前缀。
- `npm run check:v45:static` 与带 basePath 的检查均通过。

## 合并与部署

PR #10 已由用户合并（merge `3694a02`）；main 上的 `.github/workflows/v44-pages.yml` 随后成功更新公开静态预览。Qoder 未合并 PR、未手动触发 Pages 工作流。线上入口：

- <https://colddreamxiaowd.github.io/ContinueLeanringWithAI/sources/>
- 合成集成样例详情页可从列表进入；basePath 链接、表格、unsupported 提示已在线上核对。
