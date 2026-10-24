/** Experimental, HAND-DESIGNED native SVG pose over a canonical cut-out.
 *
 * This is intentionally distinct from the generated source-exact Rest frame:
 * one can reshape a limb without pretending it existed in the source bitmap.
 * Coordinates are integer source pixels; fills occur in the frozen source's
 * exact 25-colour palette. NOT approved for the production Xiaozhi master.
 */
export type PawGesturePose="up"|"wave";
const STEM_BLACK=
  "M149 397h17v17h-17Z M141 383h19v21h-19Z M134 370h19v19h-19Z "+
  "M127 356h19v21h-19Z M120 344h18v20h-18Z";
const STEM_WHITE=
  "M153 400h8v9h-8Z M145 388h9v12h-9Z M138 374h9v12h-9Z "+
  "M131 360h9v12h-9Z M124 348h8v11h-8Z";
const UP_PALM_BLACK="M110 299h22v5h7v6h7v31h-6v7h-38v-7h-6v-29h6v-7h8Z";
const UP_PALM_FUR="M111 307h21v5h6v28h-29v-27h2Z";
const UP_PALM_ACCENT="M113 326h5v8h-5Z M125 324h6v8h-6Z";
const WAVE_PALM_BLACK="M102 290h24v6h8v6h6v32h-6v7h-39v-7h-6v-31h6v-8h7Z";
const WAVE_PALM_FUR="M103 299h23v6h7v27h-31v-28h1Z";
const WAVE_PALM_ACCENT="M104 318h5v9h-5Z M118 315h6v10h-6Z";

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
    <g transform={isWave?"translate(-7 -7)":undefined}>
      <path d={isWave?WAVE_PALM_BLACK:UP_PALM_BLACK} fill="#08080C"/>
      <path d={isWave?WAVE_PALM_FUR:UP_PALM_FUR} fill="#F8F8F9"/>
      <path d={isWave?WAVE_PALM_ACCENT:UP_PALM_ACCENT} fill="#FA9C9E"/>
      <path d={isWave?"M108 306h4v4h-4Z":"M118 314h4v4h-4Z"} fill="#BDC5DC"/>
    </g>
  </g>;
}
