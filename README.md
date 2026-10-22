# ContinueLeanringWithAI

AI 驱动的个人学习网站：长期整理学习资料、Blog、题库、交互实验和学习成果。

## 先看项目状态

- [项目来源与初始化快照](docs/PROJECT_INITIALIZATION.md)：当前源代码范围、待同步网站源码、初始化入口与下一步。
- **网站 V1–V4.1 的完整原有源码尚未同步至当前远端 `main`**；这个仓库目前不能直接启动正式网页，也没有网站部署结果。
- 本仓库目前主要保存 GitHub Actions + 飞书的受控集成实验代码。

## 已有的飞书实验入口

| 入口 | 实际行为 | 文档 |
| --- | --- | --- |
| `feishu-inventory-manual.yml` | 手动通过应用凭证读取 PPTX 元数据，不下载 | [说明](docs/FEISHU_GITHUB_ACTIONS.md) |
| `feishu-user-inventory-manual.yml` | 手动通过用户 OAuth 读取 PPTX 数量，不下载 | [说明](docs/FEISHU_USER_OAUTH.md) |
| `feishu-hash-manual.yml` | **手动**临时下载 PPTX、校验结构、计算 SHA-256；仅缓存匿名化指纹 | [说明](docs/FEISHU_HASH_INVENTORY.md) |

全部工作流均为 `workflow_dispatch`，**没有启用定时执行、内容生成、自动发布或网站部署**。用户令牌可能过期；Actions Cache 不是长期内容数据库。

飞书凭证只允许进入 GitHub Actions Secrets；不要写入源码、日志、PR 或聊天。

## 离线检查

```powershell
python -m unittest discover -s tests -p "test_feishu_hash_inventory.py" -v
```

这组测试只检查指纹分类和状态文件行为，不需要飞书凭证。真实飞书访问由仓库拥有者另外手动触发，不能由此推断已经联网验证成功。
