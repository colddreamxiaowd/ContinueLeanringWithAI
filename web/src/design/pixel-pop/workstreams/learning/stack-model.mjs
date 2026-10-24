/** Pure, deterministic stack semantics. No CoursePack or persistence assumptions. */
export function normalizeCapacity(capacity=6){
  return Number.isSafeInteger(capacity) ? Math.max(1,Math.min(8,capacity)) : 6;
}
export function readStackInput(raw){
  const value=String(raw).trim();
  if(!/^-?\d+$/.test(value))return {ok:false,message:"请输入有效整数（例如 7 或 -2）"};
  const number=Number(value);
  if(!Number.isSafeInteger(number))return {ok:false,message:"数值超出安全整数范围"};
  return {ok:true,value:number};
}
export function pushStack(stack,raw,capacity=6){
  const result=readStackInput(raw);
  if(!result.ok)return {ok:false,stack:[...stack],message:result.message};
  if(stack.length>=normalizeCapacity(capacity))return {ok:false,stack:[...stack],message:"栈已满，最多 "+normalizeCapacity(capacity)+" 个元素"};
  const next=[...stack,result.value];
  return {ok:true,stack:next,value:result.value,message:"Push("+result.value+") 成功，当前栈顶 "+result.value};
}
export function popStack(stack){
  if(!stack.length)return {ok:false,stack:[],message:"空栈无法执行 Pop()"};
  const value=stack[stack.length-1];
  const next=stack.slice(0,-1);
  return {ok:true,stack:next,value,message:"Pop() 弹出 "+value+(next.length?"，新栈顶 "+next[next.length-1]:"，栈已空")};
}
