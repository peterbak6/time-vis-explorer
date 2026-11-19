import {useEffect,useState,type ReactNode} from 'react';
import type {Settings} from './pipeline';
export function Mini({kind}:{kind:string}){return <svg viewBox="0 0 76 40" aria-hidden="true">{kind==='Calendar'?Array.from({length:21},(_,i)=><rect key={i} x={7+i%7*9} y={3+Math.floor(i/7)*11} width="7" height="8" fill={i%5===0?'currentColor':'#ddd8d2'}/>):kind==='Cycle'?<><circle cx="38" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M38 4L50 16L44 31L25 22Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></>:kind==='Multiples'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${10+i*12}l15 -3l12 2l14 -5l18 3`} fill="none" stroke="currentColor" strokeWidth="1.5"/>)}</>:kind==='Stacked'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${14+i*9}l15 -5l12 2l14 -5l18 3`} fill="none" stroke="currentColor" strokeWidth="5" opacity={1-i*.2}/>)}</>:kind==='Overlay'?<>{[0,1,2].map(i=><path key={i} d={`M8 ${30-i*4}l15 -8l12 ${i*3}l14 -13l18 ${i*4}`} fill="none" stroke="currentColor" strokeWidth="1.6" opacity={1-i*.25}/>)}</>:<path d="M6 32L20 15L34 23L48 5L68 13" fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>}
const courseIcons:Record<string,string>={Absolute:'absolute','Index 100':'index','Z-score':'zscore',Shared:'shared',Independent:'independent',Points:'points',Lines:'lines',Steps:'steps',Gaps:'gaps',Zeros:'zeros','Dotted connection':'dotted',Off:'off','Moving average':'smoothed',Hour:'hour',Day:'day',Week:'week',Month:'month',Year:'year',Decade:'decade',Century:'century',Mean:'mean',Total:'total',Min:'min',Max:'max',None:'none',Fixed:'fixed',Centered:'centered'};
export function Choice({label,active,disabled=false,hint='',onClick,children}:{label:string;active:boolean;disabled?:boolean;hint?:string;onClick:()=>void;children?:ReactNode}){
 return <span className="choice" data-hint={disabled?hint:undefined} tabIndex={disabled?0:undefined} aria-label={disabled?`${label}. ${hint}`:undefined}><button type="button" disabled={disabled} aria-pressed={active} className={active?'active':''} onClick={onClick} title={!disabled?hint||undefined:undefined}>{children??(courseIcons[label]&&<img className="control-schematic" src={import.meta.env.BASE_URL+`schematics/${courseIcons[label]}.svg`} alt="" aria-hidden="true"/>)}<span>{label}</span></button></span>;
}

export function Appearance({settings,onChange}:{settings:Settings;onChange:(key:'opacity'|'size',value:number)=>void}){
 return <fieldset><legend>Appearance</legend><label className="slider-control">Opacity <output>{Math.round((settings.opacity??1)*100)}%</output><input aria-label="Opacity" type="range" min="0.1" max="1" step="0.05" value={settings.opacity??1} onChange={e=>onChange('opacity',+e.target.value)}/></label><label className="slider-control">Size <output>{settings.size??1}×</output><input aria-label="Size" type="range" min="0.5" max="2" step="0.1" value={settings.size??1} onChange={e=>onChange('size',+e.target.value)}/></label></fieldset>;
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
