import {useEffect,useRef,useState,useId} from 'react';
import * as d3 from 'd3';
import {bindTimelineZoom,maximumTimeZoom,type TimelineView} from './timelineZoom';
import {colors} from './Chart';
import {duration,time,visibleRecords,type RecordDataset,type RecordItem} from './records';
export function RecordChart({data,ids,from,to,selected,onSelect,arrangement='multiples',opacity:markOpacity=1,size=1}:{data:RecordDataset;ids:string[];from:string;to:string;selected:string|null;onSelect:(id:string|null)=>void;opacity?:number;size?:number;arrangement?:'overlay'|'multiples'|'stacked'}){
 const zoomView=useRef<TimelineView|null>(null),clipId=useId().replace(/:/g,'');
 const host=useRef<HTMLDivElement>(null),ref=useRef<SVGSVGElement>(null);const [width,setWidth]=useState(800),[tip,setTip]=useState<{x:number;y:number;r:RecordItem}|null>(null);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>setWidth(Math.max(300,entry.contentRect.width)));observer.observe(host.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{
  setTip(null);const svg=d3.select(ref.current!);svg.on('.zoom',null);svg.selectAll('*').remove();const records=visibleRecords(data,ids,from,to),groups=data.groups.filter(g=>ids.includes(g.id)),lo=time(from+'T00:00:00'),hi=time(to+'T00:00:00')+86400000;
  let x=d3.scaleUtc().domain([lo,hi]).range([45,width-25]);const rows:{r:RecordItem;y:number}[]=[];const headings:{label:string;y:number;id:string}[]=[];let cursor=33;
  const buckets=arrangement==='overlay'?[{id:'all',name:'All selected groups'}]:groups;
  for(const g of buckets){headings.push({label:g.name,y:cursor,id:g.id});cursor+=20;const ends:number[]=[];
   for(const r of records.filter(r=>g.id==='all'||r.group===g.id)){
    const start=Math.max(lo,time(r.start)),end=r.end?Math.min(hi,time(r.end)):start;let lane=ends.findIndex(t=>t<=start);if(lane<0)lane=ends.length;ends[lane]=r.end?end:start;
    rows.push({r,y:cursor+lane*(data.kind==='intervals'?9:12)});
   }
   cursor+=Math.max(1,ends.length)*(data.kind==='intervals'?9:12)+30;
  }
  const height=Math.max(260,cursor+40);svg.attr('height',height).attr('viewBox',`0 0 ${width} ${height}`).on('click',()=>{onSelect(null);setTip(null);});
  const baseX=x.copy(),redraws:(()=>void)[]=[];
  svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('x',45).attr('width',width-70).attr('height',height-32);
  const clip=`url(#${clipId})`;
  const axisGroup=svg.append('g').attr('transform',`translate(0,${height-30})`);
  function drawAxis(){const span=Number(x.domain()[1])-Number(x.domain()[0]);const tickFormat=d3.utcFormat(data.precision==='year'?'%Y':span>370*86400000?'%Y':span<=86400000?'%d %b %H:%M':'%d %b');axisGroup.call(d3.axisBottom(x).ticks(Math.max(3,width/115)).tickFormat(tickFormat as any)).call(g=>g.selectAll('.tick line').attr('y2',-(height-45)).attr('stroke','#efede9')).call(g=>g.select('.domain').attr('stroke','#c8c1bb'));}
  drawAxis();redraws.push(drawAxis);
  for(const h of headings)svg.append('text').attr('x',45).attr('y',h.y).attr('font-weight',600).attr('fill',colors[data.groups.findIndex(g=>g.id===h.id)%colors.length]).text(h.label);
  for(const {r,y} of rows){const col=colors[data.groups.findIndex(g=>g.id===r.group)%colors.length],opacity=markOpacity*(selected&&selected!==r.group?0.16:1);
   const mark:d3.Selection<any,unknown,null,undefined>=r.end?svg.append('rect').attr('x',x(Math.max(lo,time(r.start)))).attr('y',y).attr('height',5*size).attr('width',Math.max(1,x(Math.min(hi,time(r.end)))-x(Math.max(lo,time(r.start))))).attr('rx',2):svg.append('circle').attr('cx',x(time(r.start))).attr('cy',y+3).attr('r',3.5*size);
   function show(e:MouseEvent|FocusEvent){const [px,py]=e instanceof MouseEvent?d3.pointer(e,ref.current):[width/2,y];setTip({x:Math.max(8,Math.min(width-290,px+12)),y:Math.max(5,Math.min(height-390,py-100)),r});}
   redraws.push(()=>{if(r.end)mark.attr('x',x(Math.max(lo,time(r.start)))).attr('width',Math.max(1,x(Math.min(hi,time(r.end)))-x(Math.max(lo,time(r.start)))));else mark.attr('cx',x(time(r.start)));});
   mark.attr('clip-path',clip).attr('fill',col).attr('opacity',opacity).attr('role','button').attr('tabindex',0).attr('aria-label',r.label).attr('aria-pressed',selected===r.group).style('cursor','pointer').on('mousemove',show).on('mouseleave',()=>setTip(null)).on('focus',show).on('blur',()=>setTip(null)).on('click',(e:MouseEvent)=>{e.stopPropagation();onSelect(selected===r.group?null:r.group);}).on('keydown',(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(selected===r.group?null:r.group);}});
  }
  if(!records.length)svg.append('text').attr('x',45).attr('y',70).text('No records in the selected groups and dates.');
  const key=data.id+':'+ids.join('|')+':'+from+':'+to+':'+width;
  return bindTimelineZoom(svg,baseX,{left:45,right:width-25,height},key,zoomView,scale=>{x=scale;redraws.forEach(draw=>draw());},()=>setTip(null),maximumTimeZoom(hi-lo,data.precision==='year'?'year':data.precision==='day'?'day':'second'));
 },[data,ids,from,to,selected,onSelect,width,arrangement,clipId,markOpacity,size]);
 const date=(s:string)=>data.precision==='year'?s.slice(0,4):data.precision==='day'?d3.utcFormat('%d %b %Y')(new Date(time(s))):d3.utcFormat('%d %b %Y · %H:%M:%S')(new Date(time(s)));
 return <div ref={host} className="chart-host"><svg ref={ref} role="group" aria-label={data.kind==='intervals'?'Interval timeline':'Dated news updates'}/>{tip&&<div className="tooltip record-tooltip" style={{left:tip.x,top:tip.y}}><strong>{tip.r.label}</strong><span>{date(tip.r.start)}{tip.r.end?' → '+date(tip.r.end):''}</span>{tip.r.end&&<b>{d3.format(',.1f')(duration(tip.r,data.precision)!)} {data.precision==='year'?'years (approx.)':'minutes'}</b>}<small>{tip.r.text&&tip.r.text.length>520?tip.r.text.slice(0,520)+'…':tip.r.text}</small></div>}</div>;
}
