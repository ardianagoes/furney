import { describe, expect, it } from 'vitest';
import { fitsInRoom, footprint, itemProblems, overlaps, type SceneItem } from './room';

const room = { width: 4, depth: 3, height: 2.5 };
const sofa: SceneItem = { id: 'sofa', label: 'Sofa', type: 'sofa', x: 0, z: 0, rot: 0, w: 2, d: 1, h: 1, color: '#889977' };

describe('Angelo fit rules', () => {
  it('checks footprint extents and height, with exact wall contact permitted', () => {
    expect(fitsInRoom({ ...sofa, x: 1, z: 1 }, room)).toBe(true);
    expect(fitsInRoom({ ...sofa, x: 1.001 }, room)).toBe(false);
    expect(fitsInRoom({ ...sofa, z: -1.001 }, room)).toBe(false);
    expect(fitsInRoom({ ...sofa, h: 2.501 }, room)).toBe(false);
  });
  it.each([0, 90, 180, 270] as const)('checks the footprint at %s°', rot => {
    const turned = { ...sofa, rot, w: 3.5, d: 1 };
    expect(footprint(turned)).toEqual(rot === 90 || rot === 270 ? { w: 1, d: 3.5 } : { w: 3.5, d: 1 });
    expect(fitsInRoom(turned, room)).toBe(rot === 0 || rot === 180);
  });
  it('detects overlap but permits edge touching and items on rugs', () => {
    const other = { ...sofa, id: 'other', label: 'Other piece' };
    expect(overlaps(sofa, other)).toBe(true);
    expect(overlaps(sofa, { ...other, x: 2 })).toBe(false);
    expect(overlaps(sofa, { ...other, z: 1 })).toBe(false);
    expect(overlaps(sofa, { ...other, type: 'rug' })).toBe(false);
    expect(itemProblems(sofa, [sofa, other], room)).toEqual(['Overlaps Other piece']);
  });
  it('reports room resizing, oversized products, and overlapping items together', () => {
    const other = { ...sofa, id: 'other', label: 'Other piece' };
    expect(itemProblems(sofa, [sofa, other], { width: 1, depth: 1, height: 0.5 })).toEqual(['Outside room bounds', 'Overlaps Other piece']);
  });
});
