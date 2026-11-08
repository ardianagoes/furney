import type { RoomDimensions } from '../types';
export interface CameraRig { height:number; distance:number; yaw:number; pitch:number; fov:number }
export function defaultRig(room:RoomDimensions):CameraRig {
  const distance=Math.max(room.widthM,room.depthM,room.heightM)*1.4;
  return {height:distance*Math.tan(34*Math.PI/180),distance,yaw:30,pitch:34,fov:50};
}
export function topDownRig(room:RoomDimensions,aspect:number):CameraRig {
  const height=room.heightM+1.15*Math.max(room.depthM,room.widthM/Math.max(0.01,aspect))/(2*Math.tan(25*Math.PI/180));
  return {height,distance:0,yaw:0,pitch:90,fov:50};
}
/** No scheduled React work in the scene. R3F samples the latest pose each frame. */
export function createCameraStore(initial:CameraRig) {
  let current=initial;
  let mode:'manual'|'top'|'angled'='angled';
  const listeners=new Set<()=>void>();
  return {
    getSnapshot:()=>current,
    getMode:()=>mode,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    set(next:CameraRig,nextMode:typeof mode='manual'){
      mode=nextMode;
      if(!Object.values(next).every(Number.isFinite))return;
      if((Object.keys(current) as (keyof CameraRig)[]).every(key=>current[key]===next[key]))return;
      current=next;listeners.forEach(listener=>listener());
    },
  };
}
export type CameraStore=ReturnType<typeof createCameraStore>;
