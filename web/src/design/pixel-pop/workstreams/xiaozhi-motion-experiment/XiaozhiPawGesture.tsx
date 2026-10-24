/** Experimental, HAND-DESIGNED native SVG pose over a canonical cut-out.
 *
 * This is intentionally distinct from the generated source-exact Rest frame:
 * one can reshape a limb without pretending it existed in the source bitmap.
 * Coordinates are integer source pixels; fills occur in the frozen source's
 * exact 25-colour palette. NOT approved for the production Xiaozhi master.
 */
export type PawGesturePose="up"|"wave";
const STEM_BLACK=
  "M149 397h17v17h-17Z M137 384h23v23h-23Z M126 371h23v22h-23Z "+
  "M115 358h23v22h-23Z M103 345h23v21h-23Z M96 336h23v18h-23Z";
const STEM_WHITE=
  "M153 400h8v9h-8Z M142 389h10v14h-10Z M131 375h10v14h-10Z "+
  "M120 363h10v13h-10Z M108 350h10v13h-10Z M101 338h10v15h-10Z";
const UP_PALM_BLACK="M94 292h21v5h8v7h7v33h-7v9h-37v-9h-6v-30h6v-9h8Z";
const UP_PALM_FUR="M94 301h24v5h6v31h-33v-31h3Z";
const UP_PALM_ACCENT="M95 323h6v9h-6Z M110 321h7v9h-7Z";
const WAVE_PALM_BLACK="M88 287h24v6h8v6h6v32h-6v8h-40v-8h-6v-30h6v-8h8Z";
const WAVE_PALM_FUR="M87 296h26v6h7v28h-34v-28h1Z";
const WAVE_PALM_ACCENT="M89 317h6v9h-6Z M103 314h7v10h-7Z";

/** 220px body size gives ~3 source pixels per screen pixel.
 * All strokes are filled closed SVG paths, no CSS rotation/anti-aliased lines.
 */
export function XiaozhiPawGesture({pose}:{pose:PawGesturePose}){
  const isWave=pose==="wave";
  return <g data-experimental-paw-gesture={pose} shapeRendering="crispEdges" stroke="none">
    <g data-paw-connector="resting-shoulder" fill="#08080C">
      <path d={STEM_BLACK}/>
    </g>
    <g fill="#F8F8F9" data-paw-connector-fur="true"><path d={STEM_WHITE}/></g>
    <g transform={isWave?"translate(-5 -5)":undefined}>
      <path d={isWave?WAVE_PALM_BLACK:UP_PALM_BLACK} fill="#08080C"/>
      <path d={isWave?WAVE_PALM_FUR:UP_PALM_FUR} fill="#F8F8F9"/>
      <path d={isWave?WAVE_PALM_ACCENT:UP_PALM_ACCENT} fill="#FA9C9E"/>
      <path d={isWave?"M94 306h4v4h-4Z":"M102 310h4v4h-4Z"} fill="#BDC5DC"/>
    </g>
  </g>;
}
