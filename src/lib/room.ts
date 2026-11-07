// Adapted from Angelo's pure fit rules @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
// SceneItem is a derived render record, never a second placement store.
// Pure room-planning rules: no React, no three.js. Units are meters.

export type FurnitureType = "box" | "sofa" | "armchair" | "coffeeTable" | "bed" | "desk" | "lamp" | "rug" | "shelf" | "cabinet";

/** Visual proportions only; confirmed overall dimensions remain the fit source of truth. */
export interface SeatingAppearance {
  arms: "none" | "slim" | "wide" | "rolled";
  seats: number;
  back: "single" | "split" | "tufted";
  legs: "hidden" | "wood" | "metal";
  legHeight: number;
  seatHeight: number;
  armHeight: number;
  backDepth: number;
  softness: number;
  chaise: "none" | "left" | "right";
}

export interface SceneItem {
  id: string;
  type: FurnitureType;
  label: string;
  x: number; // center
  z: number;
  rot: 0 | 90 | 180 | 270;
  w: number;
  d: number;
  h: number;
  color: string;
  appearance?: SeatingAppearance;
}

export interface Room {
  width: number; // x
  depth: number; // z
  height: number;
}

export function footprint(item: Pick<SceneItem, "w" | "d" | "rot">) {
  const swapped = item.rot === 90 || item.rot === 270;
  return { w: swapped ? item.d : item.w, d: swapped ? item.w : item.d };
}

const EPS = 1e-6;

export function fitsInRoom(item: SceneItem, room: Room): boolean {
  const f = footprint(item);
  return (
    Math.abs(item.x) + f.w / 2 <= room.width / 2 + EPS &&
    Math.abs(item.z) + f.d / 2 <= room.depth / 2 + EPS &&
    item.h <= room.height + EPS
  );
}

/** Rugs lie flat, so other items may sit on them. */
export function overlaps(a: SceneItem, b: SceneItem): boolean {
  if (a.type === "rug" || b.type === "rug") return false;
  const fa = footprint(a);
  const fb = footprint(b);
  return (
    Math.abs(a.x - b.x) < (fa.w + fb.w) / 2 - EPS && Math.abs(a.z - b.z) < (fa.d + fb.d) / 2 - EPS
  );
}

export function itemProblems(item: SceneItem, all: readonly SceneItem[], room: Room): string[] {
  const out: string[] = [];
  if (!fitsInRoom(item, room)) out.push("Outside room bounds");
  for (const o of all) if (o.id !== item.id && overlaps(item, o)) out.push(`Overlaps ${o.label}`);
  return out;
}

/** Keep the center inside the room so a dragged item can't be lost off-floor. */
export function clampToRoom(x: number, z: number, room: Room) {
  const hx = room.width / 2;
  const hz = room.depth / 2;
  return { x: Math.max(-hx, Math.min(hx, x)), z: Math.max(-hz, Math.min(hz, z)) };
}
