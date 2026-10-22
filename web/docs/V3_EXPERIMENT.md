# V3 · 稀疏矩阵快速转置交互实验（合成样例审查版）

## 1. 公开恢复版的数据边界

本目录**不包含**任何真实课程文件、真实文件名、真实文件 SHA-256、真实页码映射或由真实课件派生的矩阵数据。

V3 页面使用明确标记的合成样例：

- 数据文件：`content/v3-sample/source.json`
- 样例 SHA-256：`10903e0110428b535f74bcd6dff4b76a69420cfd5a79a09379442f36355e93ea`（合成样例的占位标识值，不代表任何真实文件）
- 规模：6×7 矩阵，8 个合成三元组
- `input_type`：`synthetic-sample`

| 合成页码 | 用途 |
|---|---|
| 2 | 6×7 矩阵与 8 个三元组 |
| 3 | 转置定义：交换行列、交换下标、重新排列 |
| 4 | 按列扫描的朴素转置参考实现 |
| 5 | 快速转置的直觉与目标 |
| 6 | `cnum` 列计数与 `cpot` 起始槽 |
| 7–8 | 计数、前缀和、按位写入并推进 `cpot` |

原 V4.1 归档曾记录真实课件的来源映射；该元数据已按 V4.4 隐私要求移除，不在公开仓库中保留。此文档不会用合成页码冒充真实课件页码。

## 2. 实际交付的功能

1. `src/lib/sparse-lab-controller.mjs`：输入验证、独立朴素转置、跨平台 WebAssembly 驱动、单步快照/回退。
2. `experiments/sparse-transpose/engine.cpp`：可同时编译为原生 C++17 程序或浏览器 WebAssembly 的唯一算法真源。使用固定 10×10 上限，输入是数据而不是任意代码。
3. `public/wasm/sparse_transpose.wasm`：上述 C++ 算法在浏览器中的编译结果。
4. `public/lab-v3.html`：独立实验界面，含浅/深色主题、输入编辑、矩阵格、`cnum/cpot`、步进/回退/运行到底、事件日志、朴素算法校验与练习提示。
5. Next.js `/experiments` 与 `/experiments/sparse-transpose`：沿用原布局和导航，嵌入同一实验页面。

### 合成样例的教学行为

合成样例的 8 个三元组对应：

- `cnum = [2,1,1,2,1,1,0]`
- `cpot` 初值 = `[0,2,3,4,6,7,8]`
- 完成后按行排序的转置表：

```text
(0,0,5) (0,5,6)
(1,3,9)
(2,1,7)
(3,0,-2) (3,5,8)
(4,2,3)
(5,4,-4)
```

步骤数为 `8` 次计数 + `7` 次前缀初始化 + `8` 次写入 + `1` 次结束 = **24**。单步按 C++ 中的操作事件划分，不是每条源码语句各一步。

## 3. 安全与执行边界

- 浏览器运行编译好的 C++ WebAssembly，不需要服务器执行输入代码；用户编辑的是矩阵三元组数据。
- **不支持编辑 C++ 后实时编译/运行**；也没有任意代码沙箱、在线编译错误、`stdout` 捕获或多租户隔离。
- 输出框是实际 WebAssembly 状态，不是模拟的标准输出。
- 练习尝试仅使用浏览器本地 `localStorage`，不是账号学习记录或服务端持久化。
- WebAssembly 核心只针对 10×10 上限、非零整数（绝对值不超过 1,000,000）、0-based 坐标、无重复三元组的输入集合。

## 4. 如何运行与复现

```bash
cd web
npm ci
npm run dev
# 打开 http://localhost:3000/experiments/sparse-transpose
```

独立页面：直接打开 `public/lab-v3.html`；它已内嵌 WebAssembly 字节，没有云端执行依赖。

重新编译 C++ 核心：

```bash
bash scripts/v3/compile_wasm.sh
node --test tests/v3/*.test.mjs

g++ -std=c++17 -Wall -Wextra -pedantic \
  experiments/sparse-transpose/engine.cpp \
  experiments/sparse-transpose/native_test.cpp \
  -o /tmp/sparse-test && /tmp/sparse-test
```

WebAssembly 交叉编译需要 `clang++` 支持 `--target=wasm32-unknown-unknown`；原生测试需要 `g++`。

原 V4.1 归档中的 `scripts/v3/source_manifest.py`（真实 PPT 来源提取器）和 `scripts/v3/build_review.py` 未复制到公开恢复版；本目录的 V3 数据来自 `content/v3-sample/source.json`，不执行真实课件解析。

## 5. 验证记录

- 本轮 V4.4：`npm run test:v3` 14/14 通过，包含 200 个固定随机种子的矩阵与异常输入。
- 本轮 V4.4：`npm run typecheck` 通过，`npm run build` 通过并生成实验路由。
- 原 V4.1 归档记录：g++ 原生程序编译运行通过；21 项 Chromium 交互检查通过。该记录沿用归档说明，本轮未重新执行 Chromium 套件。
- 生产部署、飞书同步、主站持久化、任意 C++ 编辑运行、延迟复习有效性：未实现、未验收。

**版本门槛**：V3 是一个可运行且可回退的算法实验；经负责人审查前不得发布上线或自动进入生产阶段。
