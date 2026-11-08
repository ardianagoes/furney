import {describe,it,expect} from 'vitest';
import {calibrationError,createFloorCalibration,transformPoint,floorToMeters,metersToFloor,floorGridCoordinates,suggestedFloorCorners,calibratedFloorAreas,type FloorCorners} from './floorCalibration';
import {createInitialState,plannerReducer} from '../state/plannerState';
import {furnitureProducts} from '../data/furnitureProducts';
import {toFurneyPosition,toSceneItem} from './plannerAdapter';
import {occupiedBy} from './occupiedAreas';
import type {RoomAnalysis} from './room-photo-types';
const angled:FloorCorners=[{x:0.3,y:0.2},{x:0.8,y:0.15},{x:0.95,y:0.9},{x:0.05,y:0.95}];
const overhead:FloorCorners=[{x:0.1,y:0.1},{x:0.9,y:0.1},{x:0.9,y:0.9},{x:0.1,y:0.9}];
const rotated:FloorCorners=[{x:0.9,y:0.1},{x:0.9,y:0.9},{x:0.1,y:0.9},{x:0.1,y:0.1}];
const unit:FloorCorners=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
const analysis=(corners:FloorCorners|null,confidence=0.9):RoomAnalysis=>({view:'perspective',rearEdge:null,notes:'Estimate',floor:corners?{backLeft:corners[0],backRight:corners[1],frontRight:corners[2],frontLeft:corners[3],confidence}:null,furniture:[]});
describe('shared projective floor calibration',()=>{
  it.each([angled,overhead,rotated].map(corners=>({corners})))('maps corners and round-trips interior points for angled/overhead orientation %j',({corners})=>{
    const c=createFloorCalibration(corners)!;expect(c).not.toBeNull();
    unit.forEach((p,i)=>{
      const actual=transformPoint(c.toImage,p)!;
      expect(actual.x).toBeCloseTo(corners[i].x,10);expect(actual.y).toBeCloseTo(corners[i].y,10);
    });
    for(let x=0;x<=1;x+=0.1)for(let y=0;y<=1;y+=0.1){
      const actual=transformPoint(c.toFloor,transformPoint(c.toImage,{x,y})!)!;
      expect(actual.x).toBeCloseTo(x,9);expect(actual.y).toBeCloseTo(y,9);
    }
  });
  it('uses perspective division instead of bilinear corner interpolation',()=>{
    const c=createFloorCalibration(angled)!;
    const p=transformPoint(c.toImage,{x:0.5,y:0.5})!;
    expect(Math.abs(p.y-angled.reduce((sum,p)=>sum+p.y,0)/4)).toBeGreaterThan(0.01);
    expect(transformPoint([1,0,0,0,1,0,0,0,0],{x:1,y:1})).toBeNull();
  });
  it.each(([
    [angled[0],angled[2],angled[1],angled[3]], [angled[0],angled[0],angled[2],angled[3]],
    [{x:-0.1,y:0},...angled.slice(1)], [{x:NaN,y:0},...angled.slice(1)],
    [{x:0,y:0},{x:0.001,y:0},{x:0.001,y:0.001},{x:0,y:0.001}],
  ] as FloorCorners[]).map(corners=>({corners})))('rejects crossed, collapsed, outside and unstable corners %j',({corners})=>{
    expect(calibrationError(corners)).toBeTruthy();expect(createFloorCalibration(corners)).toBeNull();
  });
  it('uses only reliable four-corner AI suggestions, including overhead; never guesses missing corners',()=>{
    expect(suggestedFloorCorners(analysis(angled))).toEqual(angled);
    expect(suggestedFloorCorners(analysis(angled,0.6))).toBeNull();
    expect(suggestedFloorCorners({...analysis(null),view:'overhead'})).toBeNull();
  });
  it('keeps normalized calibration invariant under preview resizing and changes scale only from measured dimensions',()=>{
    const c=createFloorCalibration(angled)!,p=transformPoint(c.toFloor,{x:0.5,y:0.6})!;
    for(const [width,height] of [[600,400],[300,200],[1200,800]]){
      const pixel={x:0.5*width,y:0.6*height};
      expect(transformPoint(c.toFloor,{x:pixel.x/width,y:pixel.y/height})).toEqual(p);
    }
    const meters=floorToMeters(p,4,6);
    expect(metersToFloor(meters,4,6)).toEqual(p);
    expect(floorToMeters(p,8,12).x).toBeCloseTo(meters.x*2);
    expect(floorToMeters(p,8,12).z).toBeCloseTo(meters.z*2);
  });
  it('projects the same centered half-meter grid as the 3D floor, even for nonintegral room dimensions',()=>{
    const length=3.6576;
    const lines=floorGridCoordinates(length);
    expect(lines[0]).toBe(0);expect(lines.at(-1)).toBe(1);expect(lines).toContain(0.5);
    lines.slice(1,-1).forEach(t=>expect((t-0.5)*length/0.5).toBeCloseTo(Math.round((t-0.5)*length/0.5),10));
  });
  it('maps detected furniture and placements into the same meter frame and remaps on room resize',()=>{
    const c=createFloorCalibration(angled)!;
    const footprint=[{x:0.35,y:0.35},{x:0.65,y:0.35},{x:0.65,y:0.65},{x:0.35,y:0.65}].map(p=>transformPoint(c.toImage,p)!);
    const result={...analysis(angled),furniture:[{label:'Existing table',confidence:0.9,footprint}]};
    const projected=calibratedFloorAreas(result,c,4,6);
    expect(projected.areas[0].w).toBeCloseTo(1.2);expect(projected.areas[0].d).toBeCloseTo(1.8);
    let state={...createInitialState(furnitureProducts),room:{widthM:4,depthM:6,heightM:3}};
    state=plannerReducer(state,{type:'occupied/update',areas:projected.areas});
    const p=furnitureProducts.find(p=>p.id==='ikea-lack-30449908')!;
    state=plannerReducer(state,{type:'product/add',productId:p.id,instanceId:'placed'});
    expect(occupiedBy(toSceneItem(state.placedItems[0],p,state.room),projected.areas)).toBeUndefined();
    const center=transformPoint(c.toFloor,transformPoint(c.toImage,{x:0.5,y:0.5})!)!;
    const atCenter=floorToMeters(center,4,6);
    state=plannerReducer(state,{type:'item/update',item:{...state.placedItems[0],...toFurneyPosition(atCenter.x,atCenter.z,state.room)}});
    expect(occupiedBy(toSceneItem(state.placedItems[0],p,state.room),projected.areas)?.label).toBe('Existing table');
    expect(calibratedFloorAreas(result,c,8,12).areas[0].w).toBeCloseTo(2.4);
  });
  it('clips partial detections to room boundaries and rejects outside/low-confidence detections',()=>{
    const c=createFloorCalibration(overhead)!;
    const a={...analysis(overhead),furniture:[
      {label:'Partial',confidence:0.8,footprint:[{x:0,y:0.2},{x:0.3,y:0.2},{x:0.3,y:0.4},{x:0,y:0.4}]},
      {label:'Outside',confidence:0.8,footprint:[{x:0,y:0},{x:0.05,y:0},{x:0.05,y:0.05}]},
      {label:'Uncertain',confidence:0.2,footprint:angled},
    ]};
    const result=calibratedFloorAreas(a,c,4,6);
    expect(result.areas).toHaveLength(1);expect(result.unresolved).toBe(2);
    expect(result.areas[0].x-result.areas[0].w/2).toBeCloseTo(-2);
  });
});
