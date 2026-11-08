import type { FurnitureProduct, PlacedItem, RoomDimensions } from '../types';
import { feetInchesToMeters, MAX_ROOM_METERS } from '../lib/units';
import { findAvailablePlacement } from '../lib/autoPlacement';
import type { OccupiedArea } from '../lib/room-photo-types';

export interface PlannerState {
  room: RoomDimensions;
  products: FurnitureProduct[];
  placedItems: PlacedItem[];
  occupiedAreas: OccupiedArea[];
}

export type PlannerAction =
  | { type: 'occupied/update'; areas: OccupiedArea[] }
  | { type: 'room/update'; room: RoomDimensions }
  | { type: 'product/add'; productId: string; instanceId: string }
  | { type: 'item/update'; item: PlacedItem }
  | { type: 'item/remove'; instanceId: string }
  | { type: 'items/clear' };

export function createInitialState(products: FurnitureProduct[]): PlannerState {
  return {
    room: { widthM: feetInchesToMeters(12, 0), depthM: feetInchesToMeters(14, 0), heightM: feetInchesToMeters(9, 0) },
    products,
    placedItems: [],
    occupiedAreas: [],
  };
}

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'occupied/update':
      if(action.areas.length>20 || action.areas.some(a=>typeof a.id!=='string'||typeof a.label!=='string'||a.label.length>80||![a.x,a.z,a.w,a.d].every(Number.isFinite)||a.w<=0||a.d<=0||a.w>100||a.d>100||Math.abs(a.x)>100||Math.abs(a.z)>100)) return state;
      return {...state,occupiedAreas:action.areas};
    case 'room/update': {
      if (!Object.values(action.room).every(value => Number.isFinite(value) && value >= 0.3048 && value <= MAX_ROOM_METERS)) return state;
      return { ...state, room: action.room, occupiedAreas: [], placedItems: state.placedItems.map(item => ({
        ...item, xM: Math.min(item.xM, action.room.widthM), zM: Math.min(item.zM, action.room.depthM),
      })) };
    }
    case 'product/add': {
      const product = state.products.find(product => product.id === action.productId);
      if (!product || state.placedItems.some(item => item.instanceId === action.instanceId)) return state;
      const item: PlacedItem = {
        instanceId: action.instanceId, productId: action.productId,
        xM: state.room.widthM / 2, zM: state.room.depthM / 2, rotationDeg: 0,
      };
      return { ...state, placedItems: [...state.placedItems, findAvailablePlacement(item, product, state.room, state.placedItems, state.products, state.occupiedAreas)] };
    }
    case 'item/update': {
      const { item } = action;
      if (!Number.isFinite(item.xM) || !Number.isFinite(item.zM) || item.xM < 0 || item.xM > state.room.widthM || item.zM < 0 || item.zM > state.room.depthM || ![0, 90, 180, 270].includes(item.rotationDeg)) return state;
      return { ...state, placedItems: state.placedItems.map(previous => previous.instanceId === item.instanceId && previous.productId === item.productId ? item : previous) };
    }
    case 'item/remove':
      return { ...state, placedItems: state.placedItems.filter(item => item.instanceId !== action.instanceId) };
    case 'items/clear':
      return { ...state, placedItems: [] };
  }
}

export function getPriceEstimate(products: readonly FurnitureProduct[], items: readonly PlacedItem[]) {
  return items.reduce((estimate, item) => {
    const price = products.find(product => product.id === item.productId)?.priceUSD;
    return { total: Math.round((estimate.total + (price ?? 0)) * 100) / 100, unpricedCount: estimate.unpricedCount + (price == null ? 1 : 0) };
  }, { total: 0, unpricedCount: 0 });
}
