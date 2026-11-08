// Adapted from Angelo @ 64866ec5ea4b38890ecabc56e2c9cc8027f5a0ee.
import * as THREE from 'three';
import type { Room, SceneItem } from './room';
import { footprint } from './room';
import type { RoomAnalysis, ImagePoint, OccupiedArea } from './room-photo-types';
export type { RoomAnalysis, ImagePoint, OccupiedArea } from './room-photo-types';
export interface RoomCamera {height:number; distance:number; yaw:number; pitch:number; fov:number}
export interface PhotoFrame {width:number;height:number;imageWidth:number;imageHeight:number}
// object-cover mapping is shared by analysis calibration and obstacle projection.
export function imageToViewport(p: ImagePoint, frame: PhotoFrame): ImagePoint {
  const scale = Math.max(frame.width / frame.imageWidth, frame.height / frame.imageHeight);
  return { x: (p.x * frame.imageWidth * scale + (frame.width - frame.imageWidth * scale) / 2) / frame.width,
    y: (p.y * frame.imageHeight * scale + (frame.height - frame.imageHeight * scale) / 2) / frame.height };
}
export function roomCamera(rig: RoomCamera, alignment: ImagePoint, frame: PhotoFrame) {
  const camera = new THREE.PerspectiveCamera(rig.fov, frame.width / frame.height, 0.05, 100);
  const yaw = THREE.MathUtils.degToRad(rig.yaw);
  camera.position.set(Math.sin(yaw) * rig.distance, rig.height, Math.cos(yaw) * rig.distance);
  camera.rotation.order = "YXZ";
  camera.rotation.set(-THREE.MathUtils.degToRad(rig.pitch), yaw, 0);
  camera.setViewOffset(frame.width, frame.height, -alignment.x * frame.width, -alignment.y * frame.height, frame.width, frame.height);
  camera.updateMatrixWorld();
  return camera;
}
export function imageFloorPoint(p: ImagePoint, camera: THREE.PerspectiveCamera, frame: PhotoFrame) {
  const v = imageToViewport(p, frame);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(v.x * 2 - 1, 1 - v.y * 2), camera);
  const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
  return hit && Math.abs(hit.x) < 100 && Math.abs(hit.z) < 100 ? { x: hit.x, z: hit.z } : null;
}
export function normalizeRoomAnalysis(input: RoomAnalysis): RoomAnalysis {
  const validPoint = (p: ImagePoint) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  const floor = input.floor;
  const validFloor = floor && [floor.backLeft, floor.backRight, floor.frontRight, floor.frontLeft].every(validPoint)
    && floor.confidence >= 0.5 && floor.backRight.x > floor.backLeft.x
    && floor.frontRight.x > floor.frontLeft.x && (floor.frontLeft.y + floor.frontRight.y) > (floor.backLeft.y + floor.backRight.y) + 0.1;
  const rear = input.rearEdge;
  return { view: input.view ?? "perspective", rearEdge: rear && rear.confidence >= 0.5 && validPoint(rear.left) && validPoint(rear.right) && rear.right.x - rear.left.x > 0.05 ? rear : null, floor: validFloor ? floor : null, furniture: input.furniture.slice(0, 20)
    .map(o => ({ ...o, footprint: o.footprint.length >= 3 && o.footprint.length <= 8 && o.footprint.every(validPoint) ? o.footprint : [], label: o.label.slice(0, 80) || "Existing furniture", confidence: Math.max(0, Math.min(1, o.confidence)) })), notes: input.notes.slice(0, 800) };
}

