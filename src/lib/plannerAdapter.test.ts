import { describe, expect, it } from 'vitest';
import { furnitureProducts } from '../data/furnitureProducts';
import { categoryModel, placementFromDrag, rotatePlacement, toFurneyPosition, toSceneItem, toScenePosition, toSceneRoom } from './plannerAdapter';
import { createInitialState, plannerReducer } from '../state/plannerState';
import type { PlacedItem } from '../types';

const room = { widthM: 4, depthM: 6, heightM: 2.6 };
const item: PlacedItem = { instanceId: 'piece', productId: 'ikea-kivik-80519531', xM: 2, zM: 3, rotationDeg: 0 };

describe('Furney <-> Angelo coordinate boundary', () => {
  it('maps the room center and both floor corners without reversing axes', () => {
    expect(toScenePosition(item, room)).toEqual({ x: 0, z: 0 });
    expect(toScenePosition({ xM: 0, zM: 0 }, room)).toEqual({ x: -2, z: -3 });
    expect(toScenePosition({ xM: 4, zM: 6 }, room)).toEqual({ x: 2, z: 3 });
    expect(toSceneRoom(room)).toEqual({ width: 4, depth: 6, height: 2.6 });
  });
  it.each([0, 90, 180, 270] as const)('preserves meters, dimensions, IDs, and %s° orientation', rotationDeg => {
    const product = furnitureProducts[0];
    const position = { ...item, xM: 0.75, zM: 4.5, rotationDeg };
    const scene = toSceneItem(position, product, room);
    expect(scene).toMatchObject({ id: 'piece', w: product.widthM, d: product.depthM, h: product.heightM, x: -1.25, z: 1.5, rot: rotationDeg, type: 'sofa' });
    expect(toFurneyPosition(scene.x, scene.z, room)).toEqual({ xM: position.xM, zM: position.zM });
  });
  it('round-trips a drag through the real reducer, retaining product and instance identity', () => {
    let state = createInitialState(furnitureProducts);
    state = plannerReducer(state, { type: 'room/update', room });
    state = plannerReducer(state, { type: 'product/add', productId: item.productId, instanceId: item.instanceId });
    const moved = placementFromDrag(state.placedItems[0], -1.1, 0.6, room);
    state = plannerReducer(state, { type: 'item/update', item: moved });
    expect(state.placedItems[0]).toMatchObject({ instanceId: item.instanceId, productId: item.productId, rotationDeg: 0 });
    expect(state.placedItems[0].xM).toBeCloseTo(0.9, 10);
    expect(state.placedItems[0].zM).toBeCloseTo(3.6, 10);
    expect(toSceneItem(state.placedItems[0], furnitureProducts[0], room).x).toBeCloseTo(-1.1);
  });
  it('clamps after snapping even when room edges are not on the 5cm grid', () => {
    const small = { widthM: 1.03, depthM: 1.13, heightM: 2.6 };
    const moved = placementFromDrag(item, 100, -100, small);
    expect(moved.xM).toBeCloseTo(1.03);
    expect(moved.zM).toBe(0);
    expect(placementFromDrag(item, -0.124, 0.071, room)).toMatchObject({ xM: 1.9, zM: 3.05 });
  });
  it('cycles quarter turns without modifying the original placement', () => {
    let rotated = item;
    for (const angle of [90, 180, 270, 0]) {
      rotated = rotatePlacement(rotated);
      expect(rotated.rotationDeg).toBe(angle);
    }
    expect(item.rotationDeg).toBe(0);
  });
  it('maps all imported categories and uses a dimensioned box for unknown products', () => {
    expect(['Sofas', 'Chairs', 'Beds', 'Desks', 'Tables'].map(category => categoryModel(category))).toEqual(['sofa', 'armchair', 'bed', 'desk', 'coffeeTable']);
    expect(categoryModel('Seating', 'Test loveseat')).toBe('sofa');
    expect(categoryModel('Unrecognized')).toBe('box');
  });
});
