/** ISOLATED ARTWORK STUDY — compact kitten forepaw, not a human arm.
 * This is NOT a change to the approved Xiaozhi master.
 *
 * Anatomical constraints (573 source-pixel viewBox):
 * - No long extension to the outside of the face.
 * - Paw remains beside the lower cheek, at x121..172 / y343..398.
 * - Forearm begins behind that paw and rejoins the original shoulder by y419.
 * - Forearm and paw are short, filled, stepped silhouettes without stroke.
 *
 * Crucially, the original XiaozhiLayers render unchanged at rest; this SVG is
 * shown only during the short 'paw'/'wave' interval in the isolated lab.
 */
export type PawGesturePose="up"|"wave";

/** Total new motion footprint is roughly 64x76 source px, instead of the
 * previous human-like 110+ px diagonal arm.
 */
const ARM_OUTER="M139 377h29v9h9v12h8v21h-35v-12h-8v-10h-9v-12h6Z";
const ARM_FUR="M145 383h18v9h9v12h7v9h-22v-11h-8v-10h-4Z";

const PALM_OUTER=
 "M138 348h10v-5h12v6h7v9h5v26h-6v9h-11v5h-24v-6h-10v-29h5v-10h12Z";
const PALM_FUR=
 "M138 355h16v-5h8v10h5v23h-5v7h-26v-6h-8v-21h5v-8h5Z";
const PAW_PADS="M132 370h8v8h-8Z M147 369h7v8h-7Z";
const PAW_CUSHION="M139 381h16v7h-16Z";

/** Single short connected arm, 2 editable paw pads, no human fingers.
 * A <=9px outward swing reads as a gentle hello rather than reaching.
 */
export function XiaozhiPawGesture({pose}:{pose:PawGesturePose}){
 const waving=pose==="wave";
 return <g data-experimental-paw-gesture={pose}
   data-gesture-geometry="connected-single-silhouette"
   data-gesture-proportion="compact-kitten-paw"
   stroke="none" shapeRendering="crispEdges">
   <path data-paw-arm-outline="single" fill="#08080C" d={ARM_OUTER}/>
   <g data-paw-palm="source-palette-new-artwork"
      transform={waving?"translate(-9 0)":undefined}>
     <path data-palm-contour="joined" d={PALM_OUTER} fill="#08080C"/>
   </g>
   <path data-paw-arm-fur="continuous" fill="#F8F8F9" d={ARM_FUR}/>
   <path data-paw-wrist-link="fur-join" d="M144 381h16v13h-16Z" fill="#F8F8F9"/>
   <g data-paw-detail="pink-pads" transform={waving?"translate(-9 0)":undefined}>
     <path d={PALM_FUR} fill="#F8F8F9"/>
     <path d={PAW_PADS} fill="#FA9C9E"/>
     <path d={PAW_CUSHION} fill="#FB7A83"/>
   </g>
 </g>;
}
