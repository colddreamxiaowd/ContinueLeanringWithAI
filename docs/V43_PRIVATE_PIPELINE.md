# V4.3 私有内容流水线

状态：本地实现；堆叠在 PR #6（V4.2）之上，未合并、未发布。V4.3 不包含 AI
文章生成、自动发布、公开网站部署或新的飞书授权。

## 一条命令运行离线闭环

```bash
python scripts/v43_demo.py
```

该命令使用合成 PPTX 和模拟下载器，实际写入 `.local/v43-demo`（Git 忽略），并验证：

- 首次导入：`NEW`
- 重复导入：`UNCHANGED`（不重复解析）
- 内容变化：`CHANGED`（旧版本保留）
- 删除当前解析成果：`REBUILD`（使用本次下载的临时文件）
- 模拟下载失败：`FAILED`（旧版本仍可读取）
- 两个文件内容相同：第二个条目不重复解析
- 索引读取、`read_document()` 和 V4.2 HTML 渲染成功
- 临时 PPTX 全部清理

## 真实飞书手动模式

仅在用户明确批准本次私人内容处理、且本机已有有效用户 OAuth 凭证时运行：

```bash
FEISHU_USER_ACCESS_TOKEN=... FEISHU_FOLDER_TOKEN=... \
python scripts/v43_pipeline.py --feishu --store .local/v43
```

本 PR 未执行真实飞书验证，也未读取真实课件。凭证、原始 Token、文件名和课件正文
不会出现在日志中。

## 存储布局

```text
.local/v43/
├── state.json
├── index.json
└── documents/
    └── <source-sha256>/
        ├── content.json
        └── preview.html
```

- `.local/` 在 `.gitignore` 中。
- 原始 PPTX 只存在于临时文件，解析后立即删除。
- 每个内容版本以完整 SHA-256 命名；旧版本不覆盖。
- `state.json` 是源身份到当前版本的私有状态。
- `index.json` 是网站消费的公开契约，不包含原始 Token 或正文。

## 网站导入契约

`index.json` 包含：

- `document_id`：由源文件 Token 哈希得到的稳定身份
- `source_sha256` 与 `current_version`：当前有效内容版本
- `schema_version`：`pptx-content-v1`
- `slide_count`
- `content_path` / `preview_path`：相对存储根的路径

读取器：

```python
from scripts.v43_import import list_documents, read_document, render_document

for document in list_documents(".local/v43"):
    content = read_document(document["document_id"], ".local/v43")
    html = render_document(document["document_id"], ".local/v43")
```

索引缺失时返回空列表；文档缺失、不可读或与索引不匹配时抛出清晰的
`ContentImportError`。路径穿越会被拒绝。

## 状态规则

- `NEW`：没有历史处理记录。
- `CHANGED`：源身份相同，内容 SHA-256 变化。
- `UNCHANGED`：源身份和 SHA-256 相同，且当前解析成果存在。
- `REBUILD`：源身份和 SHA-256 相同，但解析成果缺失或无效。
- `FAILED`：下载、校验、解析或写入失败；状态和旧版本保持不变。

每次运行对每个源只下载一次；`REBUILD` 不二次下载。内容相同的不同源共用
`documents/<sha>/`，第二个源不重复解析。

## 兼容性与边界

- `download_digest()` 的 V4.1 返回契约与行为保持不变；新增
  `download_to_temp()` 由流水线负责清理。
- V4.1 飞书 OAuth/下载/指纹工作流未修改。
- V4.2 的 `parse_pptx()`、JSON Schema 和 HTML 渲染器直接复用。
- 当前仍缺少 V1–V4.1 网站源码；本 PR 只提供数据与导入契约，不创建 Next.js 页面。
- 不自动合并、不部署、不发布。
