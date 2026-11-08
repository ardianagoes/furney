import type {RoomDimensions} from '../types';
import type {CameraRig,CameraStore} from './cameraControls';

export const isTopDown = (rig:CameraRig) => rig.pitch===90 && rig.distance===0;
export const zoomBounds = (room:RoomDimensions) => ({min:0.5,max:Math.max(20,room.widthM*8,room.depthM*8,room.heightM*8)});
/** Exponential dolly keeps fine trackpad deltas and scales with current distance.
 * At the exact overhead preset, zoom height instead of introducing an XZ offset.
 */
export function wheelZoom(rig:CameraRig,delta:number,deltaMode:number,pageHeight:number,room:RoomDimensions):CameraRig {
  if(!Number.isFinite(delta)||delta===0)return rig;
  const pixels=delta*(deltaMode===1?16:deltaMode===2?Math.max(1,pageHeight):1);
  const factor=Math.exp(Math.max(-1,Math.min(1,pixels*0.0015)));
  const vertical=isTopDown(rig),current=vertical?rig.height:rig.distance;
  const bounds=zoomBounds(room);
  const next=Math.max(bounds.min,Math.min(Math.max(bounds.max,current),Math.max(bounds.min,current)*factor));
  if(next===current)return rig;
  if(vertical)return {...rig,height:next};
  return {...rig,distance:next,height:Math.max(0.25,rig.height*next/Math.max(bounds.min,current))};
}
/** Non-passive listener is scoped to the WebGL canvas and removed on unmount. */
export function bindWheelZoom(canvas:HTMLCanvasElement,store:CameraStore,room:RoomDimensions) {
  const listener=(event:WheelEvent)=>{
    if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;
    event.preventDefault();
    store.set(wheelZoom(store.getSnapshot(),event.deltaY,event.deltaMode,canvas.clientHeight||800,room));
  };
  canvas.addEventListener('wheel',listener,{passive:false});
  return ()=>canvas.removeEventListener('wheel',listener);
}
