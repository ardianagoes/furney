// Adapted from Angelo's roomfit-furnish-finder @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";
import { fitFurnitureGeometry } from "../../lib/furniture-bounds";

/** Normalize actual mesh extents, not an invisible proxy bounding box. */
export function DimensionedFurniture({ w, d, h, children }: { w: number; d: number; h: number; children: ReactNode }) {
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    if (group.current) fitFurnitureGeometry(group.current, { w, d, h });
  });
  return <group ref={group}>{children}</group>;
}
