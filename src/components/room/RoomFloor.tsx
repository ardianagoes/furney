import {useCallback,useEffect,useLayoutEffect,useMemo,useState} from 'react';
import {Matrix3,type Texture,type MeshStandardMaterial} from 'three';
import {fitFloorPhoto,loadFloorPhoto} from '../../lib/floorPhoto';
import type {FloorCalibration} from '../../lib/floorCalibration';

export function RoomFloor({width,depth,photo,onPhotoLoad,onPhotoError,calibration=null}:{
  width:number;depth:number;photo:string|null;
  onPhotoLoad:(width:number,height:number)=>void;onPhotoError:()=>void;
  calibration?:FloorCalibration|null;
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
  const homography=useMemo(()=>({value:new Matrix3()}),[]);
  useLayoutEffect(()=>{
    if(!texture)return;
    if(calibration){
      homography.value.set(...calibration.toImage);
      texture.repeat.set(1,1);texture.offset.set(0,0);texture.updateMatrix();
    }else fitFloorPhoto(texture,width,depth);
  },[texture,width,depth,calibration,homography]);
  const compile=useCallback<MeshStandardMaterial['onBeforeCompile']>(shader=>{
    if(!calibration)return;
    shader.uniforms.floorPhotoH=homography;
    shader.fragmentShader='uniform mat3 floorPhotoH;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #ifdef USE_MAP
        vec3 photoPoint = floorPhotoH * vec3(vMapUv.x, 1.0-vMapUv.y, 1.0);
        vec2 photoUv = photoPoint.xy / photoPoint.z;
        diffuseColor *= texture2D(map, vec2(photoUv.x, 1.0-photoUv.y));
      #endif
    `);
  },[calibration,homography]);
  // Material disposal belongs to R3F; uploaded texture disposal belongs to loader.
  return <mesh name="room-floor" rotation-x={-Math.PI/2} receiveShadow>
    <planeGeometry args={[width,depth]}/>
    <meshStandardMaterial key={texture?(calibration?'calibrated':'photo'):'plain'} map={texture} color={texture?'#ffffff':'#dce3cf'} roughness={0.95} onBeforeCompile={compile} customProgramCacheKey={()=>calibration?'floor-photo-homography-v1':'floor-photo-standard'}/>
  </mesh>;
}
