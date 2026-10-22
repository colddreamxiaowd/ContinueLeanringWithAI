# ContinueLeanringWithAI — 项目来源与初始化快照

记录日期：2026-10-22（Asia/Singapore）
主仓库：[colddreamxiaowd/ContinueLeanringWithAI](https://github.com/colddreamxiaowd/ContinueLeanringWithAI)（私有，`main`）
核对起点：`c651c455b5be6b70818ea97f0d9d255cae16fd4e`

## 1. 项目定位

长期目标：AI 驱动的个人学习网站，面向学习资料、Blog、题库、交互实验与学习成果的整理、呈现和积累。

此前确认的方向（来自既有项目沟通，**不代表已在当前仓库核验到源代码**）：
- A+B+C 融合视觉，浅色主界面与完整深色主题。
- 曾有 Next.js + React + TypeScript 的 V1 本地页面与测试记录。
- V4.1 的「资料与内容」方向已被接受。
- 按版本审查；未获授权不改变产品方向、不部署、不自动发布、不进入下一版。

## 2. 当前远端仓库已经核实的文件

- `README.md`：总入口和飞书接入安全边界。
- `.github/workflows/feishu-inventory-manual.yml` / `scripts/feishu_inventory.py`：手动应用凭证读取 PPTX 元数据。
- `.github/workflows/feishu-user-inventory-manual.yml` / `scripts/feishu_user_inventory.py`：手动用户 OAuth 读取文件夹 PPTX 数量。
- `.github/workflows/feishu-hash-manual.yml` / `scripts/feishu_hash_inventory.py`：手动下载 PPTX 到临时文件、校验 ZIP、计算 SHA-256，并在 GitHub Actions cache 保存匿名化指纹。
- `tests/test_feishu_hash_inventory.py`：5 个离线单元测试用例；存在不等于已在此次审查中执行通过。
- `docs/FEISHU_GITHUB_ACTIONS.md`、`docs/FEISHU_USER_OAUTH.md`、`docs/FEISHU_HASH_INVENTORY.md`：连接、授权、下载/哈希阶段的操作说明。

**差异说明：** 最早的元数据清单工作流不下载文件；但新加入的独立 SHA-256 手动工作流在明确手动触发后会下载 PPTX 到临时目录。不能再笼统描述所有工作流“从不下载”。

## 3. 未就绪或未独立核验的部分

- 远端 `main` 目前没有 `package.json`、`app/` 或 `src/app/` 等正式网页工程入口；没有可直接执行 `npm run dev` 的网站代码。
- 既有 V1–V4.1 完整网站源码仍待从原本地工作区同步、审查；本次未获取本地 Windows 工作目录的源码。
- 尚未检查 GitHub Secrets 是否已正确设置，也未手动触发飞书真实 API 测试；没有验证线上运行成功或网站部署。
- GitHub Actions Cache 中的 SHA-256 比对记录不是可靠的长期数据库。
- 不记录、不在文档中展示任何 App Secret、用户 token、refresh token、文件 token。

## 4. 初始化后的项目读取顺序

1. 阅读 `README.md` 和本文，确认当前项目与主仓库的对应关系。
2. 阅读 `docs/FEISHU_GITHUB_ACTIONS.md`、`docs/FEISHU_USER_OAUTH.md`、`docs/FEISHU_HASH_INVENTORY.md`，核对飞书数据通路和阶段边界。
3. 对后续网站工作先找到**原有本地网站源码**，记录 Git/文件版本、框架入口、依赖锁文件、可重复测试及构建方式。
4. 审查后在单独分支同步原有源码，以 PR 保留审查点；不要直接拿新模板替代 V1–V4.1。
5. 只有核验了实际网页源码，才进行依赖安装、构建、浏览器验收。飞书在线鉴权与真实文件下载另行取得明确授权。

## 5. 已有代码可独立执行的本地入口

前提：克隆私有仓库需要使用本人有权限的 GitHub 凭证。

```powershell
git clone https://github.com/colddreamxiaowd/ContinueLeanringWithAI.git
cd ContinueLeanringWithAI
python -m unittest discover -s tests -p "test_feishu_hash_inventory.py" -v
```

此测试验证离线哈希状态逻辑，**不会**访问飞书或启动网站。

## 6. 本次初始化边界

完成：找回权威仓库、核对当前 `main` 文件结构、整理已有集成入口与真实状态。

未完成：同步原有网站源码、网站依赖初始化及构建、真实飞书鉴权/文件读取、任何形式的部署。

本文是初始化状态索引，不是新版本实现授权或宣称线上产品已完成。
