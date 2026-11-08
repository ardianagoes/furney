import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { furnitureProducts } from './furnitureProducts';
import { furnitureAttributes } from './furnitureAttributes';
import sources from '../../docs/ikea-catalog-sources.json';
import { createInitialState, getPriceEstimate, plannerReducer } from '../state/plannerState';
describe('verified IKEA-only public catalog', () => {
  it('has at least 18 real, unique, sourced products across all five categories', () => {
    expect(furnitureProducts.length).toBeGreaterThanOrEqual(18);
    expect(new Set(furnitureProducts.map(p=>p.id)).size).toBe(furnitureProducts.length);
    expect(new Set(furnitureProducts.map(p=>p.category))).toEqual(new Set(['Sofas','Chairs','Beds','Desks','Tables']));
    for(const p of furnitureProducts) {
      expect(p.id).toMatch(/^ikea-/);
      expect(p.retailerUrl).toMatch(/^https:\/\/www.ikea.com\/us\/en\/p\//);
      expect([p.widthM,p.depthM,p.heightM,p.priceUSD!].every(n=>Number.isFinite(n)&&n>0)).toBe(true);
      expect(furnitureAttributes[p.id]).toBeTruthy();
      expect(sources.find(s=>s.id===p.id)?.priceUSD).toBe(p.priceUSD);
      const article = sources.find(s=>s.id===p.id)!.article.replaceAll('.','');
      expect(readFileSync(new URL('../assets/ikea/'+article+'.jpg',import.meta.url)).subarray(0,2).toString('hex')).toBe('ffd8');
    }
  });
  it('uses assembled frame extents, full chaise depth, table diameter and exact inch conversion', () => {
    expect(furnitureProducts.find(p=>p.id==='ikea-malm-19931605')).toMatchObject({widthM:1.679575,depthM:2.111375,heightM:1.000125});
    expect(furnitureProducts.find(p=>p.id==='ikea-morabo-39575884')?.depthM).toBeCloseTo(62.25*0.0254,10);
    expect(furnitureProducts.find(p=>p.id==='ikea-lisabo-40416498')).toMatchObject({widthM:1.050925,depthM:1.050925});
    expect(furnitureProducts.find(p=>p.id==='ikea-lack-90449905')).toMatchObject({widthM:0.898525,depthM:0.549275});
  });
  it('adds every actual catalog product and totals the verified snapshots to cents', () => {
    let state=createInitialState(furnitureProducts);
    for(const p of furnitureProducts) state=plannerReducer(state,{type:'product/add',productId:p.id,instanceId:p.id});
    expect(state.placedItems).toHaveLength(19);
    expect(getPriceEstimate(state.products,state.placedItems)).toEqual({total:6841.4,unpricedCount:0});
  });
});
