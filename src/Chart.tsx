import {gapBridges} from './gaps';
import {useEffect,useRef,useState,useId} from 'react';
import * as d3 from 'd3';
import {bindTimelineZoom,maximumTimeZoom,type TimelineView} from './timelineZoom';
import {cycleAngle,cycleSlot,polarPosition,cyclePoints} from './polar';
import {effective,unit,type Settings,type Series,type Point} from './pipeline';
export const colors=['#D94722','#547E91','#8D739B','#9C873E','#4D8D79','#B46B82','#6571AB','#AB7653','#7B8D4C','#8C7A70','#4E939E','#9A6E3D','#726193','#B47747'];
type Tip={x:number;y:number;name:string;when:string;value:string;coverage:string};
const fmt=d3.utcFormat('%d %b %Y · %H:%M');
const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function Chart({series,settings,selected,onSelect,colorIds,unitText,valueUnit,timePrecision='hour',pointNote}:{series:Series[];settings:Settings;selected:string|null;onSelect:(id:string|null)=>void;colorIds:string[];unitText?:string;valueUnit?:string;timePrecision?:'hour'|'day'|'year';pointNote?:(series:Series,point:Point)=>string}){
 const zoomView=useRef<TimelineView|null>(null),clipId=useId().replace(/:/g,'');
 const ref=useRef<SVGSVGElement>(null),host=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(900),[tip,setTip]=useState<Tip|null>(null);const s=effective(settings);
 useEffect(()=>{if(!host.current)return;const o=new ResizeObserver(([e])=>setWidth(Math.max(300,e.contentRect.width)));o.observe(host.current);return()=>o.disconnect();},[]);
 useEffect(()=>{
  setTip(null);const svg=d3.select(ref.current!);svg.on('.zoom',null).style('cursor',null).style('touch-action',null);svg.selectAll('*').remove();
  const color=(id:string)=>colors[colorIds.indexOf(id)%colors.length];
  const size=s.size??1;const opacity=(id:string)=>(s.opacity??1)*(selected&&selected!==id?0.18:1);
  const dot=(px:number,py:number,r:number)=>{r*=size;return `M${px-r},${py}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0`;};
  if(s.gapStyle==='zeros')series=series.map(b=>({...b,points:b.points.map(p=>p.y===null?{...p,y:0}:p)}));
  const all=series.flatMap(b=>b.points);const values=all.flatMap(p=>p.y===null?[]:[p.y]);
  const multiples=s.arrangement==='multiples';const calendar=s.layout==='calendar';
  const years=Array.from(new Set(all.map(p=>new Date(p.x).getUTCFullYear()))).sort();
  const panels=calendar?series.flatMap(b=>years.map(y=>({b,year:y}))):[];
  const polarColumns=Math.max(1,Math.min(3,Math.floor(width/320)));
  const height=s.layout==='cycle'?(multiples?Math.max(340,Math.ceil(series.length/polarColumns)*340):520):calendar?Math.max(260,panels.length*158+45):multiples?Math.max(430,series.length*176+45):520;
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height).on('click',()=>{onSelect(null);setTip(null);});
  function show(event:MouseEvent|FocusEvent,b:Series,p:Point){
   const [px,py]=event instanceof MouseEvent?d3.pointer(event,ref.current):[width/2,55];
   const when=calendar?d3.utcFormat('%d %b %Y')(new Date(p.x)):s.layout==='cycle'&&s.cycleSummary!=='none'?(s.period==='hour'?`${String(p.x).padStart(2,'0')}:00 across selected dates`:s.period==='weekday'?days[p.x]+' across selected dates':months[p.x]+' across selected dates'):d3.utcFormat(timePrecision==='year'?'%Y':timePrecision==='day'?'%d %b %Y':'%d %b %Y · %H:%M')(new Date(p.x))+' → '+d3.utcFormat(timePrecision==='year'?'%Y':timePrecision==='day'?'%d %b %Y':'%d %b %Y · %H:%M')(new Date(p.end));
   setTip({x:Math.max(8,Math.min(width-258,px+15)),y:Math.max(5,py-104),name:b.name+(b.use?' · '+b.use:''),when,value:p.y===null?'Missing':d3.format(',.2f')(p.y)+' '+(valueUnit??(s.values==='absolute'?'kWh':s.values==='index'?'index':'SD')),coverage:pointNote?pointNote(b,p):`${p.count} / ${p.expected} hourly readings${s.smooth?' · smoothed':''}`});
  }
  function interactions(node:d3.Selection<any,any,any,any>,b:Series,pick:(e:MouseEvent)=>Point){node.attr('tabindex',0).attr('role','button').attr('aria-label',`${b.name}: highlight series`).attr('aria-pressed',selected===b.id).style('cursor','pointer').on('click',(e:MouseEvent)=>{e.stopPropagation();onSelect(selected===b.id?null:b.id);}).on('keydown',(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(selected===b.id?null:b.id);}}).on('mousemove',(e:MouseEvent)=>show(e,b,pick(e))).on('mouseleave',()=>setTip(null)).on('focus',(e:FocusEvent)=>{const p=b.points.find(p=>p.y!==null);if(p)show(e,b,p);}).on('blur',()=>setTip(null));}
  if(!series.length||!all.length){svg.append('text').attr('x',28).attr('y',60).attr('fill','#807c79').text(series.length?'No readings in this date range.':'Select a building above to begin.');return;}
  if(!values.length){svg.append('text').attr('x',28).attr('y',60).text(s.values==='index'?'Indexing needs a non-zero first bin. Adjust the dates or choose Absolute values.':all.some(p=>p.empty)?'No entries here. Choose Missing data → Zeros to display empty bins.':'No values for this selection.');return;}
  if(calendar){
   const diverging=s.values==='zscore';const extent=d3.extent(values) as [number,number];const lo=extent[0]??0,hi=extent[1]??1;
   const scale=diverging?d3.scaleDiverging(d3.interpolateRdBu).domain([Math.max(Math.abs(lo),Math.abs(hi)),0,-Math.max(Math.abs(lo),Math.abs(hi))]):d3.scaleSequential(d3.interpolateOrRd).domain([Math.min(0,lo),hi||1]);
   const legend=svg.append('g').attr('transform',`translate(${Math.max(5,width-270)},10)`);
   for(let i=0;i<100;i++)legend.append('rect').attr('x',i*2).attr('width',2.1).attr('height',8).attr('fill',scale(lo+(hi-lo)*i/99));
   legend.append('text').attr('y',26).text(d3.format('.3~g')(lo));legend.append('text').attr('x',200).attr('y',26).attr('text-anchor','end').text(d3.format('.3~g')(hi));
   panels.forEach(({b,year},i)=>{
    const top=45+i*158,cell=Math.min(17,(width-77)/54),x0=48,y0=top+28;const jan=new Date(Date.UTC(year,0,1));const origin=+d3.utcMonday.floor(jan);const pts=b.points.filter(p=>new Date(p.x).getUTCFullYear()===year);
    const g=svg.append('g').attr('opacity',opacity(b.id));g.append('text').attr('x',14).attr('y',top+10).attr('font-weight',600).attr('fill',color(b.id)).text(b.name+' · '+year);
    for(let j=0;j<12;j++){const x=x0+Math.floor((Date.UTC(year,j,1)-origin)/604800000)*cell;g.append('text').attr('x',x).attr('y',y0-5).attr('font-size',10).text(months[j]);}
    [0,2,4,6].forEach(j=>g.append('text').attr('x',12).attr('y',y0+j*cell+cell*.8).attr('font-size',10).text(days[j]));
    for(const p of pts){if(p.empty&&p.y===null)continue;const day=(new Date(p.x).getUTCDay()+6)%7;const x=x0+Math.floor((p.x-origin)/604800000)*cell,y=y0+day*cell;const r=g.append('rect').attr('x',x).attr('y',y).attr('width',cell-2).attr('height',cell-2).attr('rx',2).attr('fill',p.y===null?'#eeeae6':scale(p.y)).attr('stroke',p.y===null?'#b8b0a8':'none');interactions(r,b,()=>p);r.on('focus',(e:FocusEvent)=>show(e,b,p));r.append('title').text(`${b.name} ${d3.utcFormat('%d %b %Y')(new Date(p.x))}: ${p.y??'missing'}`);}
   });return;
  }
  if(s.layout==='cycle'){
   const count=s.period==='hour'?24:s.period==='weekday'?7:12;
   const columns=multiples?Math.max(1,Math.min(3,Math.floor(width/320))):1;
   const cellWidth=width/columns,cellHeight=multiples?340:520;
   const radius=Math.max(65,Math.min(cellWidth/2-53,cellHeight/2-62));
   const sharedDomain:[number,number]=[Math.min(0,d3.min(values)??0),d3.max(values)||1];
   const panels= multiples?series.map(b=>[b]):[series];
   panels.forEach((buildings,index)=>{
    const cx=cellWidth*(index%columns+.5),cy=Math.floor(index/columns)*cellHeight+cellHeight/2;
    const panelValues=buildings.flatMap(b=>b.points.flatMap(p=>p.y===null?[]:[p.y]));
    const domain:[number,number]=multiples&&s.scale==='independent'?[Math.min(0,d3.min(panelValues)??0),d3.max(panelValues)||1]:sharedDomain;
    const radial=d3.scaleLinear().domain(domain).nice().range([0,radius]);
    const grid=svg.append('g').attr('transform',`translate(${cx},${cy})`);
    for(const tick of radial.ticks(4).filter(v=>radial(v)>1)){
     grid.append('circle').attr('r',radial(tick)).attr('fill','none').attr('stroke',tick===0?'#b5ada5':'#e9e5df').attr('stroke-dasharray',tick===0?'4 4':null);
     grid.append('text').attr('x',5).attr('y',-radial(tick)+12).attr('font-size',10).text(d3.format(s.values==='absolute'?'~s':'.3~g')(tick));
    }
    for(let slot=0;slot<count;slot++){
     const a=cycleAngle(slot,count),[dx,dy]=polarPosition(a,radius),[lx,ly]=polarPosition(a,radius+22);
     grid.append('line').attr('x2',dx).attr('y2',dy).attr('stroke','#efede9');
     if(count!==24||slot%(cellWidth<400?3:2)===0)grid.append('text').attr('x',lx).attr('y',ly+4).attr('text-anchor',Math.abs(lx)<2?'middle':lx>0?'start':'end').text(s.period==='hour'?`${slot}:00`:s.period==='weekday'?days[slot]:months[slot]);
    }
    if(multiples)svg.append('text').attr('x',cx).attr('y',Math.floor(index/columns)*cellHeight+18).attr('text-anchor','middle').attr('font-weight',600).attr('fill',color(buildings[0].id)).text(buildings[0].name+(buildings[0].use?' · '+buildings[0].use:''));
    for(const b of buildings){
     const g=svg.append('g').attr('transform',`translate(${cx},${cy})`).attr('opacity',opacity(b.id));
     const chronological=s.cycleSummary==='none';
     const position=(p:{x:number;phase?:number})=>p.phase??p.x;
     const full=chronological?b.points:cyclePoints(b.points,count);
     const nearestPolar=(event:MouseEvent)=>{
      const [px,py]=d3.pointer(event,ref.current);
      if(chronological){let nearest=b.points.find(p=>p.y!==null)??b.points[0],distance=Infinity;for(const p of b.points){if(p.y===null)continue;const [dx,dy]=polarPosition(cycleAngle(position(p),count),radial(p.y));const delta=(px-cx-dx)**2+(py-cy-dy)**2;if(delta<distance){nearest=p;distance=delta;}}return nearest;}
      const slot=cycleSlot(px-cx,py-cy,count),valid=b.points.filter(p=>p.y!==null);return valid.find(p=>p.x===slot)??(valid.length?valid:b.points).reduce((a,p)=>Math.min(Math.abs(p.x-slot),count-Math.abs(p.x-slot))<Math.min(Math.abs(a.x-slot),count-Math.abs(a.x-slot))?p:a);
     };
     let geometry='';
     if(s.marks==='points'){
      geometry=b.points.filter(p=>p.y!==null).map(p=>{const [px,py]=polarPosition(cycleAngle(position(p),count),radial(p.y!));return dot(px,py,3);}).join('');
      const dots=g.append('path').attr('d',geometry).attr('fill',color(b.id));interactions(dots,b,nearestPolar);
     }else{
      if(s.marks==='steps'){
       let previous:{x:number;y:number|null;phase?:number}|null=null;
       for(const p of full){if(p.y===null){previous=null;continue;}const [px,py]=polarPosition(cycleAngle(position(p),count),radial(p.y));
        if(previous?.y!==null&&previous){const r=radial(previous.y!);const [ax,ay]=polarPosition(cycleAngle(position(p),count),r);geometry+=r>0?`A${r},${r} 0 0,1 ${ax},${ay}L${px},${py}`:`L${px},${py}`;}else geometry+=`M${px},${py}`;previous=p;
       }
      }else geometry=d3.lineRadial<{x:number;y:number|null;phase?:number}>().defined(p=>p.y!==null).angle(p=>cycleAngle(position(p),count)).radius(p=>radial(p.y!))(full)??'';
      g.append('path').attr('d',geometry).attr('fill','none').attr('stroke',color(b.id)).attr('stroke-width',(selected===b.id?2.8:1.8)*size);
      if(s.gapStyle==='dotted'){const bridge=d3.lineRadial<{x:number;y:number|null;phase?:number}>().angle(p=>cycleAngle(position(p),count)).radius(p=>radial(p.y!));g.append('path').attr('class','gap-bridge').attr('d',gapBridges(full).map(pair=>bridge(pair)??'').join('')).attr('fill','none').attr('stroke',color(b.id)).attr('stroke-width',1.7*size).attr('stroke-dasharray','2 4').attr('pointer-events','none').append('title').text('Interpolated connection across a gap; no observations in between.');}
      if(chronological&&s.marks==='lines'){const vertices=b.points.filter(p=>p.y!==null).map(p=>{const [px,py]=polarPosition(cycleAngle(position(p),count),radial(p.y!));return dot(px,py,1.8);}).join('');g.append('path').attr('d',vertices).attr('fill',color(b.id)).attr('pointer-events','none');}
      const hit=g.append('path').attr('d',geometry).attr('fill','none').attr('stroke','transparent').attr('stroke-width',16).attr('pointer-events','stroke');interactions(hit,b,nearestPolar);
     if(b.points.filter(p=>p.y!==null).length===1){const p=b.points.find(p=>p.y!==null)!;const [px,py]=polarPosition(cycleAngle(position(p),count),radial(p.y!));const dot=g.append('circle').attr('cx',px).attr('cy',py).attr('r',4*size).attr('fill',color(b.id));interactions(dot,b,()=>p);}
     }
    }
   });return;
  }
  const margin={left:64,right:24,top:24,bottom:43};const xMin=d3.min(all,p=>p.x)!,xMax=d3.max(all,p=>p.x)!;
  const redraws:(()=>void)[]=[];
  let x=s.layout==='timeline'?d3.scaleUtc().domain([new Date(xMin),new Date(xMax===xMin?xMin+3600000:xMax)]).range([margin.left,width-margin.right]):d3.scaleLinear().domain([0,s.period==='hour'?23:s.period==='weekday'?6:11]).range([margin.left,width-margin.right]);
  const baseX=x.copy() as d3.ScaleTime<number,number>;
  svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('x',margin.left).attr('y',0).attr('width',width-margin.left-margin.right).attr('height',height);
  const clip=`url(#${clipId})`;
  const xpos=(p:Point)=>Number(x(p.x));
  const globalMax=d3.max(values)??1,globalMin=Math.min(0,d3.min(values)??0);
  function axis(top:number,h:number,y:d3.ScaleLinear<number,number>,showX:boolean){
   const countAxis=s.values==='absolute'&&(valueUnit==='entries'||valueUnit==='people')&&!s.smooth&&!(s.layout==='cycle'&&s.cycleSummary==='mean');const yAxis=d3.axisLeft(y).ticks(h<200?3:6).tickSize(-(width-margin.left-margin.right)).tickFormat(s.arrangement==='stacked'&&s.baseline==='centered'?()=> '':countAxis?d3.format('d'):d3.format('~s'));if(countAxis)yAxis.tickValues(y.ticks(h<200?3:6).filter(Number.isInteger));
   const g=svg.append('g');g.append('g').attr('transform',`translate(${margin.left},0)`).call(yAxis).call(g=>g.select('.domain').remove()).call(g=>g.selectAll('.tick line').attr('stroke','#eeeae5')).call(g=>g.selectAll('.tick text').attr('dx',-7));
   if(showX){
    const axisGroup=g.append('g').attr('transform',`translate(0,${top+h})`);
    function drawXAxis(){const span=Number(x.domain()[1])-Number(x.domain()[0]);const ax=d3.axisBottom(x as any).ticks(Math.max(3,width/120)).tickFormat(d3.utcFormat(timePrecision==='year'?'%Y':span<2*86400000&&timePrecision==='hour'?'%d %b %H:%M':span>370*86400000?'%b %Y':'%d %b') as any);axisGroup.call(ax).call(g=>g.select('.domain').attr('stroke','#c8c1bb')).call(g=>g.selectAll('.tick line').remove()).call(g=>g.selectAll('.tick text').attr('dy',14));}
    drawXAxis();redraws.push(drawXAxis);
   }
  }
  if(s.arrangement==='stacked'){
   const rows=series[0].points.map((p,i)=>{const row:Record<string,number>={x:p.x};for(const b of series)row[b.id]=b.points[i]?.y??0;return row;});
   const valid=series[0].points.map((_,i)=>series.every(b=>b.points[i]?.y!==null&&b.points[i]?.y!==undefined));
   const layers=d3.stack<Record<string,number>>().keys(series.map(b=>b.id)).offset(s.baseline==='centered'?d3.stackOffsetSilhouette:d3.stackOffsetNone)(rows);
   const ymin=d3.min(layers,l=>d3.min(l,p=>p[0]))??0,ymax=d3.max(layers,l=>d3.max(l,p=>p[1]))??1;
   const y=d3.scaleLinear().domain([ymin,ymax||1]).nice().range([height-margin.bottom,margin.top]);axis(margin.top,height-margin.top-margin.bottom,y,true);
   for(const layer of layers){const b=series.find(b=>b.id===layer.key)!;const area=d3.area<d3.SeriesPoint<Record<string,number>>>().defined((_,i)=>valid[i]).x(p=>Number(x(p.data.x))).y0(p=>y(p[0])).y1(p=>y(p[1]));const p=svg.append('path').datum(layer).attr('d',area).attr('fill',color(b.id)).attr('fill-opacity',opacity(b.id)*.83).attr('stroke','white').attr('stroke-width',.6);p.attr('clip-path',clip);redraws.push(()=>p.attr('d',area));interactions(p,b,e=>nearest(e,b));}
  }else{
   series.forEach((b,i)=>{
    const h=multiples?140:height-margin.top-margin.bottom;const top=multiples?32+i*176:margin.top;
    const vv=b.points.flatMap(p=>p.y===null?[]:[p.y]);const local=s.scale==='independent'&&multiples;
    const y=d3.scaleLinear().domain([local?Math.min(0,d3.min(vv)??0):globalMin,(local?d3.max(vv):globalMax)||1]).nice().range([top+h,top]);
    if(multiples||i===0)axis(top,h,y,true);
    if(multiples)svg.append('text').attr('x',margin.left).attr('y',top-10).attr('font-weight',600).attr('fill',color(b.id)).text(b.name+(b.use?' · '+b.use:''));
    const g=svg.append('g').attr('opacity',opacity(b.id)).attr('clip-path',clip);
    if(s.marks!=='points'){
     const draw=d3.line<Point>().defined(p=>p.y!==null).x(xpos).y(p=>y(p.y!)).curve(s.marks==='steps'?d3.curveStepAfter:d3.curveLinear);
     const visible=g.append('path').datum(b.points).attr('d',draw).attr('fill','none').attr('stroke',color(b.id)).attr('stroke-width',(selected===b.id?2.8:1.7)*size);redraws.push(()=>visible.attr('d',draw));
     if(s.gapStyle==='dotted'){const bridge=d3.line<Point>().x(xpos).y(p=>y(p.y!));const path=g.append('path').attr('class','gap-bridge').attr('fill','none').attr('stroke',color(b.id)).attr('stroke-width',1.7*size).attr('stroke-dasharray','2 4').attr('pointer-events','none');const redraw=()=>path.attr('d',gapBridges(b.points).map(pair=>bridge(pair)??'').join(''));redraw();redraws.push(redraw);path.append('title').text('Interpolated connection across a gap; no observations in between.');}
     if(b.points.filter(p=>p.y!==null).length===1){const p=b.points.find(p=>p.y!==null)!;const dot=g.append('circle').attr('cx',xpos(p)).attr('cy',y(p.y!)).attr('r',4*size).attr('fill',color(b.id));interactions(dot,b,()=>p);redraws.push(()=>dot.attr('cx',xpos(p)));}
     const hit=g.append('path').datum(b.points).attr('d',draw).attr('fill','none').attr('stroke','transparent').attr('stroke-width',16).attr('pointer-events','stroke');interactions(hit,b,e=>nearest(e,b));redraws.push(()=>hit.attr('d',draw));
    }else{
     const dotPath=()=>b.points.filter(p=>p.y!==null).map(p=>{const px=xpos(p),py=y(p.y!);return dot(px,py,2.5);}).join('');
     const dots=g.append('path').attr('d',dotPath()).attr('fill',color(b.id));redraws.push(()=>dots.attr('d',dotPath()));interactions(dots,b,e=>nearest(e,b));
    }
   });
  }
  const key=series.map(b=>b.id).join('|')+':'+xMin+':'+xMax+':'+width;
  return bindTimelineZoom(svg,baseX,{left:margin.left,right:width-margin.right,height},key,zoomView,scale=>{x=scale;redraws.forEach(draw=>draw());},()=>setTip(null),maximumTimeZoom(xMax-xMin,timePrecision));
  function nearest(e:MouseEvent,b:Series){const [px]=d3.pointer(e,ref.current);const target=Number(x.invert(px));const valid=b.points.filter(p=>p.y!==null),points=valid.length?valid:b.points;const i=d3.bisector<Point,number>(p=>p.x).center(points,target);return points[i];}
 },[series,settings,selected,width,onSelect,colorIds,unitText,valueUnit,timePrecision,pointNote,clipId]);
 return <div className="chart-host" ref={host}><svg ref={ref} role="group" aria-label={`${settings.layout} of ${unitText?'selected records':'electricity consumption'}; ${unitText??unit(s)}`}/>{tip&&<div className="tooltip" style={{left:tip.x,top:tip.y}}><strong>{tip.name}</strong><span>{tip.when}</span><b>{tip.value}</b><small>{tip.coverage}</small></div>}</div>;
}
