/** Shared browser/Node wrapper over actual C++ engine compiled into WebAssembly.
 * Inputs are data only. User code compilation is intentionally unsupported.
 */
export const SYNTHETIC_SAMPLE = Object.freeze({
  rows:6,cols:7,triples:[
    [0,0,5],[0,3,-2],[1,2,7],[2,4,3],
    [3,1,9],[4,5,-4],[5,0,6],[5,3,8]
  ]
});

export function parseTriples(text, rows, cols) {
  if (!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>10||cols>10)
    throw new Error('矩阵的行、列数必须为 1–10 的整数。');
  const triples=[]; const seen=new Set();
  const lines=String(text).split(/\r?\n/);
  for(let n=0;n<lines.length;n++) {
    let line=lines[n].trim();if(!line||line.startsWith('#')||line.startsWith('//')) continue;
    line=line.replace(/[()（）\[\]]/g,'');
    const fields=line.split(/[\s,，;；]+/).filter(Boolean);
    if(fields.length!==3||fields.some(x=>!/^[-+]?\d+$/.test(x)))throw new Error(`第 ${n+1} 行须为：行 列 非零整数，例如 0 0 5。`);
    const t=fields.map(Number); const [r,c,value]=t;
    if(t.some(x=>!Number.isSafeInteger(x))||Math.abs(value)>1000000||value===0)
      throw new Error(`第 ${n+1} 行数值无效：元素必须为绝对值不超过 1000000 的非零整数。`);
    if(r<0||r>=rows||c<0||c>=cols)
      throw new Error(`第 ${n+1} 行下标 (${r},${c}) 超出 ${rows}×${cols} 的 0-based 范围。`);
    const key=`${r},${c}`;
    if(seen.has(key))throw new Error(`第 ${n+1} 行：位置 (${r},${c}) 重复。`);
    seen.add(key);triples.push([r,c,value]);
  }
  return triples.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}

export function referenceTranspose({rows,cols,triples}){
  // Independent column-oriented naive implementation matching PPT algorithm 5-1.
  const b=[];
  for(let col=0;col<cols;col++)
    for(const [r,c,value] of [...triples].sort((a,b)=>a[0]-b[0]||a[1]-b[1]))
      if(c===col)b.push([c,r,value]);
  return {rows:cols,cols:rows,triples:b};
}

export function formatTriples(triples){return triples.map(t=>t.join('  ')).join('\n');}

export async function loadWasm(bytes){
  const {instance}=await WebAssembly.instantiate(bytes);
  return new SparseLab(instance.exports);
}

export class SparseLab {
  constructor(wasm){this.wasm=wasm;this.input=null;this.history=[];this.recording=[];}
  load(rows,cols,triples){
    const data=parseTriples(formatTriples(triples),rows,cols);
    if(this.wasm.lab_reset(rows,cols)!==0)throw new Error('初始化失败');
    for(const [r,c,v] of data){const rc=this.wasm.lab_add(r,c,v);if(rc<0)throw new Error(`输入失败，错误码 ${rc}`);}
    if(this.wasm.lab_prepare()<0)throw new Error('输入排序失败');
    this.input={rows,cols,triples:data};this.history=[];
    const initial=this.snapshot();this.history.push(initial);return initial;
  }
  snapshot(){
    const w=this.wasm;if(!this.input)throw new Error('请先载入矩阵');
    const count=w.lab_count(),cols=w.lab_cols();
    const a=Array.from({length:count},(_,i)=>[w.lab_a(i,0),w.lab_a(i,1),w.lab_a(i,2)]);
    const b=Array.from({length:count},(_,i)=>w.lab_used(i)?[w.lab_b(i,0),w.lab_b(i,1),w.lab_b(i,2)]:null);
    const cnum=Array.from({length:cols},(_,i)=>w.lab_cnum(i));
    const cpot=Array.from({length:cols},(_,i)=>w.lab_cpot(i));
    const cpotStart=Array.from({length:cols},(_,i)=>w.lab_cpot_start(i));
    const event={kind:w.lab_event(),index:w.lab_event_index(),column:w.lab_event_column(),slot:w.lab_event_slot(),value:w.lab_event_value()};
    const done=w.lab_phase()===4;
    const result=done?this.verify(b,cnum,cpotStart,cpot):null;
    return {rows:w.lab_rows(),cols, count, a,b,cnum,cpot,cpotStart,event,done,result,step:w.lab_steps(),phase:w.lab_phase()};
  }
  verify(b,cnum,cpotStart,cpot){
    const expected=referenceTranspose(this.input).triples;
    const pass=JSON.stringify(b)===JSON.stringify(expected)
       && cnum.reduce((a,x)=>a+x,0)===this.input.triples.length
       && cpot.every((value,i)=>value===cpotStart[i]+cnum[i]);
    return {pass, expected, message:pass?'转置三元组、元素数量及 cpot 终态全部与独立核验一致。':'检测到输出或计数不一致，请检查算法。'};
  }
  step(){const k=this.wasm.lab_step();if(k<0)throw new Error('WebAssembly 核心报告越界');
    const snap=this.snapshot();if(k) this.history.push(snap);return snap;
  }
  run(){let s=this.snapshot(),limit=1000;while(!s.done&&limit-->0)s=this.step();
    if(!s.done)throw new Error('运行超过最大安全步数');return s;
  }
  seek(index){if(!Number.isInteger(index)||index<0)throw new Error('步数无效');
    const {rows,cols,triples}=this.input;this.load(rows,cols,triples);
    for(let i=0;i<index;i++){if(this.snapshot().done)break;this.step();}
    return this.snapshot();
  }
}
