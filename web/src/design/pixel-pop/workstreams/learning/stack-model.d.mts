export type StackTransition =
  | {ok:true;stack:number[];value:number;message:string}
  | {ok:false;stack:number[];message:string};
export function normalizeCapacity(capacity?:number):number;
export function readStackInput(raw:string):{ok:true;value:number}|{ok:false;message:string};
export function pushStack(stack:readonly number[],raw:string,capacity?:number):StackTransition;
export function popStack(stack:readonly number[]):StackTransition;
