// Adapted from Shreya's photo search @ 57e756b6bc0daa5f043ada909f07035ad2e0ca43.
/**
 * Visual descriptors for catalog products, used by photo search matching.
 * Kept separate so the FurnitureProduct interface stays unchanged.
 * Descriptors come from each product's title and its catalog photo.
 */
export interface ProductAttributes {
  colors: string[];
  materials: string[];
  styles: string[];
  keywords: string[];
}

export const furnitureAttributes: Record<string, ProductAttributes> = {
  "sofa-1": { colors: ["grey", "gray"], materials: ["fabric"], styles: ["modern", "minimalist"], keywords: ["three-seat", "armrests", "cushions", "straight"] },
  "sofa-2": { colors: ["beige", "cream"], materials: ["fabric"], styles: ["modern", "compact"], keywords: ["loveseat", "two-seat", "small", "armrests"] },
  "sofa-3": { colors: ["grey", "gray"], materials: ["fabric"], styles: ["modern", "scandinavian"], keywords: ["sectional", "corner", "l-shaped", "large"] },
  "bed-1": { colors: ["brown", "wood"], materials: ["wood"], styles: ["modern", "minimalist"], keywords: ["platform", "queen", "low", "headboard"] },
  "bed-2": { colors: ["grey", "gray"], materials: ["fabric", "upholstered"], styles: ["modern", "traditional"], keywords: ["king", "upholstered", "headboard", "tall"] },
  "bed-3": { colors: ["natural", "light wood", "pine"], materials: ["pine", "wood"], styles: ["scandinavian", "rustic"], keywords: ["daybed", "twin", "rails", "small"] },
  "desk-1": { colors: ["oak", "light wood", "brown"], materials: ["oak", "wood"], styles: ["mid-century", "scandinavian"], keywords: ["writing", "drawer", "legs", "home office"] },
  "desk-2": { colors: ["white", "black"], materials: ["metal", "laminate"], styles: ["modern", "industrial"], keywords: ["standing", "adjustable", "height", "office"] },
  "desk-3": { colors: ["white", "light wood"], materials: ["wood"], styles: ["minimalist", "compact"], keywords: ["wall-mounted", "floating", "small", "shelf"] },
  "chair-1": { colors: ["green", "beige"], materials: ["fabric", "wood"], styles: ["mid-century", "modern"], keywords: ["lounge", "armchair", "armrests", "cushion"] },
  "chair-2": { colors: ["brown", "wood"], materials: ["wood"], styles: ["scandinavian", "traditional"], keywords: ["dining", "backrest", "legs", "simple"] },
  "chair-3": { colors: ["black"], materials: ["mesh", "metal", "plastic"], styles: ["modern", "ergonomic"], keywords: ["office", "wheels", "swivel", "adjustable"] },
  "table-1": { colors: ["brown", "wood"], materials: ["wood"], styles: ["modern", "scandinavian"], keywords: ["round", "dining", "pedestal"] },
  "table-2": { colors: ["walnut", "brown", "dark wood"], materials: ["walnut", "wood"], styles: ["mid-century", "modern"], keywords: ["coffee", "rectangular", "low", "living room"] },
  "table-3": { colors: ["black", "brown"], materials: ["wood", "metal"], styles: ["modern", "minimalist"], keywords: ["side", "small", "round", "tapered legs"] },
  "ikea-kivik-80519531": { colors: ["black"], materials: ["leather", "faux leather"], styles: ["modern", "traditional"], keywords: ["three-seat", "armrests", "deep seat", "cushions"] },
  "ikea-uppland-19384116": { colors: ["white"], materials: ["fabric"], styles: ["modern", "scandinavian"], keywords: ["three-seat", "armrests", "cushions", "slipcover"] },
  "ikea-micke-80213074": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "modern"], keywords: ["writing", "drawer", "storage", "home office"] },
  "ikea-micke-30213076": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "compact"], keywords: ["writing", "drawer", "small", "home office"] },
  "ikea-lack-30449908": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "scandinavian"], keywords: ["side", "square", "small", "legs"] },
  "ikea-lack-90449905": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "scandinavian"], keywords: ["coffee", "rectangular", "low", "shelf"] },
};
