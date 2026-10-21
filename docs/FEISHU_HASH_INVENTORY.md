# 飞书真实 PPTX 下载与去重（V4.1 审查）

本 PR 增加单独的手动工作流 `Feishu PPTX SHA256 (manual, no publication)`，不更改已验证的用户 OAuth 文件枚举工作流。

1. 列出指定文件夹第一层的 PPTX。
2. 用现有 `FEISHU_USER_ACCESS_TOKEN` 以用户身份读取每个文件的原始字节（每个最多 40 MiB）。
3. 在 GitHub Actions 临时目录中校验 PPTX ZIP 结构、计算完整内容 SHA-256，完成后删除临时文件。
4. GitHub Actions Cache 只保存匿名化文件 Token 哈希及内容 SHA-256。下次运行对比 `NEW`、`CHANGED`、`UNCHANGED`。即使文件未变化也必须先下载以核对真实内容；这是按内容哈希判断所必需的。
5. 不保存、上传、缓存或发布原始 PPTX；不生成 Blog 或题库。

## 边界
- Cache 是可被清理的运行缓存，**不是长期可靠的内容登记数据库**。缓存丢失后会再次显示 NEW；正式增量发布前需要数据库或受控状态仓库。
- 当前会按文件 Token 区分同一资源的多个位置；若复制文件使 Token 改变，会视为新资料，后续内容层需按内容 SHA-256 进一步去重。
- 用户令牌仍是临时凭证；有效期过后须重新授权并更新 Secrets。每日调度未启用。
- 暂不递归子文件夹，仅处理上传到根文件夹的 PPTX。
- 下载接口需要文件下载权限；若出现 403，请检查用户权限与应用读取/下载范围，不要扩大为写权限。
- 该 PR 通过后再进行线上运行及至少两次连续比较的验收。未在此 PR 创建阶段宣称真实下载成功。

参考飞书 API：`GET /open-apis/drive/v1/files/{file_token}/download`。
