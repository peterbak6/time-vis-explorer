import * as d3 from 'd3';
export type TimelineView={key:string;transform:d3.ZoomTransform};
export function maximumTimeZoom(span:number,precision:'second'|'hour'|'day'|'year'='hour'){
 const minimum=precision==='year'?2*365.25*86400000:precision==='day'?2*86400000:precision==='second'?60000:3600000;
 return Math.max(1,Math.min(1024,span/minimum));
}
/** Changes the horizontal viewport only. Source points, bins and y scales stay intact. */
export function bindTimelineZoom(svg:d3.Selection<SVGSVGElement,unknown,null,undefined>,base:d3.ScaleTime<number,number>,bounds:{left:number;right:number;height:number},key:string,view:{current:TimelineView|null},redraw:(scale:d3.ScaleTime<number,number>)=>void,clearTooltip:()=>void,maxScale=1024){
 const {left,right,height}=bounds;
 const behavior=d3.zoom<SVGSVGElement,unknown>().scaleExtent([1,maxScale]).extent([[left,0],[right,height]]).translateExtent([[left,0],[right,height]]).clickDistance(4).on('start',clearTooltip).on('zoom',event=>{
  view.current={key,transform:event.transform};redraw(event.transform.rescaleX(base));
 });
 const saved=view.current?.key===key?view.current.transform:d3.zoomIdentity;
 svg.style('touch-action','pan-y').style('cursor','grab').call(behavior).on('dblclick.zoom',event=>{event.preventDefault();svg.call(behavior.transform,d3.zoomIdentity);});
 svg.call(behavior.transform,saved);
 return ()=>{svg.on('.zoom',null).style('cursor',null).style('touch-action',null);};
}
