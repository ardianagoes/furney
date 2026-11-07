import { describe, expect, it } from 'vitest';
import { demoProducts } from '../data/demoProducts';
import { feetInchesToMeters, metersToFeetInches } from '../lib/units';
import { createInitialState, getPriceEstimate, plannerReducer } from './plannerState';

describe('imperial to metric boundary', () => {
  it('converts feet and inches without rounding stored dimensions', () => {
    expect(feetInchesToMeters(12, 6)).toBeCloseTo(3.81, 10);
    expect(feetInchesToMeters(0, 1)).toBe(0.0254);
  });
  it('carries rounded inches into feet', () => {
    expect(metersToFeetInches(0.3048 - 0.001)).toEqual({ feet: 1, inches: 0 });
    expect(metersToFeetInches(3.81)).toEqual({ feet: 12, inches: 6 });
  });
});

describe('central planner state', () => {
  const initial = createInitialState(demoProducts);
  const add = (instanceId: string, productId = 'demo-sofa') => plannerReducer(initial, { type: 'product/add', productId, instanceId });

  it('creates independent centered instances for repeated products', () => {
    const first = add('one');
    const second = plannerReducer(first, { type: 'product/add', productId: 'demo-sofa', instanceId: 'two' });
    expect(second.placedItems).toHaveLength(2);
    expect(second.placedItems[0]).toEqual({ instanceId: 'one', productId: 'demo-sofa', xM: initial.room.widthM / 2, zM: initial.room.depthM / 2, rotationDeg: 0 });
    expect(getPriceEstimate(second.products, second.placedItems)).toEqual({ total: 1198, unpricedCount: 0 });
    expect(initial.placedItems).toHaveLength(0);
  });
  it('rejects unknown products and duplicate instance IDs', () => {
    expect(add('one', 'unknown')).toBe(initial);
    const first = add('one');
    expect(plannerReducer(first, { type: 'product/add', productId: 'demo-chair', instanceId: 'one' })).toBe(first);
  });
  it('removes only the requested instance and clears the estimate', () => {
    const first = add('one');
    const second = plannerReducer(first, { type: 'product/add', productId: 'demo-sofa', instanceId: 'two' });
    const removed = plannerReducer(second, { type: 'item/remove', instanceId: 'one' });
    expect(removed.placedItems.map(item => item.instanceId)).toEqual(['two']);
    const cleared = plannerReducer(removed, { type: 'items/clear' });
    expect(getPriceEstimate(cleared.products, cleared.placedItems)).toEqual({ total: 0, unpricedCount: 0 });
  });
  it('counts unpriced products separately from the known subtotal', () => {
    const first = add('one');
    const second = plannerReducer(first, { type: 'product/add', productId: 'demo-shelf', instanceId: 'two' });
    expect(getPriceEstimate(second.products, second.placedItems)).toEqual({ total: 599, unpricedCount: 1 });
  });
  it('accepts valid renderer movements and rejects invalid positions or product swaps', () => {
    const state = add('one');
    const item = { ...state.placedItems[0], xM: 1, zM: 2, rotationDeg: 90 as const };
    const moved = plannerReducer(state, { type: 'item/update', item });
    expect(moved.placedItems[0]).toEqual(item);
    expect(plannerReducer(state, { type: 'item/update', item: { ...item, xM: NaN } })).toBe(state);
    expect(plannerReducer(state, { type: 'item/update', item: { ...item, zM: 100 } })).toBe(state);
    expect(plannerReducer(state, { type: 'item/update', item: { ...item, productId: 'demo-chair' } }).placedItems[0].productId).toBe('demo-sofa');
  });
  it('updates dimensions and clamps item centers when the room shrinks', () => {
    const state = add('one');
    const room = { widthM: 1, depthM: 1, heightM: 2.5 };
    const updated = plannerReducer(state, { type: 'room/update', room });
    expect(updated.room).toEqual(room);
    expect(updated.placedItems[0].xM).toBe(1);
    expect(updated.placedItems[0].zM).toBe(1);
  });
  it.each([0, -1, Infinity, NaN, 30.49])('rejects invalid room dimension %s', value => {
    expect(plannerReducer(initial, { type: 'room/update', room: { ...initial.room, widthM: value } })).toBe(initial);
  });
});
