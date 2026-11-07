import { describe, expect, it } from 'vitest';
import { furnitureProducts } from '../data/furnitureProducts';
import { getRetailerLink, getVisibleProducts } from './catalog';

describe('catalog search, categories, and sorting', () => {
  it('matches titles and categories case-insensitively and ignores outer whitespace', () => {
    expect(getVisibleProducts(furnitureProducts, '  MiCkE  ', 'All', 'none').map(p => p.id)).toEqual(['ikea-micke-80213074', 'ikea-micke-30213076']);
    expect(getVisibleProducts(furnitureProducts, 'beds', 'All', 'none')).toHaveLength(3);
  });
  it('combines search with category filtering and both price orders', () => {
    expect(getVisibleProducts(furnitureProducts, 'MICKE', 'Desks', 'asc').map(p => p.priceUSD)).toEqual([69.99, 109.99]);
    expect(getVisibleProducts(furnitureProducts, 'MICKE', 'Desks', 'desc').map(p => p.priceUSD)).toEqual([109.99, 69.99]);
    expect(getVisibleProducts(furnitureProducts, 'MICKE', 'Sofas', 'asc')).toEqual([]);
  });
  it('preserves featured order and never mutates the source catalog', () => {
    const before = furnitureProducts.map(p => p.id);
    getVisibleProducts(furnitureProducts, '', 'All', 'asc');
    getVisibleProducts(furnitureProducts, '', 'All', 'desc');
    expect(furnitureProducts.map(p => p.id)).toEqual(before);
    expect(getVisibleProducts(furnitureProducts, '', 'All', 'none').map(p => p.id)).toEqual(before);
  });
  it.each(['asc', 'desc'] as const)('keeps unpriced entries last and stable when sorting %s', sort => {
    const products = [
      { ...furnitureProducts[0], id: 'unknown-1', priceUSD: null },
      { ...furnitureProducts[0], id: 'free', priceUSD: 0 },
      { ...furnitureProducts[0], id: 'unknown-2', priceUSD: null },
      { ...furnitureProducts[0], id: 'paid', priceUSD: 10 },
    ];
    const result = getVisibleProducts(products, '', 'All', sort);
    expect(result.slice(-2).map(p => p.id)).toEqual(['unknown-1', 'unknown-2']);
    expect(result.slice(0, 2).map(p => p.priceUSD)).toEqual(sort === 'asc' ? [0, 10] : [10, 0]);
  });
});

describe('retailer links', () => {
  it('identifies IKEA and rejects malformed or executable URLs', () => {
    expect(getRetailerLink(furnitureProducts[15].retailerUrl)?.name).toBe('IKEA');
    expect(getRetailerLink(null)).toBeNull();
    expect(getRetailerLink('not a URL')).toBeNull();
    expect(getRetailerLink('javascript:alert(1)')).toBeNull();
    expect(getRetailerLink('https://fakeikea.com/item')?.name).toBe('retailer');
  });
});
