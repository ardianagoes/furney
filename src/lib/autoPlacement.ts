import type { FurnitureProduct, PlacedItem, RoomDimensions } from '../types';
import { toFurneyPosition, toSceneItem, toSceneRoom } from './plannerAdapter';
import { fitsInRoom, footprint, overlaps } from './room';
import type { OccupiedArea } from './room-photo-types';

/** Try center first, then boundary/contact positions nearest the center.
 * AABB free-space boundaries lie on room edges or obstacle edges. Their cross
 * product finds even narrow gaps a sampled grid could miss. Try 90° if needed.
 * No mutation, rounding of product dimensions, or independent placement store.
 */
export function findAvailablePlacement(
  item: PlacedItem, product: FurnitureProduct, room: RoomDimensions,
  placedItems: readonly PlacedItem[], products: readonly FurnitureProduct[],
  occupied: readonly OccupiedArea[] = [],
): PlacedItem {
  const sceneRoom = toSceneRoom(room);
  const existing = placedItems.flatMap(placed => {
    const record = products.find(p => p.id === placed.productId);
    return record ? [toSceneItem(placed, record, room)] : [];
  });
  existing.push(...occupied.map(a=>({id:'detected-'+a.id,label:a.label,type:'box' as const,x:a.x,z:a.z,w:a.w,d:a.d,h:0,rot:0 as const,color:'#c5934b'})));
  const fallback = { ...item, xM: room.widthM / 2, zM: room.depthM / 2 };
  for (const rotationDeg of [0, 90] as const) {
    const candidate = toSceneItem({ ...fallback, rotationDeg }, product, room);
    const f = footprint(candidate);
    if (f.w > room.widthM + 1e-6 || f.d > room.depthM + 1e-6 || product.heightM > room.heightM + 1e-6) continue;
    const xs = new Set([0, -(room.widthM - f.w) / 2, (room.widthM - f.w) / 2]);
    const zs = new Set([0, -(room.depthM - f.d) / 2, (room.depthM - f.d) / 2]);
    for (const other of existing) {
      const extent = footprint(other);
      xs.add(other.x - (extent.w + f.w) / 2);
      xs.add(other.x + (extent.w + f.w) / 2);
      zs.add(other.z - (extent.d + f.d) / 2);
      zs.add(other.z + (extent.d + f.d) / 2);
    }
    const candidates = [...xs].flatMap(x => [...zs].map(z => ({ ...candidate, x, z })))
      .filter(value => fitsInRoom(value, sceneRoom))
      .sort((a, b) => (a.x * a.x + a.z * a.z) - (b.x * b.x + b.z * b.z) || a.z - b.z || a.x - b.x);
    const free = candidates.find(value => existing.every(other => !overlaps(value, other)));
    if (free) return { ...item, rotationDeg, ...toFurneyPosition(free.x, free.z, room) };
  }
  // Existing fit warnings explain an overlap or oversized item at this center.
  return fallback;
}
