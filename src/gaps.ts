/** Only bridge interior gaps; never extrapolate or invent observed points. */
export function gapBridges<T extends {y:number|null}>(points:T[]):[T,T][]{
 const bridges:[T,T][]=[];let previous:T|undefined,gap=false;
 for(const point of points){if(point.y===null){gap=true;continue;}if(previous&&gap)bridges.push([previous,point]);previous=point;gap=false;}return bridges;
}
