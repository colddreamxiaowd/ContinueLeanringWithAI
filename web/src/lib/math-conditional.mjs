// G4-M deterministic teaching engine. No model calls, eval(), or browser APIs.
// The second problem has a different causal structure: Bayes' inverse conditional
// rather than sequential drawing. This is an independent transfer task.
export const MATH_ACTIVITY_VERSION = "math-conditional-v1";
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const gcd=(a,b)=>{while(b){const t=a%b;a=b;b=t;}return a||1;};
export function fraction(n,d) {
  if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<=0||n<0||n>d)throw Error("INVALID_PROBABILITY");
  const g=gcd(n,d);return {numerator:n/g,denominator:d/g};
}
export function pretty(value){return value.numerator+"/"+value.denominator;}
export function validateParameters(kind,raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
  if(kind==="draw")return int(raw.red,1,12)&&int(raw.blue,1,12);
  if(kind==="screen")return int(raw.prevalence,1,60)&&int(raw.sensitivity,1,100)&&int(raw.falsePositive,1,99);
  return false;
}
export function solveDraw(params){
  if(!validateParameters("draw",params))throw Error("INVALID_DRAW_PARAMETERS");
  const {red,blue}=params,total=red+blue;
  const joint=fraction(red*blue,total*(total-1));
  const evidence=fraction(red,total);
  const posterior=fraction(blue,total-1);
  return {posterior,joint,evidence,
    counts:{blueThenRed:red*blue,redSecond:red*(total-1),total:total*(total-1)},
    explanation:"先蓝后红的有序抽取路径共有 "+(blue*red)+" 条；第二次红色的路径共有 "+(red*(total-1))+" 条。条件概率 = 蓝→红路径 / 第二次红路径 = "+pretty(posterior)+"。"};
}
export function solveScreen(params){
  if(!validateParameters("screen",params))throw Error("INVALID_SCREEN_PARAMETERS");
  const {prevalence,sensitivity,falsePositive}=params;
  const truePositive=prevalence*sensitivity;
  const falseAlarm=(100-prevalence)*falsePositive;
  const posterior=fraction(truePositive,truePositive+falseAlarm);
  return {posterior,truePositive,falseAlarm,
    explanation:"将每 10000 人归一化：有病且阳性 "+truePositive+"，无病但假阳性 "+falseAlarm+"。阳性群体中真正有病的比例是 "+truePositive+"/"+(truePositive+falseAlarm)+" = "+pretty(posterior)+"。"};
}
export function solve(kind,params){return kind==="draw"?solveDraw(params):kind==="screen"?solveScreen(params):(()=>{throw Error("UNKNOWN_ACTIVITY");})();}
export function parseProbability(raw){
  if(typeof raw!=="string"||raw.length>50)return null;
  const s=raw.trim().replace(/\s+/g,"");
  if(!s)return null;
  const frac=s.match(/^(\d{1,9})\/(\d{1,9})$/);
  if(frac){
    const n=Number(frac[1]),d=Number(frac[2]);
    if(!d||n>d)return null;
    return {...fraction(n,d),rounded:false};
  }
  const match=s.match(/^(\d{1,6})(?:\.(\d{1,6}))?(%)?$/);
  if(!match)return null;
  const integer=Number(match[1]),digits=match[2]||"";
  const d=10**digits.length*(match[3]?100:1);
  const n=integer*10**digits.length+Number(digits||0);
  if(n>d)return null;
  return {...fraction(n,d),rounded:digits.length>0};
}
export function judge(kind,params,answer){
  const expected=solve(kind,params);
  const parsed=parseProbability(answer);
  if(!parsed)return {status:"invalid",message:"请输入 1/2、0.5 或 50% 等 0 到 1 之间的概率。",expected};
  const exact=parsed.numerator*expected.posterior.denominator===parsed.denominator*expected.posterior.numerator;
  // Small tolerance for decimal answers rounded to three or more digits.
  const value=parsed.numerator/parsed.denominator;
  const target=expected.posterior.numerator/expected.posterior.denominator;
  const approximate=!exact&&parsed.rounded&&Math.abs(value-target)<=0.0005;
  return {status:exact||approximate?"correct":"incorrect",message:exact?"计算正确，条件事件与样本空间匹配。":
    approximate?"近似值正确（按小数误差 0.0005 验证）。":
    "暂未通过：检查你是否将条件事件对应的群体作为分母，而不是全部事件。",
    expected};
}
export const INITIAL_MATH_SESSION=()=>({
 version:MATH_ACTIVITY_VERSION,mode:"explain",stage:"draw",
 params:{draw:{red:3,blue:2},screen:{prevalence:2,sensitivity:90,falsePositive:8}},
 answers:{draw:"",screen:""},notes:{draw:"",screen:""},reveal:0,
 attempts:[], discoveries:[], feedback:null
});
export function restoreMathSession(candidate){
 const initial=INITIAL_MATH_SESSION();
 if(!candidate||typeof candidate!=="object"||candidate.version!==MATH_ACTIVITY_VERSION)return initial;
 const safe={...initial, mode:["explain","guided","independent"].includes(candidate.mode)?candidate.mode:"explain",
  stage:["draw","screen"].includes(candidate.stage)?candidate.stage:"draw"};
 for(const kind of ["draw","screen"]){
  if(validateParameters(kind,candidate.params?.[kind]))safe.params[kind]={...candidate.params[kind]};
  if(typeof candidate.answers?.[kind]==="string")safe.answers[kind]=candidate.answers[kind].slice(0,50);
  if(typeof candidate.notes?.[kind]==="string")safe.notes[kind]=candidate.notes[kind].slice(0,4000);
 }
 if(int(candidate.reveal,0,3))safe.reveal=candidate.reveal;
 if(Array.isArray(candidate.attempts))safe.attempts=candidate.attempts.filter(a=>a&&
   ["draw","screen"].includes(a.stage)&&["correct","incorrect","invalid"].includes(a.result)&&
   typeof a.answer==="string"&&typeof a.at==="string").slice(-100).map(a=>({
   stage:a.stage,result:a.result,answer:a.answer.slice(0,50),at:a.at.slice(0,40)
 }));
 if(Array.isArray(candidate.discoveries))safe.discoveries=candidate.discoveries.filter(a=>
    a&&typeof a.body==="string"&&typeof a.at==="string"&&["draw","screen"].includes(a.stage))
    .slice(-30).map(a=>({stage:a.stage,at:a.at.slice(0,40),body:a.body.slice(0,4000),
      verification:"unverified"}));
 return safe;
}
