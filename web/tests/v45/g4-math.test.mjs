import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MATH_ACTIVITY_VERSION,fraction,solveDraw,solveScreen,solve,judge,parseProbability,
  INITIAL_MATH_SESSION,restoreMathSession,validateParameters} from "../../src/lib/math-conditional.mjs";
const frac=(n,d)=>({numerator:n,denominator:d});
test("without replacement exact probability matches exhaustive ordered outcomes",()=>{
  for(let red=1;red<=12;red++)for(let blue=1;blue<=12;blue++){
    const got=solveDraw({red,blue});
    const balls=[...Array(red).fill("r"),...Array(blue).fill("b")];
    let denom=0,num=0;
    for(let i=0;i<balls.length;i++)for(let j=0;j<balls.length;j++)if(i!==j&&balls[j]==="r"){
      denom++;if(balls[i]==="b")num++;
    }
    assert.equal(got.posterior.numerator/got.posterior.denominator,num/denom);
    assert.equal(got.joint.numerator/got.joint.denominator,(blue*red)/(balls.length*(balls.length-1)));
  }
  assert.deepEqual(solveDraw({red:3,blue:2}).posterior,frac(1,2));
});
test("Bayesian transfer differs from direct test sensitivity and normalizes positive cohort",()=>{
  const solved=solveScreen({prevalence:2,sensitivity:90,falsePositive:8});
  assert.deepEqual(solved.posterior,frac(45,241)); // (2*90)/(2*90+98*8)
  assert.equal(solved.posterior.numerator/solved.posterior.denominator<0.2,true);
  for(const a of [1,4,13,43])for(const b of [50,90,100])for(const c of [1,6,30]){
    const p=solveScreen({prevalence:a,sensitivity:b,falsePositive:c});
    assert.ok(p.posterior.numerator<=p.posterior.denominator);
    assert.ok(p.posterior.denominator>0);
  }
});
test("grading allows fractions decimals and percent, rejects malformed, rounds only sufficiently near",()=>{
  const input={red:3,blue:2};
  for(const response of ["1/2","0.5","50%","2/4"]){
    assert.equal(judge("draw",input,response).status,"correct");
  }
  for(const response of ["2","3/0","1/0","abc","-1/4","1/9999999999"]){
    assert.equal(judge("draw",input,response).status,"invalid");
  }
  assert.equal(judge("draw",input,"1/3").status,"incorrect");
  assert.equal(judge("screen",{prevalence:2,sensitivity:90,falsePositive:8},"18.67%").status,"correct");
  assert.equal(judge("screen",{prevalence:2,sensitivity:90,falsePositive:8},"90%").status,"incorrect");
});
test("saved exploration preserves failed attempts and unverified alternative solutions",()=>{
  const s=INITIAL_MATH_SESSION();
  s.mode="independent";s.stage="screen";s.notes.screen="我想使用一个新方法，尚未证明";
  s.attempts.push({stage:"screen",result:"incorrect",answer:"90%",at:"2026-10-24T12:00:00.000Z"});
  s.discoveries.push({stage:"screen",at:"2026-10-24T12:01:00.000Z",
    body:"另一种未经核对的条件事件拆解",verification:"verified"});
  const restored=restoreMathSession(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.mode,"independent");
  assert.equal(restored.stage,"screen");
  assert.equal(restored.notes.screen,s.notes.screen);
  assert.equal(restored.attempts[0].result,"incorrect");
  assert.equal(restored.discoveries[0].verification,"unverified");
  assert.equal(restoreMathSession({version:"0.1"}).version,MATH_ACTIVITY_VERSION);
});
test("invalid state parameters are replaced by safe defaults, and v0.1 unchanged",()=>{
  const s={...INITIAL_MATH_SESSION(),params:{draw:{red:-9,blue:100},screen:{prevalence:300,sensitivity:500,falsePositive:2}}};
  const restored=restoreMathSession(s);
  assert.deepEqual(restored.params.draw,{red:3,blue:2});
  assert.deepEqual(restored.params.screen,{prevalence:2,sensitivity:90,falsePositive:8});
  assert.equal(validateParameters("screen",{prevalence:2,sensitivity:90,falsePositive:8}),true);
  const original=readFileSync(new URL("../../src/lib/coursepack.mjs",import.meta.url),"utf8");
  assert.match(original,/COURSEPACK_SCHEMA_VERSION = "0.1"/);
  const publicPage=readFileSync(new URL("../../src/app/ui-lab/math/page.tsx",import.meta.url),"utf8");
  assert.match(publicPage,/MathWorkbench/);
  const privatePage=readFileSync(new URL("../../src/app/learn/math/page.tsx",import.meta.url),"utf8");
  assert.match(privatePage,/getCurrentUser/);
  assert.match(privatePage,/redirect\(/);
});
test("event endpoint checks authenticated identity and independently re-grades answers",()=>{
  const file=readFileSync(new URL("../../src/app/api/learning/math-events/route.ts",import.meta.url),"utf8");
  assert.match(file,/getCurrentUser\(\)/);
  assert.match(file,/user_id:"eq\."\+user.id/);
  assert.match(file,/const authoritative=judge\(/);
  assert.match(file,/user_id:user.id/);
});
