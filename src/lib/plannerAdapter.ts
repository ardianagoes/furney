import type { FurnitureProduct, PlacedItem, RoomDimensions } from '../types';
import { clampToRoom, type FurnitureType, type Room, type SceneItem } from './room';

/** Furney's corner-origin centers -> Angelo's center-origin scene. No axis flip
 * or unit conversion: positive x/z and positive Y-axis rotation are preserved. */
export function toScenePosition(item: Pick<PlacedItem, 'xM' | 'zM'>, room: RoomDimensions) {
  return { x: item.xM - room.widthM / 2, z: item.zM - room.depthM / 2 };
}

export function toFurneyPosition(x: number, z: number, room: RoomDimensions) {
  return { xM: x + room.widthM / 2, zM: z + room.depthM / 2 };
}

export const toSceneRoom = (room: RoomDimensions): Room => ({ width: room.widthM, depth: room.depthM, height: room.heightM });

/** Source geometry is illustrative, never a manufacturer-exact model. */
export function categoryModel(category: string, title = ''): FurnitureType {
  switch (category.toLowerCase()) {
    case 'sofa': case 'sofas': return 'sofa';
    case 'chair': case 'chairs': case 'armchairs': return 'armchair';
    case 'seating': return /sofa|loveseat|sectional/i.test(title) ? 'sofa' : 'armchair';
    case 'bed': case 'beds': return 'bed';
    case 'desk': case 'desks': return 'desk';
    case 'table': case 'tables': return 'coffeeTable';
    case 'lighting': case 'lamps': return 'lamp';
    case 'rug': case 'rugs': return 'rug';
    case 'storage': case 'shelves': return 'shelf';
    case 'cabinets': return 'cabinet';
    default: return 'box';
  }
}

const colors: Record<FurnitureType, string> = {
  sofa: '#899978', armchair: '#bb8768', bed: '#c5b69a', coffeeTable: '#a8875d',
  desk: '#b99d78', lamp: '#625f4c', rug: '#c6b598', shelf: '#9f815e', cabinet: '#a8875d', box: '#a5af98',
};

export function toSceneItem(item: PlacedItem, product: FurnitureProduct, room: RoomDimensions): SceneItem {
  const type = categoryModel(product.category, product.title);
  return {
    id: item.instanceId, label: product.title, type, ...toScenePosition(item, room),
    rot: item.rotationDeg, w: product.widthM, d: product.depthM, h: product.heightM, color: colors[type],
  };
}

/** Keep Angelo's 5cm drag snapping, then clamp AFTER snapping so non-grid room
 * dimensions cannot produce a center just outside Furney's reducer limits. */
export function placementFromDrag(item: PlacedItem, x: number, z: number, room: RoomDimensions): PlacedItem {
  const snapped = clampToRoom(Math.round(x * 20) / 20, Math.round(z * 20) / 20, toSceneRoom(room));
  return { ...item, ...toFurneyPosition(snapped.x, snapped.z, room) };
}

export function rotatePlacement(item: PlacedItem): PlacedItem {
  return { ...item, rotationDeg: ((item.rotationDeg + 90) % 360) as PlacedItem['rotationDeg'] };
}
