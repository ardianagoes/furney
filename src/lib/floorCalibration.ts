import type {ImagePoint,OccupiedArea,RoomAnalysis} from './room-photo-types';
export type FloorCorners = [ImagePoint,ImagePoint,ImagePoint,ImagePoint]; // rear-left, rear-right, front-right, front-left
export type Homography = [number,number,number,number,number,number,number,number,number];
export interface FloorCalibration { corners:FloorCorners; toImage:Homography; toFloor:Homography }
export const DEFAULT_FLOOR_CORNERS:FloorCorners=[{x:0.15,y:0.2},{x:0.85,y:0.2},{x:0.85,y:0.85},{x:0.15,y:0.85}];
const UNIT:FloorCorners=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
export function transformPoint(h:Homography,p:ImagePoint):ImagePoint|null{
  const w=h[6]*p.x+h[7]*p.y+h[8];
  if(!Number.isFinite(w)||Math.abs(w)<1e-9)return null;
  const x=(h[0]*p.x+h[1]*p.y+h[2])/w,y=(h[3]*p.x+h[4]*p.y+h[5])/w;
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
}
function solve(from:FloorCorners,to:FloorCorners):Homography|null{
  const rows=from.flatMap((p,i)=>{
    const q=to[i];return [[p.x,p.y,1,0,0,0,-q.x*p.x,-q.x*p.y,q.x],[0,0,0,p.x,p.y,1,-q.y*p.x,-q.y*p.y,q.y]];
  });
  for(let col=0;col<8;col++){
    let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
    if(Math.abs(rows[pivot][col])<1e-10)return null;
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const divisor=rows[col][col];for(let k=col;k<=8;k++)rows[col][k]/=divisor;
    for(let row=0;row<8;row++)if(row!==col){const factor=rows[row][col];for(let k=col;k<=8;k++)rows[row][k]-=factor*rows[col][k];}
  }
  return [...rows.map(row=>row[8]),1] as Homography;
}
export function calibrationError(points:FloorCorners):string|null{
  if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))return 'Keep every corner inside the photograph.';
  // Convex clockwise order in image coordinates (Y down), no bow-ties/reflections.
  for(let i=0;i<4;i++){
    const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];
    if((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)<0.0001)return 'Keep corners in order around a convex floor; handles must not cross or collapse.';
  }
  const area=points.reduce((n,p,i)=>n+p.x*points[(i+1)%4].y-p.y*points[(i+1)%4].x,0)/2;
  if(area<0.005)return 'Select a larger visible floor area; these corners are too close together.';
  return null;
}
export function createFloorCalibration(corners:FloorCorners):FloorCalibration|null{
  if(calibrationError(corners))return null;
  const toImage=solve(UNIT,corners),toFloor=solve(corners,UNIT);
  if(!toImage||!toFloor)return null;
  // A finite positive denominator across the floor prevents projective poles.
  if(UNIT.some(p=>toImage[6]*p.x+toImage[7]*p.y+toImage[8]<1e-7))return null;
  return {corners:corners.map(p=>({...p})) as FloorCorners,toImage,toFloor};
}
export function suggestedFloorCorners(analysis:RoomAnalysis):FloorCorners|null{
  const f=analysis.floor;
  if(!f||f.confidence<0.75)return null;
  const corners:FloorCorners=[f.backLeft,f.backRight,f.frontRight,f.frontLeft];
  return createFloorCalibration(corners)?corners:null;
}
export const floorToMeters=(p:ImagePoint,width:number,depth:number)=>({x:(p.x-0.5)*width,z:(p.y-0.5)*depth});
export const metersToFloor=(p:{x:number;z:number},width:number,depth:number)=>({x:p.x/width+0.5,y:p.z/depth+0.5});
/** Same centered half-meter grid as RoomScene's Drei Grid, including room edges. */
export function floorGridCoordinates(length:number):number[]{
  const positions=[0,1];
  for(let m=Math.ceil(-length);m<=Math.floor(length);m++){
    const t=(m*0.5)/length+0.5;
    if(t>1e-9&&t<1-1e-9)positions.push(t);
  }
  return positions.sort((a,b)=>a-b);
}
function clipToFloor(points:ImagePoint[],corners:FloorCorners){
  let out=points;
  for(let edge=0;edge<4;edge++){
    const start=corners[edge],end=corners[(edge+1)%4];
    const side=(p:ImagePoint)=>(end.x-start.x)*(p.y-start.y)-(end.y-start.y)*(p.x-start.x);
    const input=out;out=[];
    for(let i=0;i<input.length;i++){
      const a=input[i],b=input[(i+1)%input.length];
      const sa=side(a),sb=side(b);
      if(sa>=0)out.push(a);
      if((sa>=0)!==(sb>=0)){
        const t=sa/(sa-sb);
        out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});
      }
    }
  }
  return out;
}
export function calibratedFloorAreas(analysis:RoomAnalysis,calibration:FloorCalibration,width:number,depth:number){
  const areas:OccupiedArea[]=[];
  analysis.furniture.forEach((o,i)=>{
    if(o.confidence<0.5||o.footprint.length<3)return;
    // Clip in photo space first: a footprint beyond the projective horizon must
    // never wrap through infinity into a false occupied area inside the room.
    const projected=clipToFloor(o.footprint,calibration.corners).map(p=>transformPoint(calibration.toFloor,p));
    if(projected.some(p=>p===null))return;
    const clipped=(projected as ImagePoint[]).map(p=>floorToMeters({x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))},width,depth));
    if(clipped.length<3)return;
    const xs=clipped.map(p=>p.x),zs=clipped.map(p=>p.z);
    const left=Math.min(...xs),right=Math.max(...xs),back=Math.min(...zs),front=Math.max(...zs);
    if(right-left<1e-6||front-back<1e-6)return;
    areas.push({id:String(i),label:o.label,x:(left+right)/2,z:(back+front)/2,w:right-left,d:front-back});
  });
  return {areas,unresolved:analysis.furniture.length-areas.length};
}
