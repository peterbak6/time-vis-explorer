import {bin,binEnd,effective,transformValues,prepareCycle,type Point,type Series,type Settings} from './pipeline.ts';
export type RecordItem={id:string;group:string;label:string;start:string;end?:string;text?:string;background?:string;source?:string};
export type RecordDataset={id:string;title:string;kind:'events'|'intervals';precision:'second'|'day'|'year';source:string;attribution:string;note:string;min:string;max:string;defaultFrom:string;defaultTo:string;defaultGroups:string[];groups:{id:string;name:string}[];records:RecordItem[]};
export type Measure='records'|'starts'|'ends'|'active'|'duration';
export const time=(t:string)=>Date.parse(t.endsWith('Z')?t:t+'Z');
export function duration(r:RecordItem,precision:RecordDataset['precision']){return r.end?(precision==='year'?+r.end.slice(0,4)-+r.start.slice(0,4):(time(r.end)-time(r.start))/60000):null;}
export function visibleRecords(data:RecordDataset,ids:string[],from:string,to:string){const lo=time(from+'T00:00:00'),hi=time(to+'T00:00:00')+86400000;return data.records.filter(r=>ids.includes(r.group)&&time(r.start)<hi&&(r.end?time(r.end)>lo:time(r.start)>=lo)).sort((a,b)=>time(a.start)-time(b.start));}
export function recordSeries(data:RecordDataset,ids:string[],from:string,to:string,settings:Settings,measure:Measure,emptyPeriods:'gaps'|'zeros'='zeros'):Series[]{
 const s=effective(settings),lo=time(from+'T00:00:00'),hi=time(to+'T00:00:00')+86400000;
 const keys:number[]=[];for(let t=bin(lo,s.resolution);t<hi;t=binEnd(t,s.resolution))keys.push(t);
 return data.groups.filter(g=>ids.includes(g.id)).map(g=>{
  const rows=data.records.filter(r=>r.group===g.id),grouped=new Map<number,number[]>();
  const key=(t:number)=>bin(t,s.resolution);
  for(const r of rows){const t=measure==='ends'?(r.end?time(r.end):NaN):time(r.start);if(t<lo||t>=hi||!Number.isFinite(t))continue;const k=key(t);const a=grouped.get(k)??[];a.push(measure==='duration'?duration(r,data.precision)??NaN:1);grouped.set(k,a);}
  const slots=keys;
  const activeDiff=new Map<number,number>();
  // Active counts are evaluated at bin starts, with half-open [start,end) intervals.
  if(measure==='active')for(const t of slots)activeDiff.set(t,rows.filter(r=>r.end&&time(r.start)<=t&&time(r.end)>t).length);
  let pts:Point[]=slots.map(x=>{const a=grouped.get(x)??[];const y=measure==='active'?activeDiff.get(x)??0:measure==='duration'?(a.length?a.reduce((u,v)=>u+v,0)/a.length:null):a.length;return {x,end:binEnd(x,s.resolution),y,raw:y,count:a.length,expected:a.length,empty:y===0};});
  pts=prepareCycle(transformValues(pts,s),s);
  // Display gaps only after numeric transformations, so counts/statistics never change.
  if(emptyPeriods==='gaps')pts=pts.map(p=>p.empty?{...p,y:null}:p);
  return {id:g.id,name:g.name,use:'',points:pts};
 });
}
export function recordUnit(data:RecordDataset,measure:Measure,s:Settings){return s.values==='index'?'Index (first valid bin = 100)':s.values==='zscore'?'Standard deviations':measure==='duration'?(data.precision==='year'?'Mean lifespan · years (approximate)':'Mean trip duration · minutes'):measure==='active'?'Alive at bin start · people':data.id==='news'?'Timeline updates per bin':data.id==='people'?(measure==='ends'?'Deaths per bin':'Births per bin'):'Trip starts per bin';}
