// Adapted from Shreya's photo search @ 57e756b6bc0daa5f043ada909f07035ad2e0ca43.
import type { FurnitureProduct } from "../types";
import type { ProductAttributes } from "../data/furnitureAttributes";
import type { PhotoAnalysis } from "./photo-search-types";

export interface PhotoMatch {
  product: FurnitureProduct;
  score: number;
  reasons: string[];
}

const words = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
const overlaps = (needle: string, haystack: string[]) => {
  const n = words(needle);
  return n.length > 0 && haystack.some((h) => words(h).some((w) => n.includes(w)));
};

/**
 * Ranks existing catalog products against an analysis. Category match dominates;
 * color, material, style and keywords break ties. Only same-category products
 * are returned, so nothing is invented or loosely matched across categories.
 */
export function matchProducts(
  analysis: Partial<PhotoAnalysis> & { category: string },
  products: readonly FurnitureProduct[],
  attributes: Record<string, ProductAttributes>,
  limit = 6,
): PhotoMatch[] {
  return products
    .filter((p) => p.category === analysis.category)
    .map((product) => {
      const a = attributes[product.id] ?? { colors: [], materials: [], styles: [], keywords: [] };
      const titleWords = words(product.title);
      const reasons = [`Same category: ${product.category}`];
      let score = 100;
      if (analysis.primaryColor && overlaps(analysis.primaryColor, [...a.colors, ...titleWords])) {
        score += 30;
        reasons.push(`Similar color (${analysis.primaryColor})`);
      }
      if (analysis.material && overlaps(analysis.material, a.materials)) {
        score += 20;
        reasons.push(`Similar material (${analysis.material})`);
      }
      if (analysis.style && overlaps(analysis.style, a.styles)) {
        score += 15;
        reasons.push(`Similar style (${analysis.style})`);
      }
      const kw = (analysis.keywords ?? []).filter((k) => overlaps(k, [...a.keywords, ...titleWords]));
      if (kw.length) {
        score += kw.length * 5;
        reasons.push(`Shared features: ${kw.join(", ")}`);
      }
      return { product, score, reasons };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
