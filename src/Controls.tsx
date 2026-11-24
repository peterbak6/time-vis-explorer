import {useEffect,useLayoutEffect,useRef,useId,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {Settings} from './pipeline';
export function Mini({kind}:{kind:string}){return <svg viewBox="0 0 76 40" aria-hidden="true">{kind==='Calendar'?Array.from({length:21},(_,i)=><rect key={i} x={7+i%7*9} y={3+Math.floor(i/7)*11} width="7" height="8" fill={i%5===0?'currentColor':'#ddd8d2'}/>):kind==='Cycle'?<><circle cx="38" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M38 4L50 16L44 31L25 22Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>:kind==='Multiples'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${10+i*12}l15 -3l12 2l14 -5l18 3`} fill="none" stroke="currentColor" strokeWidth="1.5"/>)}</>:kind==='Stacked'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${14+i*9}l15 -5l12 2l14 -5l18 3`} fill="none" stroke="currentColor" strokeWidth="5" opacity={1-i*.2}/>)}</>:kind==='Overlay'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${30-i*4}l15 -8l12 ${i*3}l14 -13l18 ${i*4}`} fill="none" stroke="currentColor" strokeWidth="1.6" opacity={1-i*.25}/>)}</>:<path d="M6 32L20 15L34 23L48 5L68 13" fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>}
const courseIcons:Record<string,string>={Absolute:'absolute','Index 100':'index','Z-score':'zscore',Shared:'shared',Independent:'independent',Points:'points',Lines:'lines',Steps:'steps',Gaps:'gaps',Zeros:'zeros','Dotted connection':'dotted',Off:'off','Moving average':'smoothed',Hour:'hour',Day:'day',Week:'week',Month:'month',Year:'year',Decade:'decade',Century:'century',Mean:'mean',Total:'total',Min:'min',Max:'max',None:'none',Fixed:'fixed',Centered:'centered'};
const explanations:Record<string,string>={
 Timeline:'Place observations in chronological order along a time axis.',
 Calendar:'Arrange daily values in a calendar and encode their magnitude with color.',
 Cycle:'Arrange observations by recurring hour, weekday, or month to reveal repeating patterns.',
 Overlay:'Draw the selected series together in one coordinate system for direct comparison.',
 Multiples:'Give each series its own aligned chart to compare patterns with less overlap.',
 Stacked:'Stack series as bands whose thickness shows each value and whose combined height shows the total.',
 Hour:'Group readings or events into one-hour bins.',Day:'Group readings or events into daily bins.',Week:'Group readings or events into weeks beginning on Monday.',Month:'Group readings or events into calendar months.',Year:'Group records into calendar years.',Decade:'Group records into ten-year periods.',Century:'Group records into hundred-year periods.',
 Mean:'Use the average of the readings within each dated bin.',Total:'Add the readings within each dated bin, leaving incomplete electricity totals missing.',Min:'Use the smallest reading within each dated bin.',Max:'Use the largest reading within each dated bin.',
 None:'Keep every dated value separate instead of combining matching positions across cycles.',
 Absolute:'Show values in their original units without normalization.',
 'Index 100':'Express each series relative to its first valid bin, which becomes 100.',
 'Z-score':'Express each value as the number of standard deviations above or below its series mean.',
 Shared:'Use the same value scale for every series so magnitudes can be compared.',Independent:'Fit a separate value scale to each chart to emphasize its pattern.',
 Points:'Show a separate symbol for each observed bin value.',Lines:'Connect successive bin values with straight segments.',Steps:'Hold each bin value constant until the next bin begins.',
 Gaps:'Leave absent values blank and break the line at those positions.',Zeros:'Display absent values at zero without changing the underlying summary calculations.',
 'Dotted connection':'Bridge interior gaps with dotted segments without adding observed values.',
 Off:'Show bin values without smoothing.', 'Moving average':'Average neighboring chronological bins to reduce short-term fluctuations.',
 Fixed:'Anchor stacked bands at zero so the combined total can be read directly.',Centered:'Center stacked bands around a shifting baseline so band thickness shows each value.',
 'Updates (points)':'Show each curated news update as a point at its recorded date.', 'Update count':'Count the recorded news updates in each temporal bin.',
 'Lifespans (intervals)':'Show each lifespan as an interval between its reported birth and death years.', 'Birth count':'Count births in each temporal bin.', 'Death count':'Count deaths in each temporal bin.', 'Alive at bin start':'Count people whose lifespan includes the start of each bin.',
 'Mean lifespan':'Average the approximate lifespans of people born within each bin.',
 'Trips (intervals)':'Show each trip as an interval from departure to arrival.', 'Trip starts':'Count trip departures in each temporal bin.', 'Mean trip duration':'Average the durations of trips starting within each bin.'
};
function explanation(label:string,group:string){
 if(group==='Cycle summary'&&['Mean','Total','Min','Max'].includes(label))return ({Mean:'Average',Total:'Add',Min:'Take the minimum of',Max:'Take the maximum of'}[label])+ ' the dated bin values at each matching hour, weekday, or month across cycles.';
 return explanations[label]??`Choose ${label.toLowerCase()} for this view.`;
}
export function Choice({label,active,disabled=false,hint='',onClick,children}:{label:string;active:boolean;disabled?:boolean;hint?:string;onClick:()=>void;children?:ReactNode}){
 const anchor=useRef<HTMLSpanElement>(null),bubble=useRef<HTMLDivElement>(null),id=useId();
 const [tip,setTip]=useState<{text:string;left:number;top:number}|null>(null);
 function show(){const el=anchor.current;if(!el)return;const r=el.getBoundingClientRect();const group=el.closest('fieldset')?.querySelector('legend')?.textContent??'';const description=explanation(label,group);setTip({text:description+(disabled&&hint&&hint!==description?' '+hint:''),left:Math.max(8,Math.min(r.left,window.innerWidth-328)),top:r.bottom+8});}
 useLayoutEffect(()=>{if(!tip||!bubble.current||!anchor.current)return;const r=anchor.current.getBoundingClientRect(),b=bubble.current.getBoundingClientRect();const left=Math.max(8,Math.min(r.left,window.innerWidth-b.width-8));const top=r.bottom+8+b.height<=window.innerHeight-8?r.bottom+8:Math.max(8,r.top-b.height-8);if(left!==tip.left||top!==tip.top)setTip({...tip,left,top});},[tip]);
 useEffect(()=>{if(!tip)return;const hide=()=>setTip(null);window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);return()=>{window.removeEventListener('scroll',hide,true);window.removeEventListener('resize',hide);};},[!!tip]);
 return <span ref={anchor} className="choice" data-disabled={disabled||undefined} tabIndex={disabled?0:undefined} aria-label={disabled?label:undefined} aria-describedby={disabled&&tip?id:undefined} onMouseEnter={show} onMouseLeave={()=>setTip(null)} onFocus={show} onBlur={()=>setTip(null)} onKeyDown={e=>{if(e.key==='Escape')setTip(null);}}><button type="button" disabled={disabled} aria-describedby={!disabled&&tip?id:undefined} aria-pressed={active} className={active?'active':''} onClick={onClick}>{children??(courseIcons[label]&&<img className="control-schematic" src={import.meta.env.BASE_URL+`schematics/${courseIcons[label]}.svg`} alt="" aria-hidden="true"/>)}<span>{label}</span></button>{tip&&createPortal(<div ref={bubble} id={id} role="tooltip" className="control-tooltip" style={{left:tip.left,top:tip.top}}>{tip.text}</div>,document.body)}</span>;
}

export function Appearance({settings,onChange}:{settings:Settings;onChange:(key:'opacity'|'size',value:number)=>void}){
 return <fieldset><legend>Appearance</legend><label className="slider-control">Opacity <output>{Math.round((settings.opacity??1)*100)}%</output><input aria-label="Opacity" title="Adjust the transparency of the plotted marks." type="range" min="0.1" max="1" step="0.05" value={settings.opacity??1} onChange={e=>onChange('opacity',+e.target.value)}/></label><label className="slider-control">Size <output>{settings.size??1}×</output><input aria-label="Size" title="Adjust the size of points and the thickness of lines." type="range" min="0.5" max="2" step="0.1" value={settings.size??1} onChange={e=>onChange('size',+e.target.value)}/></label></fieldset>;
}
export function RangeInput({year=false,value,min,max,label,onCommit}:{year?:boolean;value:string;min:string;max:string;label:string;onCommit:(value:string)=>void}){
 const shown=year?value.slice(0,4):value,lower=year?min.slice(0,4):min,upper=year?max.slice(0,4):max;
 const [draft,setDraft]=useState(shown);useEffect(()=>setDraft(shown),[shown]);
 function commit(v:string,finish=false){
  const valid=year?/^\d{4}$/.test(v):/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  if(!valid){if(finish)setDraft(shown);return;}
  if(v<lower||v>upper){if(finish){const clamped=v<lower?lower:upper;setDraft(clamped);onCommit(clamped);}return;}
  onCommit(v);
 }
 return <input aria-label={label} type={year?'number':'date'} min={lower} max={upper} value={draft} onInput={e=>{setDraft(e.currentTarget.value);if(!year)commit(e.currentTarget.value);}} onChange={e=>{setDraft(e.target.value);if(!year)commit(e.target.value);}} onBlur={()=>commit(draft,true)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>;
}
