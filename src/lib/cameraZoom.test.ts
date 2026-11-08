// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {defaultRig,topDownRig,createCameraStore} from './cameraControls';
import {wheelZoom,bindWheelZoom,zoomBounds} from './cameraZoom';
const room={widthM:4,depthM:5,heightM:3};
describe('canvas wheel zoom',()=>{
  it('zooms in/up and out/down proportionally without changing yaw, pitch or lens',()=>{
    const pose=defaultRig(room),closer=wheelZoom(pose,-100,0,400,room),farther=wheelZoom(pose,100,0,400,room);
    expect(closer.distance).toBeLessThan(pose.distance);expect(farther.distance).toBeGreaterThan(pose.distance);
    expect(closer.height/closer.distance).toBeCloseTo(pose.height/pose.distance);
    expect(closer).toMatchObject({yaw:pose.yaw,pitch:pose.pitch,fov:pose.fov});
    const doubled=wheelZoom({...pose,distance:pose.distance*2,height:pose.height*2},-100,0,400,room);
    expect(doubled.distance/closer.distance).toBeCloseTo(2);
  });
  it('normalizes pixel, line and page deltas and retains fine trackpad motion',()=>{
    const pose=defaultRig(room);
    expect(wheelZoom(pose,48,0,400,room)).toEqual(wheelZoom(pose,3,1,400,room));
    expect(wheelZoom(pose,400,0,400,room)).toEqual(wheelZoom(pose,1,2,400,room));
    const small=wheelZoom(pose,-0.25,0,400,room);
    expect(small.distance).toBeLessThan(pose.distance);expect(small.distance).toBeGreaterThan(pose.distance*0.999);
    expect(wheelZoom(pose,NaN,0,400,room)).toBe(pose);
    expect(wheelZoom(pose,0,0,400,room)).toBe(pose);
  });
  it.each([false,true])('enforces zoom limits without losing overhead orientation: %s',overhead=>{
    let pose=overhead?topDownRig(room,1):defaultRig(room);
    for(let i=0;i<100;i++)pose=wheelZoom(pose,-1000,0,400,room);
    expect(overhead?pose.height:pose.distance).toBe(zoomBounds(room).min);
    for(let i=0;i<100;i++)pose=wheelZoom(pose,1000,0,400,room);
    expect(overhead?pose.height:pose.distance).toBe(zoomBounds(room).max);
    if(overhead)expect(pose).toMatchObject({distance:0,pitch:90,yaw:0});
  });
  it('cancels scrolling only on the canvas, including at limits, and removes its listener',()=>{
    const canvas=document.createElement('canvas'),outside=document.createElement('div');
    document.body.append(canvas,outside);
    const store=createCameraStore(defaultRig(room)),remove=bindWheelZoom(canvas,store,room);
    try {
      const outsideEvent=new WheelEvent('wheel',{deltaY:10,bubbles:true,cancelable:true});
      outside.dispatchEvent(outsideEvent);expect(outsideEvent.defaultPrevented).toBe(false);
      const before=store.getSnapshot();
      const event=new WheelEvent('wheel',{deltaY:-10,bubbles:true,cancelable:true});
      canvas.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);expect(store.getSnapshot()).not.toBe(before);
      store.set({...before,distance:zoomBounds(room).min});
      const limited=new WheelEvent('wheel',{deltaY:-100,cancelable:true});canvas.dispatchEvent(limited);expect(limited.defaultPrevented).toBe(true);
      remove();
      const after=store.getSnapshot(),released=new WheelEvent('wheel',{deltaY:10,cancelable:true});
      canvas.dispatchEvent(released);expect(released.defaultPrevented).toBe(false);expect(store.getSnapshot()).toBe(after);
    }finally{remove();canvas.remove();outside.remove();}
  });
});
