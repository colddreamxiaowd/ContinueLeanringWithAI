# CONTENT_REGISTRY · 公开恢复版（合成数据）

## 数据边界

**公开仓库中的真实用户课件：0；真实课程来源元数据：0；网站/飞书已同步的真实原件：0；正式发布 Blog：0；正式发布题目：0；实际答题记录：0。**

V4.4 恢复版只保留能够公开的页面、合成样例和工程代码。真实课程文件名、原始 SHA-256、页码映射和派生矩阵数据已从公开目录移除。

## V2 合成课件测试记录

| 内容 ID | 类型 | 来源 | 位置 | 状态 |
|---|---|---|---|---|
| `fixture-stack-001` | 4 页合成 PPTX | `fixtures/v2/synthetic-stack-lesson.pptx` | 源 SHA-256 见 V2 report | fixture |
| `stack-lifo` | 知识点 | 合成样例第 2 页 | `src/data/v2-review.json` | fixture |
| `stack-operations` | 知识点 | 合成样例第 3、4 页 | 同上 | fixture |
| `stack-boundaries` | 知识点 | 合成样例第 4 页 | 同上 | fixture |
| `stack-v2-review` | 博客草稿 | 合成源文件哈希与页码 | `content/v2-fixture/` | draft；未发布 |
| `stack-q-lifo` | 单选题 | 合成样例第 2 页 | `content/v2-fixture/` | draft；离线 oracle 通过 |
| `stack-q-trace` | 代码跟踪题 | 合成样例第 3、4 页 | `content/v2-fixture/` | draft；Python oracle 通过 |
| `stack-q-underflow` | 判断题 | 合成样例第 4 页 | `content/v2-fixture/` | draft；离线核验通过 |

V2 仅针对可识别的栈概念实施模板草稿和独立核验。模型生成、教育效果与真实课程事实核查均未在公开版中验收。

## V3 合成矩阵与实验（审查候选）

- 内容 ID：`SYNTH-A-SPECIAL-MATRIX`
- 合成样例：12 页、6×7 矩阵、8 个三元组
- 样例 SHA-256：`10903e0110428b535f74bcd6dff4b76a69420cfd5a79a09379442f36355e93ea`（合成样例的占位标识值，不对应真实文件）
- 证据索引：`content/v3-sample/source.json`
- 实验入口：`public/lab-v3.html`、`experiments/sparse-transpose/engine.cpp`、Next.js `/experiments/sparse-transpose`
- 状态：本地运行、14 项自动测试通过、**待负责人审批**；不计入正式发布内容
- 说明：合成样例的 `cnum=[2,1,1,2,1,1,0]`，`cpot` 初值 `[0,2,3,4,6,7,8]`；不是真实课件数据

## V4 本地审查记录（公开版）

- 公开恢复版只使用 V2 合成栈 PPTX 与 V3 合成矩阵样例演示资料审查流程。
- 真实课件的来源文件、页码映射和派生数据不随公开仓库提供。
- V4 原型中的 `pipeline/`、`scripts/v2`、`scripts/v4`、`tests/v2`、`tests/v4` 未复制到 `web/`；根目录已有 V4.1–V4.3 Python 内容流水线。
- 自动任务、真实飞书授权、远端状态写入与正式发布均未启用。
