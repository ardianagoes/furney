import {useEffect,useLayoutEffect,useState} from 'react';
import type {Texture} from 'three';
import {fitFloorPhoto,loadFloorPhoto} from '../../lib/floorPhoto';

export function RoomFloor({width,depth,photo,onPhotoLoad,onPhotoError}:{
  width:number;depth:number;photo:string|null;
  onPhotoLoad:(width:number,height:number)=>void;onPhotoError:()=>void;
}){
  const [loaded,setLoaded]=useState<{url:string;texture:Texture}|null>(null);
  const texture=loaded?.url===photo?loaded.texture:null;
  useEffect(()=>{
    setLoaded(null);
    if(!photo)return;
    return loadFloorPhoto(photo,(map,w,h)=>{
      setLoaded({url:photo,texture:map});onPhotoLoad(w,h);
    },onPhotoError);
  },[photo,onPhotoLoad,onPhotoError]);
  useLayoutEffect(()=>{if(texture)fitFloorPhoto(texture,width,depth);},[texture,width,depth]);
  // Material disposal belongs to R3F; uploaded texture disposal belongs to loader.
  return <mesh name="room-floor" rotation-x={-Math.PI/2} receiveShadow>
    <planeGeometry args={[width,depth]}/>
    <meshStandardMaterial key={texture?'photo':'plain'} map={texture} color={texture?'#ffffff':'#dce3cf'} roughness={0.95}/>
  </mesh>;
}
