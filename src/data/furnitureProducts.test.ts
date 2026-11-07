import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { furnitureProducts } from './furnitureProducts';
import { createInitialState, getPriceEstimate, plannerReducer } from '../state/plannerState';

describe('Shreya catalog import', () => {
  it('includes all 15 samples and six IKEA-linked products with unique IDs', () => {
    expect(furnitureProducts).toHaveLength(21);
    expect(furnitureProducts.filter(p => p.retailerUrl === null)).toHaveLength(15);
    expect(furnitureProducts.filter(p => p.retailerUrl !== null)).toHaveLength(6);
    expect(new Set(furnitureProducts.map(p => p.id)).size).toBe(21);
    expect(furnitureProducts.every(p => [p.widthM, p.depthM, p.heightM].every(n => Number.isFinite(n) && n > 0))).toBe(true);
    expect(furnitureProducts.every(p => p.priceUSD === null || (Number.isFinite(p.priceUSD) && p.priceUSD >= 0))).toBe(true);
    expect(furnitureProducts.some(p => p.id.startsWith('demo-'))).toBe(false);
  });
  it('contains 15 local JPEG files, each referenced by its sample product', () => {
    const dir = new URL('../assets/furniture/', import.meta.url);
    const images = readdirSync(dir).filter(name => name.endsWith('.jpg'));
    expect(images).toHaveLength(15);
    for (const product of furnitureProducts.filter(p => p.retailerUrl === null)) {
      expect(images).toContain(`${product.id}.jpg`);
      expect(product.imageUrl).toContain(`${product.id}.jpg`);
      expect(readFileSync(new URL(`${product.id}.jpg`, dir)).subarray(0, 2).toString('hex')).toBe('ffd8');
    }
  });
  it('preserves imported dimensions, fractional prices, and retailer URLs', () => {
    expect(furnitureProducts.find(p => p.id === 'ikea-kivik-80519531')).toMatchObject({ widthM: 2.270125, depthM: 0.949325, heightM: 0.828675, priceUSD: 1299 });
    expect(furnitureProducts.find(p => p.id === 'ikea-micke-80213074')).toMatchObject({ priceUSD: 109.99, retailerUrl: 'https://www.ikea.com/us/en/p/micke-desk-white-80213074/' });
  });
  it('adds every imported product through the existing reducer and totals to exact cents', () => {
    let state = createInitialState(furnitureProducts);
    for (const product of furnitureProducts) {
      state = plannerReducer(state, { type: 'product/add', productId: product.id, instanceId: `instance-${product.id}` });
    }
    expect(state.placedItems).toHaveLength(21);
    expect(getPriceEstimate(state.products, state.placedItems)).toEqual({ total: 13009.96, unpricedCount: 0 });
  });
});
