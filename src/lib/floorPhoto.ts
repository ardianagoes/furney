import {Texture,SRGBColorSpace,ClampToEdgeWrapping} from 'three';
import {floorPhotoCrop} from './floorPhotoMapping';
export {floorPhotoCrop} from './floorPhotoMapping';

/** Centered cover crop in texture UVs: preserve pixels' aspect ratio, fill floor. */
export function fitFloorPhoto(texture:Texture,width:number,depth:number){
  const image=texture.image as HTMLImageElement;
  const crop=floorPhotoCrop(image.naturalWidth,image.naturalHeight,width,depth);
  texture.repeat.set(crop.repeatX,crop.repeatY);texture.offset.set(crop.offsetX,crop.offsetY);
  texture.updateMatrix();
}

/** Own each texture once. Late decodes cannot recreate a disposed photo. */
export function loadFloorPhoto(url:string,onLoad:(texture:Texture,width:number,height:number)=>void,onError:()=>void){
  const image=new Image();
  let active=true,texture:Texture|null=null;
  image.onload=()=>{
    if(!active)return;
    if(!image.naturalWidth||!image.naturalHeight){onError();return;}
    texture=new Texture(image);
    texture.colorSpace=SRGBColorSpace;
    texture.wrapS=texture.wrapT=ClampToEdgeWrapping;
    texture.needsUpdate=true;
    onLoad(texture,image.naturalWidth,image.naturalHeight);
  };
  image.onerror=()=>{if(active)onError();};
  image.src=url;
  return ()=>{
    if(!active)return;
    active=false;image.onload=null;image.onerror=null;image.src='';
    texture?.dispose();texture=null;
  };
}
