# V4 自动检查：审查版实施和安全边界

**状态：V4 开发完成首轮可执行原型；仅本地资料源真实运行，飞书/远程 GitHub API 均未使用真实凭证连通。定时检查尚未启用；自动发布次数为 0。**

> **恢复快照说明（V4.4）：** 本文保留原 V4.1 设计记录；`pipeline/`、`scripts/v4/`、`tests/v4/` 与 V4 工作流未包含在 `web/` 恢复源码中，以下命令不能在本快照直接运行。`/review/v4` 仅展示合成样例的静态界面。

## 责任分工与真实持久性

- ChatGPT Project：重大版本审查、异常反馈与人工决定；不把 Project 附件当成自动任务的可访问目录。
- 飞书云空间：将来作为真正的云端原始 PPTX 来源。V4 只读列举已授予访问权的文件夹、递归子文件夹并下载二进制课件。Feishu 原生 docx/在线文档导出尚不支持，不可当作已经读取。
- GitHub `automation-state`（独立分支）：保留 `automation/v4/state.json` 和 `automation/v4/drafts/`。只保存已脱离原件的待审查内容和哈希、页码索引；**不上传 PPTX 原文件**。GitHub Actions `concurrency` 避免同一仓库多个任务并发写入。
- GitHub `main`：仅经过负责人批准的工程、教育内容和网页代码；V4 不直接触及它。另有显式批准清单的 GitHub Draft PR 发布适配器，但没有启用，更没有自动合并、部署功能。

## 运行逻辑（默认绝不发布）

1. 从本地文件夹或有权限的飞书文件夹读取 `.pptx`。
2. 为源路径/飞书 token 建立稳定匿名源 ID，并读取 SHA-256。若同源同版本已记录，跳过。
3. 提取每一张幻灯片的文本指纹；若仅文件压缩包元数据变化而可提取文本不变、**且课件没有图片/图表**，跳过重生成。若课件含图片/图表则阻断并记录 `visual_or_embedded_content_change_unverified`，避免隐藏视觉变化。
4. 若发现不同来源使用同一文件指纹，记录重复，不重复生成。
5. 调用 V2 有来源溯源和题目核验的草稿生成器。可验证时仅生成 `draft_ready_for_human_review`，阻断时仅记录问题。
6. 按内容地址创建不可覆盖的 GitHub 待审查草稿（启用 GitHub 状态模式时）；持久化 job key、页码变更与阻断原因。
7. 每次执行保留报告；**已阻断的文件，即使第二天没有修改也会继续出现在 activeAlerts 中**。
8. 执行失败保存 `failed`，下一次遇到相同指纹自动重试。源资料从目录消失只报告，不删除既有内容。

本 V4 只有源文件级、幻灯片文本级去重，不具备跨学科语义去重的充分证明；源 PPT 中图片、公式、复杂对象变化必须额外审核。V2 现有离线生成器仅覆盖明确的栈知识点；合成矩阵样例会正确停在 `review_required`，不能把它算作 Blog 已生成或可发布。

## 可执行命令：完全离线

```bash
python -m pip install -r requirements-v2.txt
python -m pytest -q tests/v4
python -m pipeline.v4 --source local --folder fixtures/v2 --workspace .local/v4 --report .local/v4/report.json
# 再运行同一命令，检查 created=0, skipped=1
```

如需使用经明确授权的真实课件，将其临时放入本地扫描目录后同样可以运行；原文件保持在目录中，不会复制到 GitHub 或 `content/`。

## 连接 GitHub 和飞书（下一次审批之后）

先将经审查的源码恢复到正式仓库，再在 *独立的私有分支* `automation-state` 中初始化 `automation/v4/state.json`：

```bash
# 以下是计划步骤，当前未在远端执行。
git checkout main
# 从 GitHub 新建独立状态分支（存在时不可重复初始化）
git switch -c automation-state
python scripts/v4/init_state.py
# 确认目标文件和空数据，批准后才能提交推送。
# git add automation/v4/state.json && git commit -m 'init V4 automation state' && git push origin automation-state
```

在飞书开放平台创建自建应用，按最低可用权限授权访问指定云盘文件夹，取得 `FEISHU_APP_ID`、`FEISHU_APP_SECRET` 和 `FEISHU_FOLDER_TOKEN`。只在 GitHub Actions Secrets 中保存；不要在聊天或仓库提交明文。使用最新 OAuth 客户端凭证令牌端点；当前代码仅在运行时获取 token，不写日志。

GitHub Actions 审查版工作流 `.github/workflows/v4-manual-check.yml` 只有 `workflow_dispatch`，**没有 `schedule`**。它需要 `contents:write` 以更新独立 `automation-state` 分支的状态和草稿，但不会写 `main`。需要真实配置权限、实际测试 GitHub token 的可写范围；当前尚无任何远端连通测试证据。任务在无法读取状态时会失败，而不是重新当作空状态处理。

## 发布审批模型

现有 `GitHubReviewPublisher.propose()` 是**经过人工审校清单的 Draft PR 提交协议原型**，不提供自动合并。`approval` 字段只是软件门禁，不能取代 GitHub 人工审查及保护规则；在真实网站绑定发布权之前，必须实现权限独立于待发布内容的可靠签署和审查校验。

**V4 需要第二次批准才能启用每日调度。** 启用时再确认执行时间和时区，并增加 `schedule`，第一次人工触发后检查真实返回、落库、GitHub PR/发布路径、失败通知和回滚。尚未测试飞书网络接口、GitHub 远端状态写入、生产网站构建或发布。

参考官方文档：
- 飞书应用令牌 <https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/tenant_access_token>
- 飞书云空间列表 <https://open.feishu.cn/document/server-docs/docs/drive-v1/file/list>
- 飞书云空间文件下载 <https://open.feishu.cn/document/server-docs/docs/drive-v1/download/download>
- GitHub Actions workflow <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>
