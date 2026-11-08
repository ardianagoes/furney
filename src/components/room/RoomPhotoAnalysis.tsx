// UI and cancellation flow adapted from Angelo @ 64866ec; Furney controls/state.
import { useEffect,useRef,useState } from 'react';
import { analyzeRoom } from '../../lib/room-photo.client';
import type { RoomAnalysis,OccupiedArea } from '../../lib/room-photo-types';
import type { RoomDimensions } from '../../types';
export function RoomPhotoAnalysis({photo,analysis,areas,room,onAnalysis,onAlign,onClear,onAreasChange}:{
  photo:string;analysis:RoomAnalysis|null;areas:readonly OccupiedArea[];room:RoomDimensions;
  onAnalysis:(a:RoomAnalysis)=>Promise<void>;onAlign:()=>void;onClear:()=>void;onAreasChange:(a:OccupiedArea[])=>void;
}){
  const active=useRef<AbortController|null>(null);
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setError('');setPending(false);return()=>{active.current?.abort();active.current=null;};},[photo]);
  const cancel=()=>{active.current?.abort();active.current=null;setPending(false);};
  async function run(){
    cancel();const controller=new AbortController();active.current=controller;setPending(true);setError('');
    try{const result=await analyzeRoom(photo,controller.signal);if(controller.signal.aborted||active.current!==controller)return;
      if(result.ok)await onAnalysis(result.analysis);else setError(result.message);
    }catch{if(!controller.signal.aborted)setError('Room analysis could not complete. Your photo and manual alignment still work.');}
    finally{if(active.current===controller){active.current=null;setPending(false);}}
  }
  return <div className="room-analysis-panel" aria-label="Room photo analysis">
    <div className="scene-tools"><button type="button" onClick={()=>void run()} disabled={pending}>{pending?'Analyzing room…':'Analyze Room'}</button>{pending&&<button type="button" onClick={cancel}>Cancel analysis</button>}</div>
    <p>Your photo is sent to OpenAI only when you analyze it. Estimates need review; enter measured room dimensions above. A photograph cannot provide exact dimensions or a full reconstruction.</p>
    {error&&<p role="alert">{error}</p>}
    {analysis&&<>
      <p role="status">{analysis.furniture.length} existing furniture detections · {areas.length} estimated occupied areas</p>
      <p>{analysis.notes}</p>
      <ul>{analysis.furniture.map((o,i)=><li key={i}>{o.label} · {Math.round(o.confidence*100)}% confidence{!areas.some(a=>a.id===String(i))?' · no active area (uncertain, unresolved, or removed)':''}</li>)}</ul>
      <div className="scene-tools"><button type="button" onClick={onAlign}>Review floor alignment</button><button type="button" onClick={()=>{cancel();onClear();}}>Clear detections</button></div>
      {areas.map(a=><fieldset key={a.id}><legend>{a.label} · approximate floor area</legend>
        <div className="room-area-fields">{(['x','z','w','d'] as const).map(key=><label key={key}>{({x:'X',z:'Z',w:'Width',d:'Depth'})[key]} (m)<input type="number" step="0.05" min={key==='w'||key==='d'?0.1:0} max={key==='x'||key==='w'?room.widthM:room.depthM} aria-label={a.label+' area '+key+' in meters'} value={Number((a[key]+(key==='x'?room.widthM/2:key==='z'?room.depthM/2:0)).toFixed(3))} onChange={e=>{
          const v=e.target.valueAsNumber;if(!Number.isFinite(v)||v<0||((key==='w'||key==='d')&&v<0.1))return;
          onAreasChange(areas.map(o=>o.id===a.id?{...o,[key]:v-(key==='x'?room.widthM/2:key==='z'?room.depthM/2:0)}:o));
        }}/></label>)}</div>
        <button type="button" onClick={()=>onAreasChange(areas.filter(o=>o.id!==a.id))} aria-label={'Remove detection '+a.label}>Ignore this area</button>
      </fieldset>)}
    </>}
  </div>;
}
