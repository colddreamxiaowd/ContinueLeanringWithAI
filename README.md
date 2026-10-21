# ContinueLeanringWithAI

AI 学习网站项目。当前仓库正在建立受控的 GitHub + 飞书集成。

## 安全边界

- 飞书连接先执行**手动、只读的 PPTX 元数据检查**。
- 无自动定时任务、无内容生成、无文件下载、无发布。
- 飞书凭证仅放在 GitHub Actions Secrets，不提交到仓库。
- 网站 V1–V4.1 的完整源码仍处于待同步审查状态；此处不是网站部署结果。

请查看 `.github/workflows/feishu-inventory-manual.yml` 和 `docs/FEISHU_GITHUB_ACTIONS.md`。
