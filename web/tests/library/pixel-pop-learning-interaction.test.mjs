import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeCapacity,readStackInput,pushStack,popStack} from "../../src/design/pixel-pop/workstreams/learning/stack-model.mjs";
import {createQuizSession,evaluateQuizAttempt} from "../../src/design/pixel-pop/workstreams/learning/quiz-model.mjs";

const base=resolve(dirname(fileURLToPath(import.meta.url)),"../../src/design/pixel-pop/workstreams/learning");
const source=(file)=>readFileSync(resolve(base,file),"utf8");

test("Push / Pop implements LIFO and does not mutate its input",()=>{
  const original=[];
  const a=pushStack(original,"7");
  const b=pushStack(a.stack,"3");
  const c=popStack(b.stack);
  assert.deepEqual(original,[]);
  assert.deepEqual(a.stack,[7]);
  assert.deepEqual(b.stack,[7,3]);
  assert.deepEqual(c.stack,[7]);
  assert.equal(c.value,3);
  assert.equal(c.ok,true);
});

test("validation distinguishes invalid input, zero, negative integers and overflow",()=>{
  for(const raw of [""," ","hi","1.5","NaN","Infinity","9007199254740993"]){
    assert.equal(readStackInput(raw).ok,false,raw);
  }
  assert.deepEqual(readStackInput("-2"),{ok:true,value:-2});
  assert.deepEqual(readStackInput("0"),{ok:true,value:0});
  const full=pushStack([1,2],"3",2);
  assert.equal(full.ok,false);
  assert.deepEqual(full.stack,[1,2]);
  assert.equal(normalizeCapacity(0),1);
  assert.equal(normalizeCapacity(99),8);
  assert.equal(normalizeCapacity(2.4),6);
  const empty=popStack([]);
  assert.equal(empty.ok,false);
  assert.deepEqual(empty.stack,[]);
});

test("D components are isolated and reuse shared primitive components",()=>{
  const play=source("StackPlayground.tsx");
  const quiz=source("QuizCard.tsx");
  const feedback=source("AnswerFeedback.tsx");
  const demo=source("Demo.tsx");
  assert.match(play,/PopButton/);
  assert.match(play,/onOperation/);
  assert.match(play,/aria-live="polite"/);
  assert.match(quiz,/onAnswer/);
  assert.match(quiz,/onAttempt/);
  assert.match(quiz,/shouldReport/);
  assert.match(quiz,/disabled=\{locked\}/);
  assert.match(quiz,/correctOptionId/);
  assert.match(feedback,/Xiaozhi/);
  assert.match(feedback,/onOpenPractice/);
  assert.doesNotMatch(feedback,/栈顶|illustratedStack|Push\(|Pop\(/);
  assert.match(demo,/ProgressRing/);
  assert.match(demo,/StackAnswerIllustration/);
  assert.match(demo,/演示/);
  for(const text of [play,quiz,feedback,demo]){
    assert.match(text,/learning\.module\.css/);
  }
});

test("responsive breakpoints and reduced-motion are component-local",()=>{
  const css=source("learning.module.css");
  for(const rule of ["@media (max-width:1150px)","@media (max-width:768px)",
    "@media (max-width:450px)","prefers-reduced-motion","var(--pp-blue",
    "var(--pp-purple","var(--pp-ink"]){
    assert.ok(css.includes(rule),rule);
  }
});


test("retry events are visible but scored only once per question",()=>{
  let session=createQuizSession("q1");
  let scored=0,attempts=0;
  for(const id of ["a","b","b"]){
    const result=evaluateQuizAttempt(session,"q1",id,"b");
    session=result.session;
    attempts++;
    if(result.shouldReport)scored++;
  }
  assert.equal(attempts,3);
  assert.equal(scored,1);
  assert.equal(session.attempts,3);
  const switched=evaluateQuizAttempt(session,"q2","c","c");
  assert.equal(switched.shouldReport,true);
  assert.equal(switched.attempt,1);
  assert.equal(switched.correct,true);
});

test("multi-step experiment preserves LIFO across full, empty, reset",()=>{
  let stack=[];
  const states=[stack];
  for(const val of ["1","2","3"]){
    const result=pushStack(stack,val,3);
    assert.equal(result.ok,true);
    stack=result.stack;
    states.push(stack);
  }
  const full=pushStack(stack,"4",3);
  assert.equal(full.ok,false);
  assert.deepEqual(full.stack,[1,2,3]);
  for(const expected of [3,2,1]){
    const result=popStack(stack);
    assert.equal(result.ok,true);
    assert.equal(result.value,expected);
    stack=result.stack;
  }
  assert.equal(popStack(stack).ok,false);
  assert.deepEqual(stack,[]);
  assert.deepEqual(states[1],[1]);
});

test("pop exit and push entry use real operation value and reduced-motion fallback",()=>{
  const stack=source("StackPlayground.tsx");
  const css=source("learning.module.css");
  assert.match(stack,/setPopVisual/);
  assert.match(stack,/value:result\.value/);
  assert.match(stack,/stage\.id===popVisual\.id/);
  assert.match(css,/@keyframes stackPop/);
  assert.match(css,/\.popGhost\{display:none!important;animation:none!important\}/);
  assert.match(css,/\.slotEnter\{animation:none!important\}/);
});
