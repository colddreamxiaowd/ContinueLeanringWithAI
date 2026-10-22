# V4.3 私有内容流水线

状态：V4.3 的代码与审查修复已经进入 `main`；PR #6 和 PR #7 均已合并。本文档的
PowerShell 凭证说明通过 PR #8 收尾。

- V4.3 的解析、私有存储和导入接口已在主分支；未部署、未发布。
- 原 V1–V4.1 网站源码仍未找到，网站接入尚未完成。
- 尚未执行真实飞书验证；没有读取私人课件，也没有新增飞书授权。
- 不包含 AI 文章生成、自动发布或公开网站部署。

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

## 真实飞书手动模式（默认单文件，Windows PowerShell）

仅在用户明确批准本次私人内容处理、且本机已有有效用户 OAuth 凭证时运行。以下命令适用于 Windows PowerShell 5.1 和 PowerShell 7，在仓库根目录执行。

### 默认单文件

不要把 Token 直接写在命令文本里。`Read-Host -AsSecureString` 会隐藏输入；命令历史只保存变量赋值语句，不包含 Token：

```powershell
$secure = Read-Host -AsSecureString "FEISHU_USER_ACCESS_TOKEN"
$env:FEISHU_USER_ACCESS_TOKEN = [System.Net.NetworkCredential]::new("", $secure).Password

$secure = Read-Host -AsSecureString "FEISHU_FOLDER_TOKEN"
$env:FEISHU_FOLDER_TOKEN = [System.Net.NetworkCredential]::new("", $secure).Password

$secure = Read-Host -AsSecureString "FEISHU_FILE_TOKEN"
$env:FEISHU_FILE_TOKEN = [System.Net.NetworkCredential]::new("", $secure).Password

python scripts/v43_pipeline.py --feishu --store .local/v43
```

- 这些变量只存在于当前 PowerShell 进程及其子进程，不会自动写入用户级或系统级环境变量。
- 关闭当前 PowerShell 会结束该会话的环境；若 Python 或其他子进程仍在运行，它们可能保留启动时继承的环境副本，直到这些进程结束。
- 运行后立即在当前会话清除：

```powershell
Remove-Item Env:FEISHU_USER_ACCESS_TOKEN, Env:FEISHU_FOLDER_TOKEN, Env:FEISHU_FILE_TOKEN -ErrorAction SilentlyContinue
```

- 默认只处理 `FEISHU_FILE_TOKEN` 指定的一个文件，且必须先确认该 Token
  属于给定文件夹；不在文件夹内会拒绝执行，不会触发下载。
- 缺少 `FEISHU_FILE_TOKEN` 时会在调用飞书列表 API 前拒绝执行。
- 日志不输出原始 Token、文件名或正文。
- 不要在命令行参数、脚本文件或聊天中写入真实 Token。

### 显式整文件夹批量模式

批量处理必须显式使用 `--all`。切换前先清除 `FEISHU_FILE_TOKEN`，否则 CLI 会以
`SCOPE_CONFLICT` 拒绝执行：

```powershell
Remove-Item Env:FEISHU_FILE_TOKEN -ErrorAction SilentlyContinue

# 如果当前会话尚未设置用户/文件夹 Token：
$secure = Read-Host -AsSecureString "FEISHU_USER_ACCESS_TOKEN"
$env:FEISHU_USER_ACCESS_TOKEN = [System.Net.NetworkCredential]::new("", $secure).Password
$secure = Read-Host -AsSecureString "FEISHU_FOLDER_TOKEN"
$env:FEISHU_FOLDER_TOKEN = [System.Net.NetworkCredential]::new("", $secure).Password

python scripts/v43_pipeline.py --feishu --all --store .local/v43
```

- 批量模式会处理文件夹中的全部 PPTX；这是显式选择，不是默认行为。
- 切回单文件模式前设置新的 `FEISHU_FILE_TOKEN`。

本 PR 未执行真实飞书验证，也未读取真实课件；在线验证等待用户单独批准和本机凭证。

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

全新空库返回空列表。只要 `state.json` 已有已提交文档，索引缺失或与状态不一致都会
抛出 `INDEX_STALE`，不会静默提供错误版本；下一次流水线运行会从 state 重建索引。
文档缺失、不可读或与索引不匹配时抛出清晰的 `ContentImportError`。路径穿越会被拒绝。

## 状态规则

- `NEW`：没有历史处理记录。
- `CHANGED`：源身份相同，内容 SHA-256 变化。
- `UNCHANGED`：源身份和 SHA-256 相同，且当前解析成果存在。
- `REBUILD`：源身份和 SHA-256 相同，但解析成果缺失或无效。
- `FAILED`：下载、校验、解析或写入失败；状态和旧版本保持不变。

每次运行对每个源只下载一次；`REBUILD` 不二次下载。内容相同的不同源共用
`documents/<sha>/`，第二个源不重复解析。

## 写入失败与恢复

- `state.json` 是已提交处理状态的权威来源。新状态先写成功，才替换内存中的权威状态。
- state 写入失败：本次结果为 `FAILED`，旧 state/index 和旧内容版本保持可用；不会把
  未提交的版本写入 index。故障解除后重跑可继续处理。
- state 写入成功但 index 写入失败：流水线重试后抛出 `INDEX_WRITE_FAILED`，**不会**
  返回成功。此时 state 已是新版本、index 仍旧；`list_documents()` 抛出 `INDEX_STALE`。
  下一次运行会从 state 重建 index。
- 索引缺失但 state 有文档：导入读取器抛出 `INDEX_STALE`，不会返回空库或错误版本；
  下一次运行会重建索引。
- 旧版本目录不删除；失败不会覆盖此前完整可用的内容版本。

## 测试

```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

V4.3 完成时共 30 项测试通过：V4.1 5 项、V4.2 9 项、V4.3 16 项；V4.5 后总数为 33 项（新增 3 项导出测试）。新增覆盖 state/index
写入失败、索引恢复、单文件选择、范围冲突和批量显式模式。

## 兼容性与边界

- `download_digest()` 的 V4.1 返回契约与行为保持不变；新增
  `download_to_temp()` 由流水线负责清理。
- V4.1 飞书 OAuth/下载/指纹工作流未修改。
- V4.2 的 `parse_pptx()`、JSON Schema 和 HTML 渲染器直接复用。
- 当前仍缺少 V1–V4.1 网站源码；本 PR 只提供数据与导入契约，不创建 Next.js 页面。
- 不自动合并、不部署、不发布。
