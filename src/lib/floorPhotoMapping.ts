import type {OccupiedArea,RoomAnalysis} from './room-photo-types';
export function floorPhotoCrop(imageWidth:number,imageHeight:number,roomWidth:number,roomDepth:number){
  const imageAspect=imageWidth/imageHeight, floorAspect=roomWidth/roomDepth;
  const repeatX=Math.min(1,floorAspect/imageAspect),repeatY=Math.min(1,imageAspect/floorAspect);
  return {repeatX,repeatY,offsetX:(1-repeatX)/2,offsetY:(1-repeatY)/2};
}
/** Keep experimental detections registered to the same cropped floor reference.
 * These are illustrative floor areas, not reconstructed photo geometry.
 */
export function floorPhotoAreas(analysis:RoomAnalysis,imageWidth:number,imageHeight:number,width:number,depth:number){
  const crop=floorPhotoCrop(imageWidth,imageHeight,width,depth);
  const areas:OccupiedArea[]=[];
  analysis.furniture.forEach((o,i)=>{
    if(o.confidence<0.5||o.footprint.length<3)return;
    const xs=o.footprint.map(p=>((p.x-crop.offsetX)/crop.repeatX-0.5)*width);
    const zs=o.footprint.map(p=>((p.y-crop.offsetY)/crop.repeatY-0.5)*depth);
    const left=Math.max(-width/2,Math.min(...xs)),right=Math.min(width/2,Math.max(...xs));
    const back=Math.max(-depth/2,Math.min(...zs)),front=Math.min(depth/2,Math.max(...zs));
    if(right<=left||front<=back)return;
    areas.push({id:String(i),label:o.label,x:(left+right)/2,z:(back+front)/2,w:right-left,d:front-back});
  });
  return {areas,unresolved:analysis.furniture.length-areas.length};
}
