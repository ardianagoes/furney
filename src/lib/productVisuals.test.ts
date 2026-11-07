import { describe, expect, it } from 'vitest';
import { furnitureProducts } from '../data/furnitureProducts';
import { toSceneItem } from './plannerAdapter';

const visual = (id: string) => {
  const product = furnitureProducts.find(p => p.id === id)!;
  return toSceneItem({ instanceId: id, productId: id, xM: 2, zM: 2, rotationDeg: 0 }, product, { widthM: 4, depthM: 4, heightM: 3 });
};

describe('catalog-derived illustrative appearances', () => {
  it('distinguishes neutral, rust, grey, white, and leather sofas without altering their dimensions', () => {
    const ids = ['sofa-1', 'sofa-2', 'sofa-3', 'ikea-uppland-19384116', 'ikea-kivik-80519531'];
    expect(new Set(ids.map(id => visual(id).color)).size).toBe(5);
    expect(visual('sofa-2').appearance).toMatchObject({ seats: 2, legShape: 'tapered', armProfile: 'sloped' });
    expect(visual('sofa-3').appearance).toMatchObject({ chaise: 'right', regularDepth: 0.54 });
    expect(visual('ikea-uppland-19384116').appearance?.arms).toBe('rolled');
    expect(visual('ikea-kivik-80519531').appearance?.upholstery).toBe('leather');
  });
  it('uses appropriate chair, desk, table and bed silhouettes from descriptors', () => {
    expect(visual('chair-1')).toMatchObject({ type: 'armchair', color: '#e3d9c4', appearance: { legs: 'wood', legShape: 'splayed' } });
    expect(visual('chair-2')).toMatchObject({ type: 'chair', structure: { backStyle: 'slatted' } });
    expect(visual('chair-3').structure?.variant).toBe('office');
    expect(visual('desk-2').structure?.variant).toBe('standing');
    expect(visual('desk-3').structure?.variant).toBe('wall');
    expect(visual('table-1').structure).toMatchObject({ topShape: 'round', supports: 'pedestal' });
    expect(visual('table-3').structure).toMatchObject({ topShape: 'round', legCount: 3 });
    expect(visual('bed-2').structure?.headboard).toBe('upholstered');
  });
});
