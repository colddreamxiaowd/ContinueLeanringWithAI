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

/** Source-grid centerline from the palm wrist to the ORIGINAL left shoulder.
 * An identical pixel brush in every sample guarantees a CLOSED, thick arm:
 * no dark beads, no missing pixels at the bends, consistent 6px edge weight.
 * All geometry stays integer and is merged into native SVG RLE paths.
 */
const ARM_JOINTS:readonly (readonly [number,number])[]=[
  [160,407],[146,395],[133,383],[121,370],[111,358],[101,346],[91,334]
];
function sourceGridRibbon(radius:number):string{
  const rows=new Map<number,Set<number>>();
  const pixel=(x:number,y:number)=>{
    let row=rows.get(y);
    if(!row){row=new Set<number>();rows.set(y,row);}
    row.add(x);
  };
  for(let segment=0;segment<ARM_JOINTS.length-1;segment++){
    const [ax,ay]=ARM_JOINTS[segment], [bx,by]=ARM_JOINTS[segment+1];
    const n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));
    for(let i=0;i<=n;i++){
      const x=Math.round(ax+(bx-ax)*i/n),y=Math.round(ay+(by-ay)*i/n);
      for(let yy=y-radius;yy<=y+radius;yy++)
        for(let xx=x-radius;xx<=x+radius;xx++)pixel(xx,yy);
    }
  }
  type R={x:number,y:number,w:number,h:number};
  const rects:R[]=[];
  let active=new Map<string,R>();
  for(let y=0;y<573;y++){
    const xs=[...(rows.get(y)||[])].sort((a,b)=>a-b);
    const next=new Map<string,R>();
    for(let i=0;i<xs.length;){
      const x=xs[i];let w=1;
      while(i+w<xs.length&&xs[i+w]===x+w)w++;
      const key=x+":"+w,old=active.get(key);
      if(old&&old.y+old.h===y){old.h++;next.set(key,old);}
      else{const fresh={x,y,w,h:1};rects.push(fresh);next.set(key,fresh);}
      i+=w;
    }
    active=next;
  }
  return rects.map(r=>`M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}Z`).join(" ");
}
const ARM_OUTER=sourceGridRibbon(16); // 33 source px
const ARM_FUR=sourceGridRibbon(10); // 21 source px, 6 px border

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
