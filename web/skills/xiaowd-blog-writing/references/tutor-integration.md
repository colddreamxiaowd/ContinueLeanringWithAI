# 与已有 tutor-skill 协作

用户已有 `tutor-skill`，提供 Assess → Orient → Guide → Check → Summarize 与跨学科教学。保留它的数学、互动辅导、报错定位能力；本 Skill 专门处理完整可发布技术博客的写作流程。

## 分工

- `tutor-skill`：诊断学习起点、推导、互动教学、掌握检测。
- `xiaowd-blog-writing`：为读者组织故事线、校验原文材料、真实代码与实验、排版、引用、系列连续性和最终发布。

## 给旧 tutor-skill 的可选补充行

在旧 `tutor-skill/SKILL.md` 的“深度博客”规则附近增加（用户自行采用）：

> 当用户要将技术教学整理成完整、可发布的中文博客或连续实战系列时，优先采用项目中 `xiaowd-blog-writing` Skill 的写作工作流、原文忠实性和交付验收规范；普通数学问答或互动教学仍按本 Tutor Skill 处理。

如果当前 Agent 不能跨 Skill 读取，直接指示它阅读 `xiaowd-blog-writing/SKILL.md` 与需要的参考文件即可。避免同时加载两份冗长互相矛盾的模板。
