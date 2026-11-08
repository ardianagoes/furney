import { describe, expect, it } from 'vitest';
import type { FurnitureProduct, PlacedItem, RoomDimensions } from '../types';
import { furnitureProducts } from '../data/furnitureProducts';
import { createInitialState, getPriceEstimate, plannerReducer } from '../state/plannerState';
import { findAvailablePlacement } from './autoPlacement';
import { toSceneItem, toSceneRoom } from './plannerAdapter';
import { fitsInRoom, itemProblems, overlaps } from './room';

const room = { widthM: 4, depthM: 5, heightM: 3 };
const product = (id: string, widthM: number, depthM: number): FurnitureProduct => ({
  id, title: id, category: 'Tables', widthM, depthM, heightM: 0.75,
  priceUSD: 25.99, imageUrl: null, retailerUrl: null,
});
const item = (productId: string, xM = 2, zM = 2.5, rotationDeg: PlacedItem['rotationDeg'] = 0): PlacedItem => ({
  productId, instanceId: productId, xM, zM, rotationDeg,
});
const scene = (i: PlacedItem, products: FurnitureProduct[], dimensions = room) => toSceneItem(i, products.find(p => p.id === i.productId)!, dimensions);

describe('automatic shared-state furniture placement', () => {
  it('places repeated products without collisions, preserving existing instances, prices, and dimensions', () => {
    let state = { ...createInitialState(furnitureProducts), room };
    const before = structuredClone(furnitureProducts);
    for (let index = 0; index < 4; index++) {
      const previous = state.placedItems;
      state = plannerReducer(state, { type: 'product/add', productId: 'ikea-kivik-80519531', instanceId: String(index) });
      expect(state.placedItems.slice(0, -1)).toEqual(previous);
      const all = state.placedItems.map(i => scene(i, furnitureProducts));
      expect(all.every(value => itemProblems(value, all, toSceneRoom(room)).length === 0)).toBe(true);
    }
    expect(getPriceEstimate(state.products, state.placedItems).total).toBe(5196);
    expect(furnitureProducts).toEqual(before);
  });

  it('tries a quarter turn when only the rotated footprint fits', () => {
    const p = product('long', 3, 1);
    const dimensions = { widthM: 2, depthM: 4, heightM: 3 };
    const result = findAvailablePlacement(item(p.id), p, dimensions, [], [p]);
    expect(result).toMatchObject({ xM: 1, zM: 2, rotationDeg: 90 });
    expect(fitsInRoom(scene(result, [p], dimensions), toSceneRoom(dimensions))).toBe(true);
  });

  it('respects existing rotated footprints and is deterministic', () => {
    const products = [product('rotated', 3, 1), product('new', 1.5, 1.5)];
    const placed = [item('rotated', 1, 2.5, 90)];
    const result = findAvailablePlacement(item('new'), products[1], room, placed, products);
    expect(result).toEqual(findAvailablePlacement(item('new'), products[1], room, placed, products));
    expect(overlaps(scene(result, products), scene(placed[0], products))).toBe(false);
    expect(fitsInRoom(scene(result, products), toSceneRoom(room))).toBe(true);
  });

  it('finds narrow off-grid gaps using exact contact edges', () => {
    const dimensions = { widthM: 3, depthM: 3, heightM: 3 };
    const products = [product('left', 1.111, 3), product('right', 1.866, 3), product('thin', 0.02, 3)];
    const placed = [item('left', 0.5555, 1.5), item('right', 2.067, 1.5)];
    const result = findAvailablePlacement(item('thin'), products[2], dimensions, placed, products);
    const value = scene(result, products, dimensions);
    expect(result.xM).toBeGreaterThanOrEqual(1.121 - 1e-6);
    expect(result.xM).toBeLessThanOrEqual(1.124 + 1e-6);
    expect(itemProblems(value, [value, ...placed.map(i => scene(i, products, dimensions))], toSceneRoom(dimensions))).toEqual([]);
  });

  it.each([
    { widthM: 1, depthM: 1, heightM: 3 },
    { widthM: 4, depthM: 5, heightM: 0.5 },
  ] satisfies RoomDimensions[])('keeps oversized products at a predictable center with boundary warnings: %j', dimensions => {
    const p = product('oversized', 2, 2);
    const result = findAvailablePlacement(item(p.id), p, dimensions, [], [p]);
    expect(result).toEqual({ ...item(p.id), xM: dimensions.widthM / 2, zM: dimensions.depthM / 2, rotationDeg: 0 });
    expect(itemProblems(scene(result, [p], dimensions), [], toSceneRoom(dimensions))).toContain('Outside room bounds');
  });

  it('keeps all products when full and exposes the fallback overlap through existing warnings', () => {
    const p = product('full', 4, 5);
    const placed = [item(p.id)];
    const result = findAvailablePlacement({ ...item(p.id), instanceId: 'second' }, p, room, placed, [p]);
    expect(result).toMatchObject({ xM: 2, zM: 2.5, rotationDeg: 0 });
    expect(itemProblems(scene(result, [p]), placed.map(i => scene(i, [p])), toSceneRoom(room))).toContain('Overlaps full');
    expect(placed).toEqual([item(p.id)]);
  });
});
