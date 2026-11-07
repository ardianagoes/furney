import { describe, expect, it } from 'vitest';
import { furnitureProducts } from '../data/furnitureProducts';
import { furnitureAttributes } from '../data/furnitureAttributes';
import { matchProducts } from './photo-match';

describe('Shreya photo matching over the integrated catalog', () => {
  it('keeps attributes separate from products and covers every integrated product ID', () => {
    expect(furnitureProducts.every(product => furnitureAttributes[product.id])).toBe(true);
    expect(furnitureProducts.every(product => !('colors' in product))).toBe(true);
  });
  it('ranks chair descriptors and returns actual existing chair objects only', () => {
    const result = matchProducts({ category: 'Chairs', primaryColor: 'black', material: 'mesh', style: 'modern', keywords: ['office', 'wheels'] }, furnitureProducts, furnitureAttributes);
    expect(result[0].product.id).toBe('chair-3');
    expect(result[0].product).toBe(furnitureProducts.find(p => p.id === 'chair-3'));
    expect(result.every(match => match.product.category === 'Chairs')).toBe(true);
    expect(result[0].score).toBe(175);
    expect(result[0].reasons).toContain('Similar material (mesh)');
  });
  it('returns a different category for sofa descriptors and retains prices/dimensions', () => {
    const result = matchProducts({ category: 'Sofas', primaryColor: 'black', material: 'leather', style: 'modern' }, furnitureProducts, furnitureAttributes);
    expect(result[0].product).toBe(furnitureProducts.find(p => p.id === 'ikea-kivik-80519531'));
    expect(result[0].product).toMatchObject({ widthM: 2.270125, depthM: 0.949325, heightM: 0.828675, priceUSD: 1299 });
    expect(result.every(match => match.product.category === 'Sofas')).toBe(true);
  });
  it('supports manual category/style matches without image analysis or invented products', () => {
    const result = matchProducts({ category: 'Desks', style: 'minimalist' }, furnitureProducts, furnitureAttributes);
    expect(result[0].reasons).toContain('Similar style (minimalist)');
    expect(result.every(match => furnitureProducts.includes(match.product))).toBe(true);
    expect(matchProducts({ category: 'Other' }, furnitureProducts, furnitureAttributes)).toEqual([]);
  });
  it('is stable for ties, limits results, and does not mutate source data', () => {
    const before = furnitureProducts.map(p => p.id);
    expect(matchProducts({ category: 'Sofas' }, furnitureProducts, {}, 2).map(match => match.product.id)).toEqual(['sofa-1', 'sofa-2']);
    expect(furnitureProducts.map(p => p.id)).toEqual(before);
  });
});
