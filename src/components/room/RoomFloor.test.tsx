// @vitest-environment jsdom
import {act,createElement,useLayoutEffect,useMemo} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {createRoot,extend} from '@react-three/fiber';
import {Group,Mesh,PlaneGeometry,MeshStandardMaterial,Box3,Vector3} from 'three';
import {RoomFloor} from './RoomFloor';
import {createFloorCalibration,transformPoint,type FloorCalibration} from '../../lib/floorCalibration';
extend({Group,Mesh,PlaneGeometry,MeshStandardMaterial});
afterEach(()=>{vi.unstubAllGlobals();});
it('bounds the photo material to the measured shadow-receiving floor and restores the plain floor',async()=>{
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  const images:{onload:(()=>void)|null;onerror:(()=>void)|null;src:string;naturalWidth:number;naturalHeight:number}[]=[];
  vi.stubGlobal('Image',class{onload=null;onerror=null;src='';naturalWidth=1600;naturalHeight=900;constructor(){images.push(this);}});
  const canvas=document.createElement('canvas'),root=createRoot(canvas);
  const renderer={render:()=>{},setSize:()=>{},setPixelRatio:()=>{},dispose:()=>{},forceContextLoss:()=>{},renderLists:{dispose:()=>{}},xr:{enabled:false,isPresenting:false,addEventListener:()=>{},removeEventListener:()=>{}},shadowMap:{},domElement:canvas};
  await root.configure({gl:renderer as never,frameloop:'never',size:{width:600,height:400,top:0,left:0}});
  let group:Group|undefined;
  const onLoad=vi.fn(),onError=vi.fn();
  function Probe({photo,calibration=null}:{photo:string|null;calibration?:FloorCalibration|null}){
    const parent=useMemo(()=>new Group(),[]);
    useLayoutEffect(()=>{group=parent;},[parent]);
    return createElement('primitive',{object:parent},createElement(RoomFloor,{width:4,depth:6,photo,onPhotoLoad:onLoad,onPhotoError:onError,calibration}));
  }
  try{
    await act(async()=>{root.render(createElement(Probe,{photo:'blob:first'}));});
    await act(async()=>{images[0].onload!();});
    const mesh=group!.getObjectByName('room-floor') as Mesh<PlaneGeometry,MeshStandardMaterial>;
    expect(mesh.receiveShadow).toBe(true);expect(mesh.material.map).toBeTruthy();
    expect(onLoad).toHaveBeenCalledWith(1600,900);
    const size=new Box3().setFromObject(group!).getSize(new Vector3());
    expect(size.x).toBeCloseTo(4);expect(size.z).toBeCloseTo(6);expect(size.y).toBeCloseTo(0);
    const calibration=createFloorCalibration([{x:0.3,y:0.2},{x:0.8,y:0.15},{x:0.95,y:0.9},{x:0.05,y:0.95}])!;
    const originalTexture=mesh.material.map;
    await act(async()=>{root.render(createElement(Probe,{photo:'blob:first',calibration}));});
    expect(images).toHaveLength(1);expect(mesh.material.map).toBe(originalTexture);
    expect(mesh.material.map!.repeat.toArray()).toEqual([1,1]);
    const shader={uniforms:{} as Record<string,{value:unknown}>,fragmentShader:'#include <map_fragment>'};
    mesh.material.onBeforeCompile(shader as never,renderer as never);
    expect(shader.fragmentShader).toContain('photoPoint.xy / photoPoint.z');
    expect(shader.fragmentShader).toContain('1.0-photoUv.y');
    const matrix=shader.uniforms.floorPhotoH.value as import('three').Matrix3;
    const point=new Vector3(0.4,0.6,1).applyMatrix3(matrix),expected=transformPoint(calibration.toImage,{x:0.4,y:0.6})!;
    expect(point.x/point.z).toBeCloseTo(expected.x);expect(point.y/point.z).toBeCloseTo(expected.y);
    const dispose=vi.spyOn(mesh.material.map!,'dispose');
    await act(async()=>{root.render(createElement(Probe,{photo:'blob:second'}));});
    expect(dispose).toHaveBeenCalledOnce();
    await act(async()=>{images[1].onload!();});
    const second=vi.spyOn(mesh.material.map!,'dispose');
    await act(async()=>{root.render(createElement(Probe,{photo:null}));});
    expect(second).toHaveBeenCalledOnce();
    expect(mesh.material.map).toBeNull();expect(mesh.material.color.getHexString()).toBe('dce3cf');
  }finally{await act(async()=>{root.unmount();});}
});
