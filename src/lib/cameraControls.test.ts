import {describe,it,expect,vi} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {createCameraStore,defaultRig,topDownRig} from './cameraControls';
import {applyCameraPose} from './cameraPose';
const room={widthM:6,depthM:4,heightM:3};
describe('camera poses and direct input store',()=>{
  it('publishes the latest input immediately, skips unchanged values and unsubscribes',()=>{
    const store=createCameraStore(defaultRig(room)), listener=vi.fn();
    const stop=store.subscribe(listener);
    for(let i=0;i<100;i++)store.set({...store.getSnapshot(),yaw:i});
    expect(store.getSnapshot().yaw).toBe(99);
    const calls=listener.mock.calls.length;
    store.set({...store.getSnapshot()});expect(listener).toHaveBeenCalledTimes(calls);
    stop();store.set({...store.getSnapshot(),yaw:10});expect(listener).toHaveBeenCalledTimes(calls);
  });
  it.each([0.4,1,2.5])('fits room floor and furniture-height corners in top view at aspect %s',aspect=>{
    const pose=topDownRig(room,aspect),cam=new PerspectiveCamera(50,aspect,0.03,150);
    applyCameraPose(cam,pose,aspect*600,600,{x:0,y:0});
    expect(cam.position.x).toBe(0);expect(cam.position.z).toBe(0);
    expect(cam.getWorldDirection(new Vector3()).y).toBeCloseTo(-1);
    for(const x of [-3,3])for(const z of [-2,2])for(const y of [0,3]){
      const projected=new Vector3(x,y,z).project(cam);
      expect(Math.abs(projected.x)).toBeLessThan(1);
      expect(Math.abs(projected.y)).toBeLessThan(1);
    }
  });
  it('resets to the original angled pose and avoids projection work for movement-only changes',()=>{
    const cam=new PerspectiveCamera(),rig=defaultRig(room);
    applyCameraPose(cam,rig,800,400,{x:0,y:0});
    const update=vi.spyOn(cam,'updateProjectionMatrix');
    applyCameraPose(cam,{...rig,height:5,yaw:60},800,400,{x:0,y:0});
    expect(update).not.toHaveBeenCalled();
    applyCameraPose(cam,{...rig,fov:70},800,400,{x:0,y:0});expect(update).toHaveBeenCalledOnce();
    applyCameraPose(cam,topDownRig(room,2),800,400,{x:0.2,y:0.1});
    applyCameraPose(cam,rig,800,400,{x:0,y:0});
    expect(cam.view?.enabled).toBe(false);expect(cam.position.z).toBeGreaterThan(0);expect(cam.fov).toBe(50);
  });
});
