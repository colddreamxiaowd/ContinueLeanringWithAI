# Session C ↔ CoursePack v0.1 integration boundary

Read-only adapter: `coursepack-adapter.mjs` / `adaptCoursePackV01`.
Canonical storage/validation remains `web/src/lib/coursepack.mjs` on `feat/coursepack-v01-foundation-20261022`. The Session C baseline does **not** contain that module; integration must call `validateCoursePack` before passing its result to this adapter.

| CoursePack v0.1 | Session C | Mapping |
| --- | --- | --- |
| `chapters[].id`, `title` | ChapterOutline | Stable chapter IDs and titles |
| `blocks[].id` | DOM ID, outline selection | Original IDs retained, scroll-to-element |
| `explanation.markdown` | paragraph blocks | Escaped plain text split only at blank lines; no untrusted Markdown/HTML execution |
| `code.language`, `code.source` | code display | Read-only; copy feedback; never execute |
| `quiz`, `stack-simulator` | activity placeholder | `onOpenActivity(blockId)` supplied by CoursePack container, no duplicate learning state |
| `blocks[].sourceRefIds` | citation chips | Chips use source IDs, resolved against sourceRefs |
| `sourceRefs[].id/fileName/locator` | source card | Filename and locator only; provenance explicitly *not verified* |

### Figure and source security

- v0.1 has **no native figure block**. Do not insert an invented `figure` record into persisted JSON. The integrating application may add a trusted presentation-only `figure` after a validated explanation block, with an approved React illustration or same-origin absolute path (`/assets/...`) using `imageSrc`.
- Never take JSX, script, arbitrary HTML, or remote image URL directly from CoursePack JSON. `figureFallback` is used for missing illustrations; never show a broken diagram as if sourced.
- v0.1 has **no source URL**. Optional `sourceLinks` come from authenticated library lookup keyed by `sourceRefs[].id`, not inferred from `fileName` or guessed from a locator. UI labels remain "私人课程 · 未核实原文" even if a URL exists; only an actual verified source can justify a stronger claim in a future contract.
- Unknown/missing source references are visible, not silently dropped. Full validation should reject them before adaptation.
- `demo` provenance is explicit, hyperlinks suppressed even if supplied; no synthetic source is a claimed real Feishu record.

### Integration guidance

- The CoursePack container owns `completedBlockIds`, `answers`, `simStacks`, active chapter/block, authenticated link resolution, and activity UI. Session C never writes progress or requests Feishu access.
- On outline click, update chapter/block in the container and scroll after its target mounts. Local targets scroll and receive focus directly; absent targets trigger `onNavigate` for route/section switching.
- Three density modes are visual only; they do not rewrite imported content or course progress.