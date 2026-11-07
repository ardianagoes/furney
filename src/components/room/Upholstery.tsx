// Adapted from Angelo @ 2e91b68dd8b1dc453d51cd27b7f84b4347298762.
import { useEffect, useMemo } from "react";
import { DataTexture, RedFormat, RepeatWrapping, BoxGeometry } from "three";
import type { SeatingAppearance } from "../../lib/room";

/** Local deterministic microtexture, not a network image or measured product detail. */
export function useUpholstery(kind: SeatingAppearance["upholstery"]) {
  const texture = useMemo(() => {
    const size = 64, data = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const noise = ((x * 73 + y * 151 + x * y * 17) % 47) / 47;
      data[y * size + x] = Math.round(110 + noise * 30 + (kind === "woven" ? ((x % 4 < 2) !== (y % 4 < 2) ? 35 : -35) : 0));
    }
    const map = new DataTexture(data, size, size, RedFormat);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(12, 12);
    map.needsUpdate = true;
    return map;
  }, [kind]);
  useEffect(() => () => texture.dispose(), [texture]);
  return {
    bumpMap: kind ? texture : null,
    bumpScale: kind === "woven" ? 0.0012 : 0.0004,
    roughness: kind === "leather" ? 0.48 : kind === "velvet" ? 0.85 : 0.96,
  };
}

export function SlopedArm({ width, height, depth, color, material }: {
  width: number; height: number; depth: number; color: string;
  material: ReturnType<typeof useUpholstery>;
}) {
  const geometry = useMemo(() => {
    const box = new BoxGeometry(width, height, depth);
    const positions = box.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      if (positions.getY(i) > 0) positions.setY(i, height / 2 - height * 0.24 * (positions.getZ(i) / depth + 0.5));
    }
    positions.needsUpdate = true;
    box.computeVertexNormals();
    return box;
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="sloped-arm" geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} {...material} /></mesh>;
}
