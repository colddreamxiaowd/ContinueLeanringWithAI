# Xiaozhi · halo cleanup, optical-size icons and semantic grouping (2026-10-23)

Scope: **Only Xiaozhi asset rendering**. This changes no CoursePack storage, Feishu connector, site data or default privacy.

## Evidence: screenshot, not guesswork

Two user-supplied 573x573 dark-mode screenshots were compared with the
existing native-vector foreground alpha mask:

| screenshot | bright pixels outside silhouette within 3px |
| --- | ---: |
| \`image(20261023-052003).png\` — visible bright halo | 4,656 |
| \`image(20261023-052013).png\` — no bright halo | 0 |

The canonical **25 native-color path** master already had **no white outer stroke**.
The bright outline belonged to the *composited image/preview*, not the character's
white fur. Therefore do **not** erase the white body, shrink the mask, or
overwrite the pixel-accurate source master.

### Implemented

1. Removed the extra mascot drop-shadow filter from the showroom and set the
   character's art to a truly transparent, no-filter and no-outline surface.
2. Replaced the nested SVG \`<image href="/.../xiaozhi-traced-master.svg">\`
   render in \`Xiaozhi.tsx\` with **inline grouped vector path geometry**.
   This avoids a second SVG-image resampling step; no stroke or halo is added.
3. Stopped the legacy circular avatar clip from cutting off the broad mortarboard.
4. Added **24px and 32px optical-size SVG avatars**. These intentionally use
   tighter, face-first framing with micro-pixel nose/mouth adjustments. Both
   are vector paths, not raster images in SVG containers.
5. Added \`XiaozhiLayers.tsx\` with 12 named, static parts:
   \`hat\`, \`tassel\`, \`ear-left\`, \`ear-right\`, \`eye-left\`, \`eye-right\`,
   \`mouth\`, \`blush-left\`, \`blush-right\`, \`tail\`, \`torso\`, \`face\`.
   The parts can be isolated in \`/ui-lab/xiaozhi\`. They are classified
   pixel regions, **not an articulated skeleton**.
6. A dependency-free Node test compares the reconstructed rasterized
   573x573 color grid against the original 25-color master: the **179,751
   foreground pixels must match exactly**, and no two groups may overlap.

### Visual QA before final product approval

- Reference full pose: display on light and dark backgrounds with no bright
  outer ring. Compare the mask against the 573px master, especially hat brim,
  nose, cheeks, tassel tip, body shadow and right curled tail.
- Avatar: 24 / 32 / 48px inspect original hat tips and mouth legibility.
  Optical master intentionally differs at 24/32 to keep eyes and mouth readable.
- Responsive: 390, 768, 1440 CSS widths, DPR 1 and 2 where possible.
- Motion: reduced-motion preference disables wave and bounce.
- Current \`mood\` values on the source-accurate trace **use small status labels**;
  actual independently editable expressions and pose animation require new
  approved frames and part-specific redraws. Do not represent those labels as
  eight authentic facial animations.

### User-approved design constraints

65% neobrutalism, 25% pixel academy, 10% content whitespace. Xiaozhi stays
white-furred with original #08080C black rim, #11329D cap shadow, pink cheeks
and gold tassel. **Do not draw an additional white sticker border in dark mode.**
Never hallucinate or re-generate a replacement cat in place of the source master.

### Manual reproduce and review

Visit the preview branch at \`/ui-lab/xiaozhi\`. In the three-way art switcher,
use the path trace variant (default). The middle of the page now lets you
select each semantic part. Compare the optical-size icons at bottom.
The \`art=reference\` embedded-PNG and \`art=vector\` old hand-drawn polygon
variants remain for archival A/B testing only.

## Results boundary

Verified outside the browser: original 573px mask -> dark compositing
produces **zero** bright outer pixels in the 3px ring; source foreground
is unchanged. CI verifies TS, build and cross-layer pixel equality. This
alone does not claim an automatically measured 100% screenshot match at
arbitrary browser scaling; the review build is deliberately unmerged.
