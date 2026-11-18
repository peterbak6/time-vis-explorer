export type Building={id:string;name:string;use:string;timezone:string;coverage:number;values:(number|null)[]};
export type Dataset={start:string;hours:number;site:string;timezone:string;buildings:Building[];source:string};
export type Settings={opacity?:number;size?:number;gapStyle?:'gaps'|'zeros'|'dotted';layout:'timeline'|'calendar'|'cycle';arrangement:'overlay'|'multiples'|'stacked';resolution:'hour'|'day'|'week'|'month'|'year'|'decade'|'century';summary:'mean'|'total'|'min'|'max';cycleSummary:'none'|'mean'|'total'|'min'|'max';values:'absolute'|'index'|'zscore';scale:'shared'|'independent';marks:'points'|'lines'|'steps';smooth:boolean;window:number;period:'hour'|'weekday'|'month';baseline:'fixed'|'centered'};
export type Point={x:number;end:number;y:number|null;count:number;expected:number;raw:number|null;phase?:number;empty?:boolean};
export type Series={id:string;name:string;use:string;points:Point[]};
export const initial:Settings={gapStyle:'gaps',layout:'timeline',arrangement:'overlay',resolution:'hour',summary:'mean',cycleSummary:'none',values:'absolute',scale:'shared',marks:'lines',smooth:false,window:7,period:'hour',baseline:'fixed'};
export function effective(s:Settings):Settings{
 const resolution=s.layout==='calendar'?'day':s.layout==='cycle'&&!['hour','day','month'].includes(s.resolution)?'day':s.resolution;
 return {...s,cycleSummary:s.cycleSummary??'none',resolution,period:resolution==='hour'?'hour':resolution==='month'?'month':'weekday',arrangement:s.layout==='calendar'?'multiples':s.arrangement==='stacked'&&(s.layout!=='timeline'||s.values!=='absolute')?'overlay':s.arrangement,scale:s.layout!=='calendar'&&s.arrangement==='multiples'?s.scale:'shared',smooth:s.layout==='calendar'?false:s.smooth};
}
export function bin(t:number,res:Settings['resolution']):number{const d=new Date(t);if(res==='hour'){d.setUTCMinutes(0,0,0);return +d;}d.setUTCHours(0,0,0,0);if(res==='week')d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));if(res==='month')d.setUTCDate(1);if(['year','decade','century'].includes(res)){d.setUTCMonth(0,1);const size=res==='century'?100:res==='decade'?10:1;d.setUTCFullYear(Math.floor(d.getUTCFullYear()/size)*size);}return +d;}
export function binEnd(t:number,res:Settings['resolution']){const d=new Date(t);if(res==='hour')return t+3600000;if(res==='day')d.setUTCDate(d.getUTCDate()+1);if(res==='week')d.setUTCDate(d.getUTCDate()+7);if(res==='month')d.setUTCMonth(d.getUTCMonth()+1);if(['year','decade','century'].includes(res))d.setUTCFullYear(d.getUTCFullYear()+(res==='century'?100:res==='decade'?10:1));return +d;}
export function summarize(a:number[],op:Settings['summary']){if(!a.length)return null;if(op==='total')return a.reduce((s,v)=>s+v,0);if(op==='min')return Math.min(...a);if(op==='max')return Math.max(...a);return a.reduce((s,v)=>s+v,0)/a.length;}
export function transform(data:Dataset,ids:string[],from:string,to:string,settings:Settings):Series[]{
 const s=effective(settings),start=Date.parse(data.start+'Z'),lo=Date.parse(from+'T00:00:00Z'),hi=Date.parse(to+'T00:00:00Z')+86400000;
 return data.buildings.filter(b=>ids.includes(b.id)).map(b=>{
  const groups=new Map<number,{v:number[],expected:number,end:number}>();
  for(let i=Math.max(0,Math.ceil((lo-start)/3600000));i<Math.min(data.hours,Math.ceil((hi-start)/3600000));i++){
   const t=start+i*3600000,k=bin(t,s.resolution);
   let g=groups.get(k);if(!g){g={v:[],expected:0,end:binEnd(k,s.resolution)};groups.set(k,g);}g.expected++;
   const v=b.values[i];if(v!==null&&Number.isFinite(v))g.v.push(v);
  }
  let points:Point[]=[...groups].sort((a,b)=>a[0]-b[0]).map(([x,g])=>{const y=s.summary==='total'&&g.v.length<g.expected?null:summarize(g.v,s.summary);return {x,end:g.end,y,raw:y,count:g.v.length,expected:g.expected};});
  points=prepareCycle(transformValues(points,s),s);
  return {id:b.id,name:b.name,use:b.use,points};
 });
}
export function unit(s:Settings){return s.values==='index'?'Index (first valid bin = 100)':s.values==='zscore'?'Standard deviations':s.summary==='total'?'kWh per bin':s.summary==='mean'?'Mean hourly energy · kWh':s.summary==='min'?'Minimum hourly energy · kWh':'Maximum hourly energy · kWh';}

export function transformValues(input:Point[],s:Settings):Point[]{let points=input;
  if(s.values==='index'){const ref=points.find(p=>p.y!==null)?.y;points=points.map(p=>({...p,y:p.y===null||ref===undefined||ref===null||ref===0?null:p.y/ref*100}));}
  if(s.values==='zscore'){const vs=points.flatMap(p=>p.y===null?[]:[p.y]);const mean=vs.reduce((a,b)=>a+b,0)/vs.length;const sd=Math.sqrt(vs.reduce((a,b)=>a+(b-mean)**2,0)/vs.length);points=points.map(p=>({...p,y:p.y===null?null:sd===0?0:(p.y-mean)/sd}));}
  if(s.smooth){const half=Math.floor(s.window/2);const original=points;points=original.map((p,i)=>({...p,y:p.y===null?null:summarize(original.slice(Math.max(0,i-half),i+half+1).flatMap(q=>q.y===null?[]:[q.y]),'mean')}));}
return points;
}

/** Unwrapped position keeps successive cycles in chronological order. */
export function cyclePosition(t:number,period:Settings['period']){
 const d=new Date(t);
 return period==='hour'?Math.floor(t/3600000):period==='weekday'?Math.floor(t/86400000)+3:d.getUTCFullYear()*12+d.getUTCMonth();
}
/** Fold only when explicitly requested; normalization/smoothing already ran chronologically. */
export function prepareCycle(points:Point[],settings:Settings):Point[]{
 const s=effective(settings);if(s.layout!=='cycle'||!points.length)return points;
 const count=s.period==='hour'?24:s.period==='weekday'?7:12;
 const origin=Math.floor(cyclePosition(points[0].x,s.period)/count)*count;
 const positioned=points.map(p=>({...p,phase:cyclePosition(p.x,s.period)-origin}));
 if(s.cycleSummary==='none')return positioned;
 const slots=Array.from({length:count},()=>[] as Point[]);
 for(const p of positioned)slots[((p.phase%count)+count)%count].push(p);
 return slots.map((ps,x)=>{const valid=ps.flatMap(p=>p.y===null?[]:[p.y]);const y=summarize(valid,s.cycleSummary as Settings['summary']);return {x,end:x+1,y,raw:y,count:ps.reduce((n,p)=>n+p.count,0),expected:ps.reduce((n,p)=>n+p.expected,0),empty:ps.length>0&&ps.every(p=>p.empty===true)};});
}
