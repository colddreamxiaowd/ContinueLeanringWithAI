export type TimelineRecord={id:number;kind:"push"|"pop";value:number;stack:number[]};
export type TimelineStage={id:number;label:string;stack:number[];kind:"push"|"pop"|null};
export function stackTimeline(
 initial:readonly number[],current:readonly number[],history:readonly TimelineRecord[],width?:number
):TimelineStage[];
export function popExitBottom(countBefore:number,capacity:number):number;
