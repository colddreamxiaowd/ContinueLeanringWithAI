# 飞书用户 OAuth：GitHub Actions 只读验证（阶段 1）

## 本次目标
针对先前应用令牌可获取但私有文件夹返回 403 的问题，改用 **user_access_token** 以文件夹拥有者身份读取元数据。

- 仅手动触发；不下载、生成、写入、发布；日志只显示 PPTX 数量。
- 这一阶段使用短期用户访问令牌，**不承诺长期自动运行**；正式自动刷新需持久化并轮换 refresh_token。
- 当前 PR 不改动旧工作流，便于回退和对照。

## 如何安全完成一次授权

1. 在 https://open.feishu.cn/app 找到原自建应用，在「权限管理」检查用户身份的 `drive:drive:readonly` 权限；在「安全设置」按 OAuth 文档配置重定向地址。
2. 最省操作的验证方式是打开飞书官方 Drive 列表 API 文档的 API Explorer（调试台），将认证方式选为 **user_access_token**，以本人身份完成授权，确认调试访问自己的文件夹。使用已批准的读取权限，不加写入权限。
3. 通过飞书官方 OAuth 授权流程安全取得 `user_access_token`。**不要在聊天、issue、PR 或 Actions 日志中贴出令牌或一次性授权码。** 注意 token 会过期。
4. 在 GitHub 仓库 Settings → Secrets and variables → Actions 新增 `FEISHU_USER_ACCESS_TOKEN`（值为本人的用户令牌），已有 `FEISHU_FOLDER_TOKEN` 保持不变。
5. 合并本 PR 后，从 GitHub Actions 选择 **Feishu user OAuth inventory (manual, read-only)**，点击 Run workflow。成功会输出 `LIST_FOLDER: OK (PPTX count=...)`。

## 后续授权架构（尚未启用）
飞书支持通过 `offline_access` 获取用户刷新令牌。但**刷新令牌是轮换的**，每次刷新后必须在安全持久存储中原子更新，否则下一次任务会失败。未来可使用一个受控的、可保存最新凭证的执行服务，或经单独审批的 GitHub API 更新仓库 Secret 机制，并做好竞态和失败恢复。在没有完成此设计和实测之前，不设置每日计划。

授权入口文档：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/obtain-oauth-code
