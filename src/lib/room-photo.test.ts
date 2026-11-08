import { describe,expect,it } from 'vitest';
import { parseRoomAnalysis, type RoomAnalysis } from './room-photo-types';
import { calibrateFloor,occupiedAreas,imageToViewport } from './room-photo';
import { occupiedBy } from './occupiedAreas';
import { furnitureProducts } from '../data/furnitureProducts';
import { createInitialState,plannerReducer,getPriceEstimate } from '../state/plannerState';
import { toSceneItem } from './plannerAdapter';
const analysis:RoomAnalysis={view:'overhead',floor:null,rearEdge:null,notes:'Approximate.',furniture:[{label:'Existing chair',confidence:0.9,footprint:[{x:0.4,y:0.4},{x:0.6,y:0.4},{x:0.6,y:0.6},{x:0.4,y:0.6}]}]};
describe('experimental room analysis boundaries',()=>{
  it('validates bounded image coordinates and rejects malformed/provider-invented dimensions',()=>{
    expect(parseRoomAnalysis(analysis)).toBeTruthy();
    expect(parseRoomAnalysis({...analysis,furniture:[{...analysis.furniture[0],confidence:2}]})).toBeNull();
    expect(parseRoomAnalysis({...analysis,furniture:[{...analysis.furniture[0],footprint:[{x:50,y:1}]}]})).toBeNull();
    expect(parseRoomAnalysis({roomWidth:4})).toBeNull();
  });
  it('maps object-cover cropping and projects floor contacts using measured room scale',()=>{
    expect(imageToViewport({x:0.5,y:0.5},{width:800,height:400,imageWidth:1000,imageHeight:1000})).toEqual({x:0.5,y:0.5});
    const frame={width:600,height:600,imageWidth:1400,imageHeight:1400};
    const suggestion=calibrateFloor(analysis,{width:4,depth:4,height:3},frame,{height:4,distance:6,yaw:0,pitch:35,fov:50})!;
    expect(suggestion.rig.pitch).toBe(89.9);
    const projected=occupiedAreas(analysis,suggestion.rig,suggestion.alignment,frame);
    expect(projected.areas).toHaveLength(1);
    expect(projected.areas[0].w).toBeGreaterThan(0.1);
    expect(occupiedAreas({...analysis,furniture:[{...analysis.furniture[0],confidence:0.1}]},suggestion.rig,suggestion.alignment,frame).unresolved).toBe(1);
  });
  it('avoids accepted detected areas, warns on manual overlap, and clears them without changing prices',()=>{
    let state=createInitialState(furnitureProducts);
    const area={id:'0',label:'Existing chair',x:0,z:0,w:1,d:1};
    state=plannerReducer(state,{type:'occupied/update',areas:[area]});
    state=plannerReducer(state,{type:'product/add',instanceId:'new',productId:'ikea-lack-30449908'});
    const product=furnitureProducts.find(p=>p.id==='ikea-lack-30449908')!;
    expect(occupiedBy(toSceneItem(state.placedItems[0],product,state.room),state.occupiedAreas)).toBeUndefined();
    state=plannerReducer(state,{type:'item/update',item:{...state.placedItems[0],xM:state.room.widthM/2,zM:state.room.depthM/2}});
    expect(occupiedBy(toSceneItem(state.placedItems[0],product,state.room),state.occupiedAreas)?.label).toBe('Existing chair');
    expect(getPriceEstimate(state.products,state.placedItems).total).toBe(16.99);
    state=plannerReducer(state,{type:'occupied/update',areas:[]});
    expect(state.occupiedAreas).toEqual([]);
    expect(state.placedItems).toHaveLength(1);
  });
});
