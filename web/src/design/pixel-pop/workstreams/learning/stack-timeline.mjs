import {normalizeCapacity} from "./stack-model.mjs";
/** Model-only view projection; latest operation gets the final live visual card. */
export function stackTimeline(initial,current,history,width=4){
  const recent=history.slice(0,width).reverse();
  const changedWithoutHistory=history.length===0&&JSON.stringify(current)!==JSON.stringify(initial);
  const stages=history.length>=width
    ?recent.map(a=>({id:a.id,label:a.kind==="push"?"Push("+a.value+")":"Pop() → "+a.value,stack:a.stack,kind:a.kind}))
    :[{id:0,label:changedWithoutHistory?"当前状态":"初始状态",
      stack:changedWithoutHistory?current:initial,kind:null},
      ...recent.map(a=>({id:a.id,label:a.kind==="push"?"Push("+a.value+")":"Pop() → "+a.value,stack:a.stack,kind:a.kind}))];
  return [...stages,...Array.from({length:Math.max(0,width-stages.length)},(_,i)=>({
    id:-(i+1),label:"等待下一步",stack:[],kind:null
  }))];
}
/** CSS stage uses a 166px stack column and 12px baseline; count is pre-pop. */
export function popExitBottom(countBefore,capacity){
  return 12+(countBefore-1)*166/normalizeCapacity(capacity);
}
