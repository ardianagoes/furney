import {useEffect,useState,useSyncExternalStore} from 'react';
import type {RoomDimensions} from '../types';
import type {CameraRig,CameraStore} from '../lib/cameraControls';
function ExactValue({value,min,max,step,label,onChange}:{value:number;min:number;max:number;step:number;label:string;onChange:(v:number)=>void}){
  const [draft,setDraft]=useState(String(Number(value.toFixed(4))));
  useEffect(()=>setDraft(String(Number(value.toFixed(4)))),[value]);
  return <input className="camera-number" aria-label={label+' value'} type="number" min={min} max={max} step={step} value={draft}
    onChange={e=>{setDraft(e.target.value);const v=e.target.valueAsNumber;if(Number.isFinite(v)&&v>=min&&v<=max)onChange(v);}}
    onBlur={()=>{const n=draft.trim()===''?value:Number(draft);const v=Number.isFinite(n)?Math.max(min,Math.min(max,n)):value;setDraft(String(Number(v.toFixed(4))));onChange(v);}}
    onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){setDraft(String(Number(value.toFixed(4))));}}}/>;
}
export function CameraControls({store,room,photo}:{store:CameraStore;room:RoomDimensions;photo:boolean}){
  const rig=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
  const fields=[
    {key:'height',label:'Camera height',min:0.25,max:Math.max(10,room.heightM*4,room.widthM*3,room.depthM*3,rig.height),step:0.01,unit:'m'},
    {key:'distance',label:'Distance',min:0,max:Math.max(20,room.widthM*4,room.depthM*4),step:0.01,unit:'m'},
    {key:'pitch',label:'Tilt down',min:-10,max:90,step:0.1,unit:'°'},
    {key:'yaw',label:'Turn',min:-180,max:180,step:0.1,unit:'°'},
    {key:'fov',label:'Lens width',min:30,max:100,step:0.1,unit:'°'},
  ] as const;
  const update=(key:keyof CameraRig,value:number)=>store.set({...store.getSnapshot(),[key]:value});
  return <details className="camera-controls"><summary>Camera controls {photo?'· match your photo':'· adjust your view'}</summary>
    <div className="camera-sliders">{fields.map(field=><div className="camera-field" key={field.key}>
      <div className="camera-field-heading"><label htmlFor={'camera-'+field.key}>{field.label}</label><ExactValue label={field.label} value={rig[field.key]} min={field.min} max={field.max} step={field.step} onChange={v=>update(field.key,v)}/><span>{field.unit}</span></div>
      <input id={'camera-'+field.key} type="range" min={field.min} max={field.max} step={field.step} value={rig[field.key]} onChange={e=>update(field.key,e.target.valueAsNumber)}/>
    </div>)}</div>
  </details>;
}
