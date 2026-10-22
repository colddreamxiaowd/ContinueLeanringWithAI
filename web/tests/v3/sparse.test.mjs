import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadWasm,parseTriples,referenceTranspose,SYNTHETIC_SAMPLE} from '../../src/lib/sparse-lab-controller.mjs';
const provenance=JSON.parse(fs.readFileSync(new URL('../../content/v3-sample/source.json',import.meta.url),'utf8'));
const bytes=fs.readFileSync(new URL('../../public/wasm/sparse_transpose.wasm', import.meta.url));
const lab=async()=>loadWasm(bytes);
function sample(rows,cols,triples){return {rows,cols,triples};}

test('Synthetic 8 triples transposes accurately',async()=>{
 const e=await lab();e.load(...[SYNTHETIC_SAMPLE.rows,SYNTHETIC_SAMPLE.cols,SYNTHETIC_SAMPLE.triples]);
 const s=e.run();assert.equal(s.step,24);assert.equal(s.result.pass,true);assert.deepEqual(s.b,referenceTranspose(SYNTHETIC_SAMPLE).triples);
 assert.deepEqual(s.cnum,[2,1,1,2,1,1,0]);assert.deepEqual(s.cpotStart,[0,2,3,4,6,7,8]);
});
test('Each step changes event and deterministic backtracking',async()=>{
 const e=await lab();e.load(2,3,[[0,1,7],[1,0,5]]);let f=e.step();assert.equal(f.event.kind,1);assert.deepEqual(f.cnum,[0,1,0]);
 const first=JSON.stringify(f);e.step();assert.equal(JSON.stringify(e.seek(1)),first);
});
test('Empty matrix performs prefix steps and finishes',async()=>{const e=await lab();e.load(1,3,[]);const s=e.run();assert.equal(s.result.pass,true);assert.equal(s.step,4);assert.deepEqual(s.b,[]);});
test('Single-row matrix',async()=>{const e=await lab();e.load(1,4,[[0,3,-8],[0,0,3]]);assert.equal(e.run().result.pass,true);});
test('Single-column matrix',async()=>{const e=await lab();e.load(4,1,[[3,0,8],[0,0,-3]]);assert.equal(e.run().result.pass,true);});
test('Full 10x10 matrix of nonzero integers',async()=>{const e=await lab();const t=Array.from({length:100},(_,i)=>[Math.floor(i/10),i%10,i+1]);e.load(10,10,t);assert.equal(e.run().result.pass,true);});
test('Reject duplicate coordinate',()=>assert.throws(()=>parseTriples('0 0 1\n0 0 2',2,2),/重复/));
test('Reject out-of-bounds coordinate',()=>assert.throws(()=>parseTriples('3 0 1',2,2),/超出/));
test('Reject zeros',()=>assert.throws(()=>parseTriples('0 0 0',2,2),/非零/));
test('Reject oversized value',()=>assert.throws(()=>parseTriples('0 0 1000001',2,2),/1000000/));
test('Reject dimensions >10',()=>assert.throws(()=>parseTriples('',11,3),/1–10/));
test('Reject arbitrary code-like characters',()=>assert.throws(()=>parseTriples('eval(alert(1))',2,2),/须为/));
test('Randomized fast vs naive reference, deterministic 200 cases',async()=>{
 let rng=20261021; const next=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/2**32};
 const e=await lab();
 for(let iteration=0;iteration<200;iteration++){
  const rows=1+Math.floor(next()*10),cols=1+Math.floor(next()*10),triples=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(next()>.78)triples.push([r,c,1+Math.floor(next()*100)]);
  e.load(rows,cols,triples);assert.equal(e.run().result.pass,true,`case ${iteration}`);
 }
});

test('Synthetic source manifest exactly matches sample input',()=>{
 assert.equal(provenance.slide_count,12);
 assert.equal(provenance.sha256,'10903e0110428b535f74bcd6dff4b76a69420cfd5a79a09379442f36355e93ea');
 assert.deepEqual(provenance.triples,SYNTHETIC_SAMPLE.triples);
 assert.equal(provenance.input_type,'synthetic-sample');
});
