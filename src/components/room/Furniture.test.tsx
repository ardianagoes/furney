// @vitest-environment jsdom
// Based on Angelo's furniture-bounds tests; real R3F geometry, no GPU required.
import { createElement, useLayoutEffect, useMemo } from 'react';
import { describe, expect, it } from 'vitest';
import { createRoot, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Box3, Group, Vector3 } from 'three';
import { FurnitureMesh } from './Furniture';
import type { FurnitureType, SceneItem } from '../../lib/room';
import { furnitureGeometryBounds } from '../../lib/furniture-bounds';
import { furnitureProducts } from '../../data/furnitureProducts';
import { toSceneItem } from '../../lib/plannerAdapter';

extend({ Group: THREE.Group, Mesh: THREE.Mesh, BoxGeometry: THREE.BoxGeometry, CylinderGeometry: THREE.CylinderGeometry, ExtrudeGeometry: THREE.ExtrudeGeometry, MeshStandardMaterial: THREE.MeshStandardMaterial });

async function renderFurniture(item: SceneItem) {
  const canvas = document.createElement('canvas');
  const root = createRoot(canvas);
  const renderer = { render: () => {}, setSize: () => {}, setPixelRatio: () => {}, dispose: () => {}, forceContextLoss: () => {}, renderLists: { dispose: () => {} }, xr: { enabled: false, isPresenting: false, addEventListener: () => {}, removeEventListener: () => {} }, shadowMap: {}, domElement: canvas };
  await root.configure({ gl: renderer as never, frameloop: 'never', size: { width: 640, height: 480, top: 0, left: 0 } });
  const group = await new Promise<Group>(resolve => {
    function Probe() {
      const parent = useMemo(() => new Group(), []);
      useLayoutEffect(() => { resolve(parent); }, [parent]);
      return createElement('primitive', { object: parent }, createElement(FurnitureMesh, { item }));
    }
    root.render(createElement(Probe));
  });
  return { group, cleanup: () => root.unmount() };
}

describe('dimensioned procedural geometry', () => {
  it.each(furnitureProducts)('preserves actual $title dimensions with its product-specific geometry', async product => {
    const item = toSceneItem({ instanceId: 'piece', productId: product.id, xM: 2, zM: 2, rotationDeg: 0 }, product, { widthM: 4, depthM: 4, heightM: 3 });
    const { group, cleanup } = await renderFurniture(item);
    try {
      const bounds = new Box3().setFromObject(group, true);
      const size = bounds.getSize(new Vector3());
      expect(size.x).toBeCloseTo(product.widthM, 5);
      expect(size.z).toBeCloseTo(product.depthM, 5);
      expect(size.y).toBeCloseTo(product.heightM, 5);
      expect(bounds.min.y).toBeCloseTo(0, 5);
      // Test real named mesh features, not merely adapter metadata.
      const features: Record<string, string> = {
        "ikea-morabo-39575884": "seat2", "ikea-strandmon-90359829": "arm-roll1",
        "ikea-lisabo-00457235": "chair-back", "ikea-lisabo-40416498": "shape-top",
        "ikea-neiden-59248607": "headboard-slat-0", "ikea-malm-19931605": "shape-headboard",
        "ikea-uppland-19384116": "arm-roll1",
      };
      if (features[product.id]) expect(group.getObjectByName(features[product.id])).toBeTruthy();
      group.rotation.y = Math.PI / 2;
      const rotated = new Box3().setFromObject(group, true).getSize(new Vector3());
      expect(rotated.x).toBeCloseTo(product.depthM, 5);
      expect(rotated.z).toBeCloseTo(product.widthM, 5);
    } finally { cleanup(); }
  });

  it.each(['sofa', 'armchair', 'bed', 'desk', 'coffeeTable', 'lamp', 'rug', 'shelf', 'box'] as FurnitureType[])('normalizes the complete %s mesh to catalog width/depth/height and floor origin', async type => {
    const item: SceneItem = { id: 'piece', label: 'Test piece', type, x: 0, z: 0, rot: 0, w: 1.23, d: 0.76, h: type === 'rug' ? 0.02 : 0.93, color: '#889977' };
    const { group, cleanup } = await renderFurniture(item);
    try {
      const bounds = new Box3().setFromObject(group, true);
      const size = bounds.getSize(new Vector3());
      expect(size.x).toBeCloseTo(item.w, 5);
      expect(size.y).toBeCloseTo(item.h, 5);
      expect(size.z).toBeCloseTo(item.d, 5);
      expect(bounds.min.y).toBeCloseTo(0, 5);
      expect(bounds.min.x).toBeCloseTo(-item.w / 2, 5);
      expect(bounds.min.z).toBeCloseTo(-item.d / 2, 5);
      group.position.set(4, 0, -2);
      group.rotation.y = Math.PI / 2;
      const local = furnitureGeometryBounds(group).getSize(new Vector3());
      expect(local.x).toBeCloseTo(item.w, 5);
      expect(local.z).toBeCloseTo(item.d, 5);
      const world = new Box3().setFromObject(group, true).getSize(new Vector3());
      expect(world.x).toBeCloseTo(item.d, 5);
      expect(world.z).toBeCloseTo(item.w, 5);
    } finally { cleanup(); }
  });
});