/** Fit camera perspective to the estimated room-floor quad; no dimensions are inferred. */
export function calibrateFloor(analysis: RoomAnalysis, room: Room, frame: PhotoFrame, initial: RoomCamera) {
  if (analysis.view === "overhead") {
    // Orientation only: measured room dimensions set the scale, not photo inference.
    const aspect = frame.width / frame.height;
    const height = Math.max(room.depth, room.width / aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(initial.fov / 2)));
    return { rig: { ...initial, height, distance: 0.01, yaw: 0, pitch: 89.9 }, alignment: { x: 0, y: 0 }, error: 0 };
  }
  if (!analysis.floor) {
    if (!analysis.rearEdge) {
      const contacts = analysis.furniture.flatMap(o => o.footprint).map(p => imageToViewport(p, frame));
      if (!contacts.length) return null;
      // Keep detected floor contacts below the horizon; this is an orientation hint,
      // not reconstruction of hidden room corners or inferred room measurements.
      const top = Math.min(...contacts.map(p => p.y));
      const requiredPitch = THREE.MathUtils.radToDeg(Math.atan((1 - 2 * top) * Math.tan(THREE.MathUtils.degToRad(initial.fov / 2)))) + 10;
      return { rig: { ...initial, pitch: Math.min(80, Math.max(initial.pitch, requiredPitch)) }, alignment: { x: 0, y: 0 }, error: 0 };
    }
    const left = imageToViewport(analysis.rearEdge.left, frame), right = imageToViewport(analysis.rearEdge.right, frame);
    const camera = roomCamera(initial, { x: 0, y: 0 }, frame);
    const a = new THREE.Vector3(-room.width / 2, 0, -room.depth / 2).project(camera);
    const b = new THREE.Vector3(room.width / 2, 0, -room.depth / 2).project(camera);
    // Two points constrain translation only, not measured scale or full perspective.
    return { rig: initial, alignment: { x: (left.x + right.x) / 2 - (a.x + b.x + 2) / 4, y: (left.y + right.y) / 2 - (2 - a.y - b.y) / 4 }, error: 0 };
  }
  const floor = analysis.floor;
  const targets = [floor.backLeft, floor.backRight, floor.frontRight, floor.frontLeft].map(p => imageToViewport(p, frame));
  const corners = [[-room.width / 2, 0, -room.depth / 2], [room.width / 2, 0, -room.depth / 2], [room.width / 2, 0, room.depth / 2], [-room.width / 2, 0, room.depth / 2]];
  const limits = [[0.5, 3], [1, 10], [-60, 60], [-10, 60], [30, 100], [-1.5, 1.5], [-1.5, 1.5]];
  const score = (v: number[]) => {
    const [height = 1.6, distance = 4.2, yaw = 0, pitch = 14, fov = 60, x = 0, y = 0] = v;
    const camera = roomCamera({ height, distance, yaw, pitch, fov }, { x, y }, frame);
    return corners.reduce((sum, c, i) => {
      const t = targets[i]; if (!t) return Infinity;
      const p = new THREE.Vector3(c[0], c[1], c[2]);
      if (p.clone().applyMatrix4(camera.matrixWorldInverse).z >= -0.1) return Infinity;
      p.project(camera);
      return sum + ((p.x + 1) / 2 - t.x) ** 2 + ((1 - p.y) / 2 - t.y) ** 2;
    }, 0);
  };
  let best = [initial.height, Math.max(initial.distance, room.depth / 2 + 1), initial.yaw, initial.pitch, initial.fov, 0, 0];
  let error = score(best);
  for (let pass = 0; pass < 10; pass++) {
    const steps = [0.3, 0.8, 8, 8, 10, 0.1, 0.1].map(s => s * 0.65 ** pass);
    for (let repeat = 0; repeat < 8; repeat++) for (let axis = 0; axis < 7; axis++) for (const direction of [-1, 1]) {
      const bounds = limits[axis]; const step = steps[axis]; const value = best[axis];
      if (!bounds || step === undefined || value === undefined) continue;
      const next = [...best]; next[axis] = Math.max(bounds[0] ?? 0, Math.min(bounds[1] ?? 0, value + step * direction));
      const nextError = score(next); if (nextError < error) { best = next; error = nextError; }
    }
  }
  if (!Number.isFinite(error) || error > 0.12) return null;
  const [height = 1.6, distance = 4.2, yaw = 0, pitch = 14, fov = 60, x = 0, y = 0] = best;
  return { rig: { height, distance, yaw, pitch, fov }, alignment: { x, y }, error };
}
export function occupiedAreas(analysis: RoomAnalysis | null, rig: RoomCamera, alignment: ImagePoint, frame: PhotoFrame) {
  if (!analysis) return { areas: [] as OccupiedArea[], unresolved: 0, unresolvedLabels: [] as string[] };
  const camera = roomCamera(rig, alignment, frame);
  const areas: OccupiedArea[] = []; const unresolvedLabels: string[] = [];
  analysis.furniture.forEach((o, i) => {
    if (o.confidence < 0.5 || o.footprint.length < 3) { unresolvedLabels.push(o.label); return; }
    const points = o.footprint.map(p => imageFloorPoint(p, camera, frame));
    if (points.some(p => !p)) { unresolvedLabels.push(o.label); return; }
    const xs = points.flatMap(p => p ? [p.x] : []), zs = points.flatMap(p => p ? [p.z] : []);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    areas.push({ id: String(i), label: o.label, x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, w: Math.max(0.1, maxX - minX) + 0.1, d: Math.max(0.1, maxZ - minZ) + 0.1 });
  });
  return { areas, unresolved: unresolvedLabels.length, unresolvedLabels };
}
export function occupiedBy(item: Pick<SceneItem, "x" | "z" | "w" | "d" | "rot">, areas: OccupiedArea[]) {
  const size = footprint(item);
  return areas.find(a => Math.abs(item.x - a.x) < (size.w + a.w) / 2 && Math.abs(item.z - a.z) < (size.d + a.d) / 2);
}
