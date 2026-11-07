import { furnitureAttributes } from '../data/furnitureAttributes';
import type { FurnitureProduct } from '../types';
import type { FurnitureType, SceneItem, SeatingAppearance, StructuralAppearance } from './room';

// Illustrative visual traits only: no second product catalog, dimensions, or prices.
// Angelo's appearance/shape primitives are driven by Shreya's existing descriptors.
const palette: Record<string, string> = {
  beige: '#c6b9a5', greige: '#bdb5a9', cream: '#e3d9c4', 'off-white': '#e6dfd0',
  white: '#eeeae2', rust: '#ae5635', terracotta: '#ae5635', grey: '#999c9b', gray: '#999c9b',
  black: '#303130', brown: '#946b46', wood: '#a57c50', natural: '#c7a67b',
  oak: '#b99462', walnut: '#76523a', 'light brown': '#c1a379', 'honey brown': '#ad804b',
};
const seating: SeatingAppearance = {
  arms: 'slim', seats: 3, back: 'split', legs: 'wood', legHeight: 0.1,
  seatHeight: 0.52, armHeight: 0.73, backDepth: 0.2, softness: 0.08,
  chaise: 'none', legShape: 'tapered', upholstery: 'woven', cushionHeight: 0.16,
};
const seatingTraits: Record<string, Partial<SeatingAppearance>> = {
  'sofa-1': { seats: 3, arms: 'wide', legHeight: 0.07, silhouette: 'boxy', armProfile: 'rectangular' },
  'sofa-2': { seats: 2, back: 'single', silhouette: 'rounded', armProfile: 'sloped', legHeight: 0.2, armHeight: 0.79, softness: 0.13, backSlope: 0.04 },
  'sofa-3': { seats: 3, legs: 'hidden', legHeight: 0.03, chaise: 'right', regularDepth: 0.54, silhouette: 'boxy', armProfile: 'rectangular', armWidth: 0.065, backDepth: 0.13 },
  'chair-1': { seats: 1, back: 'single', arms: 'slim', armProfile: 'rounded', silhouette: 'plush', softness: 0.16, legHeight: 0.23, legShape: 'splayed', armHeight: 0.64, seatCushion: 'bench' },
  'ikea-kivik-80519531': { seats: 3, arms: 'wide', armHeight: 0.62, legHeight: 0.035, legs: 'hidden', silhouette: 'boxy', upholstery: 'leather' },
  'ikea-uppland-19384116': { seats: 3, arms: 'rolled', armProfile: 'rolled', legHeight: 0.06, legs: 'hidden', silhouette: 'plush', softness: 0.12 },
};

export function productVisuals(product: FurnitureProduct, type: FurnitureType, fallback: string): Pick<SceneItem, 'color' | 'appearance' | 'structure'> {
  const attrs = furnitureAttributes[product.id];
  const color = attrs?.colors.map(value => palette[value]).find(Boolean) ?? fallback;
  const traits = [...(attrs?.keywords ?? []), product.title.toLowerCase()].join(' ').toLowerCase();
  if (type === 'sofa' || type === 'armchair') return {
    color,
    appearance: { ...seating, ...(type === 'armchair' ? { seats: 1, back: 'single' as const } : {}), ...seatingTraits[product.id] },
  };
  const structure: StructuralAppearance = {
    material: attrs?.materials.includes('metal') ? 'metal' : attrs?.materials.includes('laminate') ? 'painted' : 'wood',
    legStyle: /tapered/.test(traits) ? 'tapered' : /splayed/.test(traits) ? 'splayed' : 'straight',
  };
  if (type === 'chair') Object.assign(structure, {
    backStyle: /dining/.test(traits) ? 'slatted' : 'solid',
    ...(/office|wheels|swivel/.test(traits) ? { variant: 'office', material: 'metal' } : {}),
  });
  if (type === 'table' || type === 'coffeeTable') Object.assign(structure, {
    topShape: /round/.test(traits) ? 'round' : 'rectangular',
    supports: /pedestal/.test(traits) ? 'pedestal' : 'fourLegs',
    ...(/three legs/.test(traits) ? { legCount: 3, legStyle: 'splayed' } : {}),
    ...(/coffee/.test(traits) && /shelf/.test(traits) ? { lowerShelf: true } : {}),
  });
  if (type === 'desk') Object.assign(structure, {
    drawers: /drawer/.test(traits) ? 1 : 0,
    ...(/standing|sit-stand/.test(traits) ? { variant: 'standing', material: 'wood' } : {}),
    ...(/wall-mounted|floating/.test(traits) ? { variant: 'wall' } : {}),
    ...(/micke/.test(traits) ? { supports: 'panels' } : {}),
  });
  if (type === 'bed') Object.assign(structure, {
    headboard: /upholstered/.test(traits) ? 'upholstered' : /rails|daybed/.test(traits) ? 'slatted' : 'solid',
    ...(/daybed/.test(traits) ? { variant: 'daybed' } : {}),
  });
  return { color, structure };
}
