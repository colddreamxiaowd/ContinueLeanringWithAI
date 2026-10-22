# V4.5 合成资料网站接入（数据层）

状态：数据导出层已完成并通过本地测试；资料列表页与详情页在下一片实现。仅使用合成 Fixture，不连接真实飞书或私人课件。

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

## 安全门

- 导出脚本只接受 `ALLOWED_FIXTURES` 白名单中的两个合成 Fixture。
- 如果 V4.3 store 中出现不属于白名单的文档，导出直接失败（`STORE_HAS_UNEXPECTED_DOCUMENTS`），不会把未知内容写进网站目录。
- 网站输出不复制 `.local/v43/` 或任何私人 store；store 默认使用 `.local/v45`（Git 忽略）。

## 已验证

- `python -m unittest discover -s tests -p 'test_*.py'`：32/32 通过（原 30 项 + V4.5 2 项）。
- 两次导出的所有文件 SHA-256 完全一致。
- 2 份合成资料、共 6 页；PPTX 的表格和 unsupported 图片块均进入 JSON。

## 待完成

- `/sources` 合成演示资料区域。
- `/sources/demo/[documentId]` 静态详情页。
- V4.5 页面测试与网站 CI 更新。
- PR 与 DEV 审查。
