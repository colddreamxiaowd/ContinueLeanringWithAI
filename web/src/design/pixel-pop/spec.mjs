/**
 * Pixel Pop v1 is the canonical machine-readable source of visual decisions.
 * 65 / 25 / 10 are design-emphasis guidelines, not literal pixel-area targets.
 * Other LLMs must use these tokens instead of guessing colors or fonts.
 */
export const PIXEL_POP_VERSION = "1.0.0";
export const PIXEL_POP_WEIGHTS = Object.freeze({
  neobrutalism: 65, pixelAcademy: 25, whitespace: 10,
});
export const PIXEL_POP_TOKENS = Object.freeze({
  ink: "#12121D",
  paper: "#FFFFFF",
  canvas: "#F5F7FF",
  violet: "#7440FF",
  violetSoft: "#EDE6FF",
  blue: "#246BFF",
  blueSoft: "#E9F1FF",
  yellow: "#FFE342",
  mint: "#24DBA6",
  mintSoft: "#DDFBF0",
  coral: "#FF6E75",
  orange: "#FFA553",
  quiet: "#626B87",
  border: "3px solid #12121D",
  radius: "14px",
  hardShadow: "5px 5px 0 #12121D",
  space: [4,8,12,16,24,32,48],
});
export const PIXEL_POP_MODES = Object.freeze(["minimal","balanced","normal"]);
export function normalizePixelPopMode(mode) {
  return PIXEL_POP_MODES.includes(mode) ? mode : "balanced";
}
/**
 * Checked against actual named exports. PixelCat is an alias, not a second cat.
 * "public" here means importable from this feature branch, NOT production-ready.
 */
export const PIXEL_POP_COMPONENT_REGISTRY = Object.freeze({
  reusable: Object.freeze([
    Object.freeze({name:"PopPanel",file:"primitives.tsx",gate:"css-coupled"}),
    Object.freeze({name:"PopButton",file:"primitives.tsx",gate:"css-coupled"}),
    Object.freeze({name:"ProgressRing",file:"primitives.tsx",gate:"css-coupled"}),
    Object.freeze({name:"Xiaozhi",file:"mascot/Xiaozhi.tsx",gate:"identity-locked"}),
    Object.freeze({name:"XiaozhiLayers",file:"mascot/XiaozhiLayers.tsx",gate:"internal-identity-locked"}),
    Object.freeze({name:"BrandHeader",file:"blocks/lego.tsx",gate:"visual-review"}),
    Object.freeze({name:"StackMonument",file:"blocks/lego.tsx",gate:"visual-review"}),
    Object.freeze({name:"CourseHero",file:"blocks/lego.tsx",gate:"visual-review"}),
  ]),
  aliases:Object.freeze(["PixelCat"]),
  demoOnly:Object.freeze(["MiniBadge","StackPlayground","QuizCard"]),
  pageCompositions:Object.freeze(["DashboardContent","ReaderContent","LabContent","QuizContent","PixelPopHome"]),
});
export const PIXEL_POP_COMPONENTS = Object.freeze([
  ...PIXEL_POP_COMPONENT_REGISTRY.reusable.map(x=>x.name),
  ...PIXEL_POP_COMPONENT_REGISTRY.aliases,
]);
