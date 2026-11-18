/** Clockwise angle from twelve o'clock; every category has one equal sector. */
export function cycleAngle(slot:number,count:number){return slot/count*Math.PI*2;}
export function polarPosition(angle:number,radius:number):[number,number]{return [Math.sin(angle)*radius,-Math.cos(angle)*radius];}
export function cycleSlot(x:number,y:number,count:number){const a=(Math.atan2(x,-y)+Math.PI*2)%(Math.PI*2);return Math.round(a/(Math.PI*2)*count)%count;}
/** Preserve gaps while connecting the last and first slots across the cycle seam. */
export function cyclePoints<T extends {x:number;y:number|null}>(points:T[],count:number):(T|{x:number;y:null})[]{
 const bySlot=new Map(points.map(p=>[p.x,p]));const full=Array.from({length:count},(_,x)=>bySlot.get(x)??{x,y:null});
 if(full[0].y!==null&&full[count-1].y!==null)full.push({...full[0],x:count});return full;
}
