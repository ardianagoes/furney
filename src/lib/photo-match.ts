// Adapted from Shreya @ 6bde669d0ee75ac4a0c5541b675b76b121687818.
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

// Broad appearance families, not exact paint colors or material identification.
const colorFamilies = [
  /\b(?:cream|beige|off white|offwhite|ivory|greige|white|taupe|ecru)\b/,
  /\b(?:rust|terracotta|terra cotta|burnt orange|orange)\b/,
  /\b(?:gray|grey|silver|charcoal)\b/,
  /\b(?:brown|tan|walnut|chocolate|honey|natural wood|light wood|dark wood)\b/,
  /\b(?:black|ebony)\b/,
  /\b(?:blue|navy|cobalt|azure)\b/,
  /\b(?:green|sage|olive|emerald)\b/,
  /\b(?:teal|turquoise|cyan)\b/,
  /\b(?:red|burgundy|maroon|crimson)\b/,
  /\b(?:pink|rose|blush)\b/,
  /\b(?:yellow|gold|golden|mustard)\b/,
  /\b(?:purple|violet|lavender|lilac)\b/,
];
const colorGroups = (values: string[]) => {
  const normalized = values.map((value) => value.toLowerCase().replace(/[^a-z]+/g, " "));
  return colorFamilies.flatMap((pattern, index) => normalized.some((value) => pattern.test(value)) ? [index] : []);
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
  const searchColors = colorGroups(analysis.primaryColor ? [analysis.primaryColor] : []);
  return products
    .filter((p) => p.category === analysis.category)
    .map((product) => {
      const a = attributes[product.id] ?? { colors: [], materials: [], styles: [], keywords: [] };
      const titleWords = words(product.title);
      const reasons = [`Same category: ${product.category}`];
      let score = 100;
      const declaredColors = colorGroups(a.colors);
      const bonusColors = colorGroups([...a.colors, product.title]);
      const colorMatch = searchColors.some((color) => bonusColors.includes(color));
      if (colorMatch) {
        score += 30;
        reasons.push(`Similar color (${analysis.primaryColor})`);
      } else if (searchColors.length > 0 && declaredColors.length > 0) {
        score -= 20;
        reasons.push(`Different color (${analysis.primaryColor})`);
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
