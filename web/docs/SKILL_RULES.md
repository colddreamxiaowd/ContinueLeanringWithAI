# SKILL_RULES · 项目教学规范草案

## 统一知识点契约

三个 Skill 使用同一个 `KnowledgePoint(id, courseId, chapterId, sourceRefs[])`；Blog、题目和实验只通过 ID 关联，禁止从文章标题猜测匹配。V1 的 sourceRefs 为空，因为资料尚未接入。

## 教育 Skill · Teach → Practice → Feedback → Mastery

1. 先观察学习目标和已有知识；新手从动机/反例开始，熟练者可直接切入推导。
2. 先讲具体例子和直觉，再引入公式、抽象定义、实现与边界。
3. 每个知识点至少一项主动回忆/推演或变式，不把看完文章认作掌握。
4. 允许先答题、逐层提示，再展示解析；反馈应关联错误类型。
5. 掌握度只根据独立作答、代码推演、迁移题和延迟复习证据更新。

## Blog Skill · Xiaowd Blog Writing v1.0

使用 [`skills/xiaowd-blog-writing/SKILL.md`](../skills/xiaowd-blog-writing/SKILL.md) 及其全部参考文件；真实材料优先、先为什么后怎么做、给可复现代码和失败排查、区分验证状态、输出可发布 Markdown。不擅自把演示稿当作真实 PPT 解读。

## 题库 Skill · Question Bank QA（草案）

每题必须有 `id, knowledgePointId, type, difficulty, prompt, answer, explanation, sourceRefs, verificationStatus`。题型按知识属性选，不凑数量。重要计算题需要第二推导或独立程序核对；程序题关联真实可运行测试。上线前阻断缺来源、答案冲突、题干不完整、公式损坏。

## 当前边界

此文件是 V1 设计契约，不是正在自动运行的 Agent/Skill；还没有题库生成 API、质量流水线或学习掌握评估数据库。需 V2 验证。

## V2 实际执行范围

V2 针对栈的三个知识点通过规则识别、离线模板成稿及独立 Python 栈模拟校验。它既不取代 Xiaowd Blog Writing 对真实原始材料的精读要求，也不等于任意学科自动出题。可选模型草稿只执行格式和来源摘录检查；模型给出的答案必须二次验证，且未经审批不能发布。具体实现与未覆盖范围见 `V2_INGESTION.md`。
