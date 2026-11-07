// Shreya's 23 regressions @ 6bde669d0ee75ac4a0c5541b675b76b121687818.
import { describe, expect, it } from "vitest";
import { furnitureAttributes } from "../data/furnitureAttributes";
import { furnitureProducts } from "../data/furnitureProducts";
import { matchProducts } from "../lib/photo-match";

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
    const ids = matches.map(match => match.product.id);
    expect(ids.indexOf("ikea-uppland-19384116")).toBeLessThan(ids.indexOf("sofa-2"));
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
