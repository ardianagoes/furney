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

// Regression cases adapted from Shreya's latest photo-match tests (23 cases).
const sampleSofa = furnitureProducts.find((product) => product.id === "sofa-1");
if (!sampleSofa) throw new Error("Expected the existing Linden sofa fixture");
const colorScore = (searchColor: string | undefined, productColors: string[]) => matchProducts(
  { category: "Sofas", ...(searchColor === undefined ? {} : { primaryColor: searchColor }) },
  [sampleSofa],
  { [sampleSofa.id]: { colors: productColors, materials: [], styles: [], keywords: [] } },
)[0]?.score;

describe("photo match ranking", () => {
  it("returns only same-category catalog products", () => {
    const m = matchProducts({ category: "Sofas", primaryColor: "black", material: "leather", style: "modern", keywords: [] }, furnitureProducts, furnitureAttributes);
    expect(m.every((x) => x.product.category === "Sofas")).toBe(true);
    expect(m[0]?.product.id).toBe("ikea-kivik-80519531");
  });
  it("returns nothing for a category not in the catalog", () => {
    expect(matchProducts({ category: "Other" }, furnitureProducts, furnitureAttributes)).toHaveLength(0);
  });
  it("ranks a beige Linden above rust-orange Marlo for a cream fabric sofa", () => {
    const matches = matchProducts({ category: "Sofas", primaryColor: "cream", material: "fabric", style: "modern", keywords: ["upholstered", "sofa"] }, furnitureProducts, furnitureAttributes);
    expect(matches[0]?.product.id).toBe("sofa-1");
    expect(matches.find((match) => match.product.id === "sofa-1")?.score).toBe(170);
    expect(matches.find((match) => match.product.id === "sofa-2")?.score).toBe(120);
  });
  it("ranks white MICKE above natural-wood Nook", () => {
    const matches = matchProducts({ category: "Desks", primaryColor: "white", style: "minimalist", keywords: ["writing", "desk"] }, furnitureProducts, furnitureAttributes);
    expect(matches[0]?.product.id).toBe("ikea-micke-80213074");
    expect(matches.find((match) => match.product.id === "ikea-micke-80213074")?.score).toBe(155);
    expect(matches.find((match) => match.product.id === "desk-3")?.score).toBe(105);
  });
  it("does not penalize missing search color", () => {
    expect(colorScore(undefined, ["rust"])).toBe(100);
  });
  it.each(["cream", "beige", "off-white", "ivory", "greige"])("treats cream and %s as compatible neutrals", (color) => {
    expect(colorScore("cream", [color])).toBe(130);
  });
  it("does not penalize a multicolored product with one matching color", () => {
    expect(colorScore("cream", ["black", "beige"])).toBe(130);
  });
  it("penalizes a clear recognized mismatch by exactly 20", () => {
    expect(colorScore("cream", ["rust", "terracotta", "burnt orange"])).toBe(80);
  });
  it.each([{ colors: [] }, { colors: ["unknown"] }, { colors: ["fabric"] }])("does not penalize missing or unknown product colors: $colors", ({ colors }) => {
    expect(colorScore("cream", colors)).toBe(100);
  });
  it("does not penalize unknown search color", () => {
    expect(colorScore("unknown", ["black"])).toBe(100);
  });
  it.each(["rust", "terracotta", "burnt orange", "orange"])("groups %s with orange", (color) => {
    expect(colorScore("orange", [color])).toBe(130);
  });
  it("normalizes gray/grey spelling", () => {
    expect(colorScore("gray", ["grey"])).toBe(130);
  });
  it("preserves material, style and per-keyword bonuses", () => {
    const matches = matchProducts({ category: "Sofas", material: "fabric", style: "modern", keywords: ["three-seat", "armrests"] }, [sampleSofa], furnitureAttributes);
    expect(matches[0]?.score).toBe(145);
  });
  it("keeps the default six-result limit and deterministic catalog-order ties", () => {
    const products = Array.from({ length: 8 }, (_, index) => ({ ...sampleSofa, id: `test-sofa-${index}` }));
    expect(matchProducts({ category: "Sofas" }, products, {}).map((match) => match.product.id)).toEqual(products.slice(0, 6).map((product) => product.id));
  });
});
