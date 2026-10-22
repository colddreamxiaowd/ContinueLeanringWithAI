# Xiaowd Blog Writing Skill v1.0.0

这是独立于已有 `tutor-skill` 的技术博客写作 Skill，基于用户原始《从零开发 Agent Watchdog》01–04 篇以及连续迭代反馈提炼。`tutor-skill` 负责广义教学，`xiaowd-blog-writing` 负责**将技术理解沉淀为可发布、可复现、可验收的中文技术博客**。

## 能力

- 根据原文章与仓库忠实重写、续写系列文章。
- 解释为什么、机制、代码、Windows 实验、反例与验收。
- 区分真实执行结果、模拟输出与尚未验证的能力。
- 检查 Markdown 结构、相对链接、界面残留和部分常见错误。
- 自动生成第 N 篇空白模板与系列矩阵。

## 安装给 Codex（推荐项目级）

将完整文件夹放入项目的：

```text
<项目根目录>/.agents/skills/xiaowd-blog-writing/SKILL.md
```

例如项目目录为 `D:\program\agent_watchdog` 时，将文件夹复制到 `D:\program\agent_watchdog\.agents\skills\xiaowd-blog-writing`。命令行内可用：

```powershell
# 先手动将 ZIP 解压到当前 Downloads 文件夹或指定目录，确认以下源目录存在
$source = 'D:\path\to\xiaowd-blog-writing'
$dest = 'D:\program\agent_watchdog\.agents\skills\xiaowd-blog-writing'
New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $dest -Recurse -Force
```

注意：以上是**参考路径**，需要替换到真实解压位置。技能放入仓库不会自动等于已在 ChatGPT 所有会话中注册；需通过相应平台的 Skills/Plugins 或运行环境加载。

## 使用

在支持 Skills 的 Agent 输入：

```text
使用 xiaowd-blog-writing，按我现有第 01–04 篇风格，写第 05 篇长文：先讲实际问题，再解释设计原理，附完整实验与验收。
```

## 本地静态检查

```powershell
python scripts/lint_blog.py path/to/article.md
python scripts/lint_blog.py path/to/blogs/ --strict
python scripts/test_skill.py
```

## 为什么不直接覆写已有 Tutor Skill？

原 `tutor-skill` 还有数学证明、互动答疑、报错教学等功能；让博客写作成为独立 Skill，可以提高触发准确度，也便于单独升级。确实需要合并时，可将这里的 `SKILL.md` 与 `references/` 按需纳入原 Tutor Skill 的博客模式，避免重复规则互相冲突。

## 边界

本包是**可安装的 Agent Skills 格式文件**，不代表已经安装到用户的电脑、ChatGPT 插件或 GitHub。静态检查不能验证代码逻辑、第三方 API 真伪或文章教学价值，仍需人工审查与真实执行。
