import { footprint, type SceneItem } from './room';
import type { OccupiedArea } from './room-photo-types';
export function occupiedBy(item: Pick<SceneItem,'x'|'z'|'w'|'d'|'rot'>, areas: readonly OccupiedArea[]) {
  const size=footprint(item);
  return areas.find(a=>Math.abs(item.x-a.x)<(size.w+a.w)/2-1e-6 && Math.abs(item.z-a.z)<(size.d+a.d)/2-1e-6);
}
