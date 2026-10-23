# 小知 Xiaozhi · Character Bible v1

**Status:** Canonical vector character implemented, visual approval pending. **Scope:** mascot ONLY; the product remains 65% neobrutalism / 25% pixel academy / 10% quiet learning surfaces.

## 1. Approved visual reference

The concept for Xiaozhi is a **white, short-bodied academic pixel cat** with a navy/electric-blue graduation cap, gold tassel, tiny black facial features, rosy cheek blocks, pink inner ears, a rolled right-side tail, and near-black high-contrast stepwise contours.

The original conversation contains a generated mascot concept board and the approved dashboard images. These are *art direction*, not dynamic application sources. The production mascot is **not independently regenerated** on every page; it is the single source-controlled React SVG component.

Key differences from former placeholder: dedicated face/body proportions, tassel and cap highlight geometry, responsive avatar viewBox, 8 mood states. Avoid generic cats, people, or references to third-party commercial character IP.

## 2. Fixed silhouette and palette

**Canonical art box:** \`128 × 176\` coordinate space. Avatar uses a close viewBox of the *same* face and hat, not a new drawing.

| Identity element | Production token | Rule |
| --- | --- | --- |
| Contour + face elements | \`#12121D\` | Crisp 5px graphic outline |
| Fur | \`#FFFFFF\` | Always white, including dark theme |
| Graduation cap main | \`#246BFF\` / \`#174DE3\` | Never randomize blue per page |
| Cap shadow | \`#163CA4\` / \`#0B287F\` | Distinct brim depth |
| Tassel | \`#FFC935\` + \`#FFE872\` | On character's right |
| Inner ears | \`#FFB2C0\` | Symmetric, triangular |
| Cheeks | \`#FF9FAE\` | Two stepped patches |
| Shaded fur | \`#D1D7EF\` | 2D pixel-depth cue |

**Head/hat/tail anchors:** silhouette remains exactly the same across expressions. Only eyes, mouth, question mark, sparkles and micro-motion differ.

## 3. Component contract

Canonical source: \`web/src/design/pixel-pop/mascot/Xiaozhi.tsx\`.
- \`<Xiaozhi size={120} mood="idle" pose="full" motion="none"/>\`
- \`<Xiaozhi size={32} mood="idle" pose="avatar"/>\`
- \`<Xiaozhi size={72} mood="celebrate" motion="bounce"/>\`
- \`PixelCat\` is a backwards-compatible alias to *this* implementation, not another mascot.
- \`decorative\` hides art from accessibility tree; otherwise image text describes the selected expression.

Moods: \`idle\` | \`happy\` | \`thinking\` | \`curious\` | \`focused\` | \`encourage\` | \`celebrate\` | \`surprised\`.
Motion: \`none\` | \`idle\` | \`wave\` | \`bounce\`; CSS step animations are automatically disabled with \`prefers-reduced-motion\`.

Default to no looped motion in lesson text; motion is strongest only after a learner interaction. No sound, distracting auto-movement or data collection.

## 4. Behavior semantics

| Product state | Expression | Animation |
| --- | --- | --- |
| Dashboard avatar | idle | none |
| Reader concept hint | thinking | idle or none |
| In-progress lab | focused | none |
| Correct quiz answer | celebrate | one-time preferred |
| Incorrect quiz answer | encourage | none |
| Chapter milestone | happy/celebrate | bounce only when explicitly triggered |
| Explorer prompt | curious | none |

Do not insert Xiaozhi in every card. Only meaningful human interaction and key success/failure surfaces should contain a character.

## 5. Actual implementation and preview

- **Living isolated design lab:** \`/ui-lab/xiaozhi\`
- Legacy site compatibility: current \`primitives.tsx\` now exports the canonical mascot, so existing uses in Pixel Pop keep working.
- LEGO batch 01: \`blocks/lego.tsx\` avatar uses the same source.
- Showcase: 8 expressions, 4 size scenarios, day/night backing, motion toggles, learning feedback cards.
- When integrating CoursePack use real quiz state; the design showroom is explicitly a local demo.

## 6. Acceptance

First, compare actual 160px / 96px / 48px / 32px browser-rendered mascot with the approved mascot board. Verify the blue cap, tassel, tail, cheeks, face alignment, outline thickness and expression cohesion. Check on white, yellow, purple and dark background.

Then at 390px, 768px, 1440px: no clipping; labels remain legible; keyboard controls work; reduced-motion disables animation; no hydration/layout shift from random drawing.

**Outstanding:** human approval of vector silhouette against art reference; screenshot and any subsequent retouch. Passing compilation proves that UI can render, **not that visual similarity has been measured**.

## 7. Reuse in other models

> Before rendering Xiaozhi, read docs/XIAOZHI_CHARACTER_BIBLE.md and web/src/design/pixel-pop/mascot/Xiaozhi.tsx. Render Xiaozhi from that component, never re-prompt an image model to reinvent its face. New expression must change expression overlays only and preserve base silhouette and palette. Validate in /ui-lab/xiaozhi at all published sizes and background themes; report genuine browser screenshot differences. Do not add a new mascot package, image font, video system or user-data dependency.
