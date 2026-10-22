# V2 · PPTX → 知识点 → Blog / 题库：已实现与缺口

日期：2026-10-21。状态：**工程链路验证候选，未通过真实课程材料验收**。

> **恢复快照说明（V4.4）：** 本文保留原 V4.1 的设计与测试记录。`pipeline/`、`scripts/v2/`、`tests/v2/` 等 Python 原型未包含在 `web/` 恢复源码中，以下命令针对原工作区，不能在本快照直接运行。根目录另有 V4.1–V4.3 Python 流水线。

## 本轮唯一实际来源

`fixtures/v2/synthetic-stack-lesson.pptx` 由 `scripts/v2/make_fixture.py` **本轮人工合成**，只有四页。

它不是用户上传的真实 PPT，也不是经过课程教师审校的学习资料。源文件本身与生成结果均为 fixture；正式发布数为零。

## 本轮真实可运行的链路

```text
PPTX 文件 → 逐页提取文本及元数据 → 文件 SHA-256 + 页文本指纹
         → 基于源文关键字识别三个栈知识点（有明确范围）
         → 生成由来源页码支撑的 Markdown 草稿和三道练习
         → 独立 Python oracle 检查栈操作追踪结果
         → 持久保存导入 job / 状态 / 版本化草稿到 SQLite
         → Next.js `/review/v2` 读取静态审查证据
```

离线引擎不是通用任意教材语义抽取：**只实现栈**的 `LIFO / push-pop-top / 边界情况` 三个映射规则。不熟悉的内容被标为 `review_required`，不会根据缺失内容编造文章。

生成草稿和测试题均标记 `draft`，没有网站自动发布能力。模型起草接口是**可选且未在本轮进行实网测试**的 `model-draft` 命令；需用户决定发送哪些原件、配置密钥后才会调用 Responses API。所有模型答案默认需要独立检查。

## 使用方法

依赖 Python 3.11+ 与 `python-pptx`，测试需要 pytest：

```bash
python -m pip install -r requirements-v2.txt
python -m pytest -q tests/v2
python scripts/v2/make_fixture.py
python -m pipeline.cli ingest fixtures/v2/synthetic-stack-lesson.pptx \
  --source-id fixture-stack-001 \
  --source-kind fixture
python scripts/v2/build_review.py
python scripts/v2/browser_check.py  # 另需安装 Playwright 和 Chromium，当前用本地已存在的 Chromium
```

实际用户课件处理（待取得文件后再进行）：

```bash
python -m pipeline.cli ingest path/to/real_course.pptx \
  --source-id data-structures-stack-2026 \
  --source-kind user \
  --output content/v2-user
```

`content/v2-user/` 默认被 `.gitignore` 排除，防止私有课程资料误推送。飞书文件目前尚未连接；若后续开通，先通过飞书 API 获得授权下载的真实文件，再交给上述处理器。

要在已授权且保护好密钥的服务器上*显式*调用模型起草（本轮没有执行）：

```bash
export OPENAI_API_KEY='set-in-secret-manager-not-in-repository'
python -m pipeline.cli model-draft content/v2-user/data-structures-stack-2026/<sha-prefix>/report.json \
  --model <approved-model-id>
```

输出会强制标记为 `review_required / not_published`，并写明答案尚未独立验证。模型返回的引用即使符合格式，也需要人工核对事实及公式。

## 文件与版本约定

- `pipeline/core.py`：源文件解析、文件指纹、逐页比较、离线受限草稿、答案核查、SQLite 注册。
- `pipeline/model_drafts.py`：受控 LLM JSON 输出接口与逐页引文匹配，独立正确性核验仍属待办。
- `.local/v2-registry.sqlite`：开发本机导入索引；未配置生产数据库。
- `content/v2-fixture/<source-id>/<sha12>/`：保留每个版本独立草稿，绝不覆盖已存在的其他版本。
- `src/data/v2-review.json`：静态审查页的 fixture 数据，仅供项目评估。
- `tests/v2/`：导入与基础内容核验测试。
- 原归档未包含 `review-preview/v2-browser-report.json`；本轮不声称存在该浏览器报告。

## 本轮测试覆盖与实际功能边界

已测试：PPTX 解析及页码、文件哈希重复导入、局部变动页追踪、跨来源相同内容拦截、图片页阻断、答案篡改拦截、来源页码拦截、非栈资料阻断、ID 路径校验、模型请求不存储、没有 API Key 时不得发起网络请求、V2 浏览器内作答和主题切换。

尚未测试或实现：真实课程 PPT 的完整解析（尤其数学公式/图表/图片）、PDF、飞书同步、实际 OpenAI API 生成、任意主题知识抽取、复杂计算题独立验证、只替换变化知识点的**真增量重用**、GitHub 内容发布/回滚、生产数据库与学习记录。

当前局部更新会**识别受影响的幻灯片页码**并保留两个不同版本的草稿；如果 PPTX 二进制变化但全部提取文本相同，则跳过重新生成。若教学文本确实局部改变，则**仍会重生成一整篇候选文章**。不要将这一能力描述为已实现完整的知识点级增量写入。

## 审核权

即使某批离线测试全部通过也不会自动发布。使用获得明确授权的真实课件完成同样测试，并经过来源、内容和题库审查，再申请发布权限。当前既没有开启生产任务，也没有提交到用户 GitHub 远端。
