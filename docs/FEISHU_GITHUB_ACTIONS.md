# GitHub Actions + 飞书只读诊断

## 本阶段功能与限制

- 仅在手动点击 **Run workflow** 后获取飞书应用 token，读取一个指定文件夹下的 PPTX 文件列表。
- 不下载 PPTX，不生成文章、题库，不修改飞书、数据库或 GitHub 内容。
- 没有 schedule 定时器，工作流权限为 `contents: read`。
- 正式网站 V1–V4.1 源码尚未在远端同步，当前工作流仅为飞书连接诊断。

## 你的配置操作

1. 访问 https://open.feishu.cn/app ，创建或打开**企业自建应用**，启用必要的云空间读取 API 权限并按租户规定发布/审核应用。
2. 在飞书云空间建 `AI-Learning-Sources` 文件夹，确认应用对该文件夹有文件访问权。文件夹访问权与云空间 API 权限是两回事。
3. 在 GitHub 私有仓库 Settings → Secrets and variables → Actions → New repository secret 中创建：
   - `FEISHU_APP_ID` — 自建应用 App ID
   - `FEISHU_APP_SECRET` — 自建应用 App Secret（不要发送到聊天）
   - `FEISHU_FOLDER_TOKEN` — 被授权文件夹的 Token
4. 审查 PR 并合并后，打开 Actions → **Feishu PPTX inventory (manual, read-only)** → Run workflow；首次运行只查看日志是否出现 `FEISHU_READ_ONLY_OK`。
5. 若失败，按 `AUTH_FAILED`、`ACCESS_FAILED`、`NETWORK_OR_API_ERROR` 排查。切勿在 issue、PR 或聊天中粘贴 Secrets、Bearer token 或原始调试请求。

## 说明

- 飞书令牌使用 OAuth v3：https://accounts.feishu.cn/oauth/v3/token ，字段为 `grant_type=client_credentials`、`client_id`、`client_secret`，读取 `access_token`。
- 文件清单读取：`GET https://open.feishu.cn/open-apis/drive/v1/files?folder_token=...`。
- 文件元数据名称可能属于敏感信息；如不希望名称显示在 Actions 日志，可删去脚本中的 `PPTX:` 打印，仅保留计数。
- 后续读取完整课件、每日计划、内容发布均需要独立审批，不会被此次配置自动启用。
