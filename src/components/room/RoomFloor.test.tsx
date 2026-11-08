// @vitest-environment jsdom
import {act,createElement,useLayoutEffect,useMemo} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {createRoot,extend} from '@react-three/fiber';
import {Group,Mesh,PlaneGeometry,MeshStandardMaterial,Box3,Vector3} from 'three';
import {RoomFloor} from './RoomFloor';
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
  function Probe({photo}:{photo:string|null}){
    const parent=useMemo(()=>new Group(),[]);
    useLayoutEffect(()=>{group=parent;},[parent]);
    return createElement('primitive',{object:parent},createElement(RoomFloor,{width:4,depth:6,photo,onPhotoLoad:onLoad,onPhotoError:onError}));
  }
  try{
    await act(async()=>{root.render(createElement(Probe,{photo:'blob:first'}));});
    await act(async()=>{images[0].onload!();});
    const mesh=group!.getObjectByName('room-floor') as Mesh<PlaneGeometry,MeshStandardMaterial>;
    expect(mesh.receiveShadow).toBe(true);expect(mesh.material.map).toBeTruthy();
    expect(onLoad).toHaveBeenCalledWith(1600,900);
    const size=new Box3().setFromObject(group!).getSize(new Vector3());
    expect(size.x).toBeCloseTo(4);expect(size.z).toBeCloseTo(6);expect(size.y).toBeCloseTo(0);
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
