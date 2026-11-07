// Updated from Shreya's furniture attributes @ ecd9f15fedd90da6946b91a8a8e47d326123826a.
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
  "sofa-1": { colors: ["beige", "greige", "cream"], materials: ["fabric"], styles: ["modern", "minimalist"], keywords: ["three-seat", "armrests", "cushions", "straight"] },
  "sofa-2": { colors: ["rust", "terracotta", "burnt orange"], materials: ["fabric"], styles: ["modern", "mid-century"], keywords: ["loveseat", "two-seat", "small", "armrests", "curved arms", "upholstered", "wooden legs", "compact"] },
  "sofa-3": { colors: ["grey", "gray"], materials: ["fabric"], styles: ["modern", "scandinavian"], keywords: ["sectional", "corner", "l-shaped", "large"] },
  "bed-1": { colors: ["brown", "wood"], materials: ["wood"], styles: ["modern", "minimalist"], keywords: ["platform", "queen", "low", "headboard"] },
  "bed-2": { colors: ["beige", "taupe", "cream"], materials: ["fabric", "upholstered"], styles: ["modern", "contemporary"], keywords: ["king", "upholstered", "headboard", "tall", "vertical channels", "upholstered headboard", "padded frame", "low base"] },
  "bed-3": { colors: ["natural", "light wood", "pine"], materials: ["pine", "wood"], styles: ["scandinavian", "rustic"], keywords: ["daybed", "twin", "rails", "small"] },
  "desk-1": { colors: ["oak", "light wood", "brown"], materials: ["oak", "wood"], styles: ["mid-century", "scandinavian"], keywords: ["writing", "drawer", "legs", "home office"] },
  "desk-2": { colors: ["light brown", "natural wood", "black"], materials: ["metal", "wood-look surface"], styles: ["modern", "industrial"], keywords: ["standing", "adjustable", "height", "office", "sit-stand", "telescopic legs", "T-shaped feet", "control panel"] },
  "desk-3": { colors: ["light brown", "natural wood"], materials: ["wood"], styles: ["minimalist"], keywords: ["wall-mounted", "floating", "small", "shelf", "writing", "open cubby", "rectangular worktop", "compact"] },
  "chair-1": { colors: ["cream", "beige", "off-white"], materials: ["fabric", "boucle", "wood"], styles: ["mid-century", "modern"], keywords: ["lounge", "armchair", "armrests", "cushion", "upholstered", "rounded back", "tapered wooden legs", "textured upholstery"] },
  "chair-2": { colors: ["brown", "wood"], materials: ["wood"], styles: ["scandinavian", "traditional"], keywords: ["dining", "backrest", "legs", "simple"] },
  "chair-3": { colors: ["black"], materials: ["mesh", "metal", "plastic"], styles: ["modern", "ergonomic"], keywords: ["office", "wheels", "swivel", "adjustable"] },
  "table-1": { colors: ["brown", "wood"], materials: ["wood"], styles: ["modern", "scandinavian"], keywords: ["round", "dining", "pedestal"] },
  "table-2": { colors: ["walnut", "brown", "dark wood"], materials: ["walnut", "wood"], styles: ["mid-century", "modern"], keywords: ["coffee", "rectangular", "low", "living room"] },
  "table-3": { colors: ["brown", "honey brown"], materials: ["wood"], styles: ["modern", "minimalist"], keywords: ["side", "small", "round", "tapered legs", "three legs", "splayed legs", "wood grain"] },
  "ikea-kivik-80519531": { colors: ["black"], materials: ["leather", "faux leather"], styles: ["modern", "traditional"], keywords: ["three-seat", "armrests", "deep seat", "cushions"] },
  "ikea-uppland-19384116": { colors: ["white"], materials: ["fabric"], styles: ["modern", "scandinavian"], keywords: ["three-seat", "armrests", "cushions", "slipcover"] },
  "ikea-micke-80213074": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "modern"], keywords: ["writing", "drawer", "storage", "home office"] },
  "ikea-micke-30213076": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "compact"], keywords: ["writing", "drawer", "small", "home office"] },
  "ikea-lack-30449908": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "scandinavian"], keywords: ["side", "square", "small", "legs"] },
  "ikea-lack-90449905": { colors: ["white"], materials: ["laminate", "particleboard"], styles: ["minimalist", "scandinavian"], keywords: ["coffee", "rectangular", "low", "shelf"] },
};
