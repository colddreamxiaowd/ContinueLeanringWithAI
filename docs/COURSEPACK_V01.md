# CoursePack v0.1 — private interactive course slice

## What you can do

Visit **/coursepacks** after signing in. Paste or upload one JSON CoursePack, preview
it without saving, save it as a **private** course, reopen it, read explanation
and code, perform push/pop stack operations, answer quizzes, and save progress
under the signed-in account.

This is a real interactive renderer with persistent Postgres progress, but
is **not yet an automatic Feishu-to-course generator**. Feishu source material
is currently connected through the existing library and the offline Qoder +
ChatGPT course-authoring step. The sources in the example are synthetic.

Deploy steps: apply migration
\`supabase/migrations/202610220002_coursepacks.sql\` after the earlier
public learning library migration; deploy the \`web/\` Next app with the existing
Supabase environment. Never place Feishu file bytes, tokens, or private course
data in the public GitHub repository.

## CoursePack data contract

Each pack has:

- \`schemaVersion: "0.1"\`, \`title\`, \`description\`, \`version\` (positive integer)
- optional \`visibility: "private"\` (public imports not supported)
- \`sourceRefs: [{id, fileName, locator}]\`
- \`chapters: [{id, title, blocks: [...] }]\`

Supported block forms:

| type | required fields | behavior |
| --- | --- | --- |
| explanation | id, markdown | escaped text explanation; do not execute HTML |
| code | id, language, source | code-reading display, **no execution** |
| quiz | id, prompt, options, answerIndex | learner answers and sees feedback |
| stack-simulator | id, initial, capacity | push/pop/reset operating on a real stack |

Each block may carry \`sourceRefIds\`, resolving to the pack's \`sourceRefs\`.

Example (all content synthetic):

\`\`\`json
{
  "schemaVersion": "0.1",
  "title": "栈：Push 与 Pop（演示）",
  "description": "不涉及私人原件的示例课程。",
  "version": 1,
  "visibility": "private",
  "sourceRefs": [{"id": "demo12", "fileName": "演示资料.pptx", "locator": "第12页"}],
  "chapters": [{
    "id": "ch1",
    "title": "栈的基本概念",
    "blocks": [
      {"id": "intro", "type": "explanation", "markdown": "栈遵守 LIFO。",
       "sourceRefIds": ["demo12"]},
      {"id": "code1", "type": "code", "language": "python", "source": "stack.append(3)"},
      {"id": "sim1", "type": "stack-simulator", "initial": [3,7], "capacity": 6},
      {"id": "quiz1", "type": "quiz", "prompt": "最后入栈的是？",
       "options": ["3", "7"], "answerIndex": 1}
    ]
  }]
}
\`\`\`

## Low-cost authoring prompt

Give Qoder and ChatGPT **the minimal approved source excerpt, its Feishu file
name and page/paragraph locator**, plus the repository's
\`web/skills/xiaowd-blog-writing/SKILL.md\` instructions for high-quality
causal explanation. Refer to OpenMAIC interactive-classroom methods for
interactive pedagogy. Ask:

> 请只依据给定资料和来源定位，生成一份严格符合 CoursePack v0.1 的
> JSON。用 explanation 讲清原理；用 quiz 检验理解；适合栈的内容可用
> stack-simulator；源代码只使用 code 阅读块。每个与来源有关的教学块都
> 引用 sourceRefIds。不得捏造原文页码、填充模型未经证实的事实、输出脚本、
> 视频或含不受信任 HTML 的块。课程默认 private。没有交互价值的块宁可
> 用 explanation，不要假造可运行的模拟器。

Review the result and import it at \`/coursepacks\`. A public course publishing
workflow, auto generation by API, OCR and learning analytics are later work.

## Next build steps

1. Close the authenticated Feishu V4.7 folder import and source-reader
   acceptance using real materials and the precise deployed SHA.
2. Add a private **source-extraction task packet** from a selected \`library_items\`
   record with fine-grained location links, then validate first genuine lesson.
3. Add per-course version migration, a lesson/chapter navigator and export
   review flow; extend interactive block registry only for verified pedagogic needs.
