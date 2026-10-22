# ContinueLeanringWithAI — 项目来源与初始化快照

记录日期：2026-10-22（Asia/Singapore）
主仓库：[colddreamxiaowd/ContinueLeanringWithAI](https://github.com/colddreamxiaowd/ContinueLeanringWithAI)（公开；按公开仓库隐私边界处理）
核对起点：`c651c455b5be6b70818ea97f0d9d255cae16fd4e`
V4.4 恢复分支起点：`e5130a93b5bdff91fc98aa3cea7adf581029a9ea`

## 1. 项目定位

长期目标：AI 驱动的个人学习网站，面向学习资料、Blog、题库、交互实验与学习成果的整理、呈现和积累。

已确认的方向：
- A+B+C 融合视觉，浅色主界面与完整深色主题。
- Next.js + React + TypeScript 的 V1–V4.1 网站。
- V4.1 的“资料与内容”方向已被接受。
- 按版本审查；未获授权不改变产品方向、不部署、不自动发布、不进入下一版。

## 2. 当前仓库实际内容

### 2.1 根目录 Python 内容流水线（V4.1–V4.3）

- `scripts/pptx_content.py`：PPTX 内容解析与确定性 JSON 输出。
- `scripts/v43_pipeline.py`：增量处理、内容指纹与私有内容导入。
- `scripts/v43_import.py`：私有内容导入接口。
- `scripts/feishu_*` 与 `.github/workflows/feishu-*-manual.yml`：手动、只读或受控下载的飞书实验入口。
- `tests/`：30 项离线测试（V4.1 5、V4.2 9、V4.3 16）。
- `docs/V43_PRIVATE_PIPELINE.md`：私有内容存储与凭证边界。

### 2.2 网站 `web/`（V4.4 恢复）

- 来源：用户指定的 `dev_网站` 会话中的 `ContinueLeanringWithAI_V4_1_review.zip`。
- 归档 SHA-256：`cf93040b36f9a1f5711fd8caff01304dd353e2ca8d905cd2d65920318981035a`。
- 技术栈：Next.js 16 App Router、React 19、TypeScript 5.8+，静态导出。
- 入口：`web/src/app/page.tsx`、`web/src/app/layout.tsx`、`web/src/app/globals.css`、`web/src/components/app-shell.tsx`。
- 路由：`/`、`/courses`、`/courses/[slug]`、`/read/[slug]`、`/sources`、`/experiments`、`/experiments/sparse-transpose`、`/review/v2`、`/review/v4`。
- 锁文件：`web/package-lock.json`；本轮验证环境 Node v24.12.0、npm 11.6.2。
- 网站 CI：`.github/workflows/v44-web-tests.yml`，只对 `web/` 变更执行 `npm ci`、测试、类型检查和构建。

### 2.3 隐私处理

- 公开目录不包含真实课程文件名、真实文件 SHA-256、真实页码映射或派生矩阵数据。
- V3 使用 `web/content/v3-sample/source.json` 合成样例；V2 使用 `web/fixtures/v2/synthetic-stack-lesson.pptx` 合成课件。
- 原 V4.1 归档中的 `pipeline/`、v2/v4 Python 原型、真实来源提取脚本未复制到 `web/`；根目录 Python 流水线是唯一内容处理实现。
- 原归档不含 `review-preview/`；恢复版修正了 README/文档链接，指向实际存在的 `web/public/lab-v3.html`、`web/public/v4-review.html` 和 Next.js 路由，没有伪造历史预览文件。

## 3. 已验证与未验证

已验证（本轮实际执行）：
- `web`：`npm ci` 通过；`test:models` 5/5；`test:v3` 14/14；`typecheck` 通过；`next build` 通过并生成 13 个静态页面。
- 根目录：30/30 Python 测试通过。
- 网站静态预览可显示“知序 Learning Hub”首页。

未验证/未启用：
- 网站已发布 GitHub Pages 静态审查预览；尚未配置后端、数据库或生产域名。
- 真实飞书 OAuth、文件夹读取、下载和写入尚未在本轮验证。
- 真实课程内容处理、模型生成、数据库、账号、学习记录和每日调度未启用。
- 原归档的 Chromium 交互检查记录沿用归档说明，本轮未重新执行该套件。

## 4. 读取顺序

1. 本文与根目录 `README.md`，确认当前项目状态和边界。
2. `web/README.md`，了解网站结构、运行命令和隐私处理。
3. `web/docs/ARCHITECTURE.md`、`DESIGN_SYSTEM.md`、`PROJECT_DECISIONS.md`、`ROADMAP.md`，了解原设计与版本决策。
4. `docs/V43_PRIVATE_PIPELINE.md` 与飞书文档，核对根目录数据通路和安全边界。
5. 任何真实飞书或私人课件操作，先取得明确授权并确认本地凭证。

## 5. 本地入口

```bash
# 根目录 Python 流水线
python -m unittest discover -s tests -p "test_*.py" -v

# 网站
cd web
npm ci
npm run test:models
npm run test:v3
npm run typecheck
npm run build
npm run dev
```

## 6. 当前边界

完成：找回原始 V4.1 网站源码、恢复 `web/`、清除公开目录中的真实课程元数据、补齐锁文件与网站 CI、完成测试和构建。

未完成：生产部署/域名、真实飞书联机验证、真实课程内容导入、V4.5 网站与流水线集成。

本文是当前状态索引，不是新版本实现授权或线上产品完成声明。
