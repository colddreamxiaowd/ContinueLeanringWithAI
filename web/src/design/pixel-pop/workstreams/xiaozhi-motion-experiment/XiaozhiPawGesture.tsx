/** Experimental, separately editable PIXEL-ART paw pose.
 * Approved Xiaozhi master is never changed. The static source arm is cut out
 * by XiaozhiPawRemoval and remains exactly recoverable via XiaozhiPawRest.
 *
 * Unlike the earlier "beads on a wire" forearm, each pose contains a SINGLE
 * contiguous orthogonal dark silhouette + continuous fur interior.
 * Palm is a deliberately new experiment in the canonical palette, not a
 * claimed pixel-exact limb existing in the approved mother SVG.
 */
export type PawGesturePose="up"|"wave";

/** One closed eight-direction-free staircase from visible wrist to shoulder.
 * The connector overlaps source-backed shoulder around (153,405), so no
 * detached glove or dark gaps appear during motion.
 */
const ARM_OUTER=
  "M76 326h26v9h12v15h12v14h12v13h13v15h14v8h11v18h-30v-8h-12v-14h-12v-13h-12v-12H98v-15H86v-13H76Z";
const ARM_FUR=
  "M84 335h13v8h11v13h12v13h12v14h13v15h13v6h9v8h-13v-8h-13v-14h-13v-13h-12v-12h-12v-15H92v-9h-8Z";

/** A chubby kitten paw, with three stepped knuckle bumps instead of a
 * rectangle mitten. All corners and pads use whole source coordinates.
 */
const PALM_OUTER=
  "M78 279h12v-5h12v-6h14v5h10v8h9v12h6v25h-5v10h-9v8H76v-6h-9v-9h-7v-33h6v-9h12Z";
const PALM_FUR=
  "M80 289h27v-7h12v7h7v10h6v20h-6v9H78v-7h-8v-20h5v-12h5Z";
const TOE_PADS=
  "M83 301h10v8H83Z M101 297h10v8h-10Z M118 302h9v8h-9Z";
const CENTER_PAD="M96 315h18v11H96Z";
const PAD_GLINT="M101 318h5v3h-5Z";

/** Geometry intentionally has no CSS rotation or non-integer scaling:
 * every color remains an editable, crisp native SVG path.
 * The 2nd frame moves the full palm 12 source pixels outward and 2 down,
 * while maintaining an 8+ source-pixel wrist/arm overlap.
 */
export function XiaozhiPawGesture({pose}:{pose:PawGesturePose}){
 const waving=pose==="wave";
 return <g data-experimental-paw-gesture={pose}
   data-gesture-geometry="connected-single-silhouette"
   stroke="none" shapeRendering="crispEdges">
   {/* Black geometry is painted FIRST, then fur spans BOTH wrist and palm.
        Avoids the prior black seam that made the paw look like a glove on
        a string. These overlays are wholly inside the isolated experiment. */}
   <path data-paw-arm-outline="single" fill="#08080C" d={ARM_OUTER}/>
   <g data-paw-palm="source-palette-new-artwork"
      transform={waving?"translate(-12 2)":undefined}>
     <path data-palm-contour="joined" d={PALM_OUTER} fill="#08080C"/>
   </g>
   <path data-paw-arm-fur="continuous" fill="#F8F8F9" d={ARM_FUR}/>
   <path data-paw-wrist-link="fur-join" fill="#F8F8F9"
     d="M84 323h16v19H84Z"/>
   <g data-paw-detail="pink-pads" transform={waving?"translate(-12 2)":undefined}>
     <path d={PALM_FUR} fill="#F8F8F9"/>
     <path d={TOE_PADS} fill="#FA9C9E"/>
     <path d={CENTER_PAD} fill="#FB7A83"/>
     <path d={PAD_GLINT} fill="#F8F8F9"/>
   </g>
 </g>;
}
