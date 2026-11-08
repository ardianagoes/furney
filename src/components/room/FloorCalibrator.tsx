import {useMemo,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import {calibrationError,createFloorCalibration,DEFAULT_FLOOR_CORNERS,floorGridCoordinates,transformPoint,type FloorCorners} from '../../lib/floorCalibration';
const names=['Rear-left','Rear-right','Front-right','Front-left'];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function FloorCalibrator({photo,corners,width,depth,onApply,onCancel}:{
  photo:string;corners:FloorCorners|null;width:number;depth:number;onApply:(corners:FloorCorners)=>void;onCancel:()=>void;
}){
  const [draft,setDraft]=useState<FloorCorners>(()=>(corners??DEFAULT_FLOOR_CORNERS).map(p=>({...p})) as FloorCorners);
  const box=useRef<HTMLDivElement>(null),drag=useRef<{index:number;pointerId:number}|null>(null);
  const calibration=useMemo(()=>createFloorCalibration(draft),[draft]);
  const error=calibrationError(draft)??(!calibration?'These points cannot form a stable perspective transform.':null);
  const move=(index:number,x:number,y:number)=>setDraft(previous=>previous.map((p,i)=>i===index?{x:clamp(x),y:clamp(y)}:p) as FloorCorners);
  function pointerMove(e:PointerEvent<HTMLButtonElement>){
    if(drag.current?.pointerId!==e.pointerId)return;
    const rect=box.current?.getBoundingClientRect();if(!rect?.width||!rect.height)return;
    move(drag.current.index,(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);
  }
  function stop(e:PointerEvent<HTMLButtonElement>){
    if(drag.current?.pointerId!==e.pointerId)return;
    drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function key(e:KeyboardEvent<HTMLButtonElement>,index:number){
    const direction:{[key:string]:[number,number]}={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!direction[e.key])return;e.preventDefault();
    const [x,y]=direction[e.key],step=e.shiftKey?0.02:0.002;
    move(index,draft[index].x+x*step,draft[index].y+y*step);
  }
  const lines=calibration?[
    ...floorGridCoordinates(width).map(x=>[{x,y:0},{x,y:1}]),
    ...floorGridCoordinates(depth).map(y=>[{x:0,y},{x:1,y}]),
  ].map(points=>points.map(p=>transformPoint(calibration.toImage,p)!)): [];
  return <section className="floor-calibrator" aria-label="Align floor corners">
    <h4>Align Floor</h4>
    <p>Drag the four numbered handles around the visible floor, in order. This inset is a calibration editor, not the viewer background. Use measured room dimensions for scale. Arrow keys move a focused handle; Shift moves farther.</p>
    <div className="floor-calibration-image" ref={box}>
      <img src={photo} alt="Floor calibration reference" draggable={false}/>
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={draft.map(p=>p.x+','+p.y).join(' ')} fill="#647f5026" stroke={error?'#b14e3e':'#fff'} strokeWidth="0.004"/>
        {lines.map(([a,b],i)=><line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#eaffd5" strokeWidth="0.002"/>)}
      </svg>
      {draft.map((p,i)=><button key={i} type="button" className="floor-corner" style={{left:p.x*100+'%',top:p.y*100+'%'}} aria-label={names[i]+' floor corner'} title={names[i]+' · drag or use arrow keys'}
        onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();drag.current={index:i,pointerId:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={pointerMove} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={()=>{drag.current=null;}} onKeyDown={e=>key(e,i)}>{i+1}</button>)}
    </div>
    <p>1 rear-left · 2 rear-right · 3 front-right · 4 front-left. Match corresponding room edges, including rotated overhead photos.</p>
    <p>Match the four corners of the measured room floor. Hidden or off-photo corners make alignment approximate; keep the cropped fallback if you cannot place them reliably.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="scene-tools"><button type="button" disabled={!!error} onClick={()=>onApply(draft)}>Apply floor alignment</button><button type="button" onClick={onCancel}>Cancel alignment</button></div>
    <p>Only the selected floor quadrilateral is rectified. Walls and furniture heights are not reconstructed.</p>
  </section>;
}
