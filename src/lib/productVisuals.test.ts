import { describe, expect, it } from 'vitest';
import { furnitureProducts } from '../data/furnitureProducts';
import { toSceneItem } from './plannerAdapter';

const visual = (id: string) => {
  const product = furnitureProducts.find(p => p.id === id)!;
  return toSceneItem({ instanceId: id, productId: id, xM: 2, zM: 2, rotationDeg: 0 }, product, { widthM: 4, depthM: 4, heightM: 3 });
};

describe('catalog-derived illustrative appearances', () => {
  it('distinguishes neutral, rust, grey, white, and leather sofas without altering their dimensions', () => {
    const ids = ['ikea-kivik-80519531', 'ikea-morabo-89318321', 'ikea-morabo-39575884', 'ikea-uppland-19384116', 'ikea-kivik-80519531'];
    expect(new Set(ids.map(id => visual(id).color)).size).toBe(3);
    expect(visual('ikea-morabo-89318321').appearance).toMatchObject({ seats: 2, legShape: 'tapered', armProfile: 'rectangular' });
    expect(visual('ikea-morabo-39575884').appearance).toMatchObject({ chaise: 'right', regularDepth: 0.58 });
    expect(visual('ikea-uppland-19384116').appearance?.arms).toBe('rolled');
    expect(visual('ikea-kivik-80519531').appearance?.upholstery).toBe('leather');
  });
  it('uses appropriate chair, desk, table and bed silhouettes from descriptors', () => {
    expect(visual('ikea-poaeng-59305928')).toMatchObject({ type: 'armchair', color: '#c6b9a5', appearance: { legs: 'wood', legShape: 'sled' } });
    expect(visual('ikea-lisabo-00457235')).toMatchObject({ type: 'chair', structure: { backStyle: 'solid' } });
    expect(visual('ikea-strandmon-90359829').appearance?.arms).toBe('rolled');
    expect(visual('ikea-trotten-79621921').structure?.variant).toBeUndefined();
    expect(visual('ikea-lagkapten-89521695').structure?.drawers).toBe(1);
    expect(visual('ikea-lisabo-40416498').structure).toMatchObject({ topShape: 'round', supports: 'fourLegs' });
    expect(visual('ikea-lisabo-50416501').structure).toMatchObject({ topShape: 'round', legStyle: 'tapered' });
    expect(visual('ikea-malm-19931605').structure?.headboard).toBe('solid');
  });
});
