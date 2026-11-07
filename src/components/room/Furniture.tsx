// Adapted from Angelo's roomfit-furnish-finder @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
import type { SceneItem } from "../../lib/room";
import { SeatingMesh } from "./SeatingMesh";
import { DimensionedFurniture } from "./DimensionedFurniture";

function B({ p, s, c, r = 0.6 }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} />
    </mesh>
  );
}

const LEG = "#3a2c22";

/** Procedural furniture built in its own local space, origin at floor center. */
export function FurnitureMesh({ item }: { item: SceneItem }) {
  return <DimensionedFurniture w={item.w} d={item.d} h={item.h}><FurnitureParts item={item} /></DimensionedFurniture>;
}

function FurnitureParts({ item }: { item: SceneItem }) {
  const { w, d, h, color: c } = item;
  if ((item.type === "sofa" || item.type === "armchair") && item.appearance) return <SeatingMesh item={item} />;
  switch (item.type) {
    case "box":
      return <B p={[0, h / 2, 0]} s={[w, h, d]} c={c} />;
    case "cabinet": {
      const leg = Math.min(0.1, h * 0.12);
      const doors = Math.max(1, Math.round(w / 0.6));
      return <group>
        <B p={[0, (h + leg) / 2, 0]} s={[w, h - leg, d - 0.02]} c={c} />
        {Array.from({ length: doors }, (_, i) => <B key={i} p={[-w / 2 + (i + 0.5) * w / doors, (h + leg) / 2, d / 2 - 0.01]} s={[w / doors - 0.004, h - leg - 0.004, 0.02]} c={c} r={0.8} />)}
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => <B key={`${x}${z}`} p={[x * (w / 2 - 0.04), leg / 2, z * (d / 2 - 0.04)]} s={[0.04, leg, 0.04]} c={c} />))}
      </group>;
    }
    case "sofa":
      return (
        <group scale={[w, h, d]}>
          <B p={[0, 0.3, 0]} s={[1, 0.36, 1]} c={c} r={0.9} />
          <B p={[0, 0.7, -0.39]} s={[1, 0.6, 0.22]} c={c} r={0.9} />
          <B p={[-0.45, 0.53, 0]} s={[0.1, 0.54, 1]} c={c} r={0.9} />
          <B p={[0.45, 0.53, 0]} s={[0.1, 0.54, 1]} c={c} r={0.9} />
          <B p={[-0.2, 0.54, 0.06]} s={[0.38, 0.14, 0.72]} c={c} r={1} />
          <B p={[0.2, 0.54, 0.06]} s={[0.38, 0.14, 0.72]} c={c} r={1} />
          <B p={[0, 0.06, 0]} s={[0.95, 0.12, 0.9]} c={LEG} />
        </group>
      );
    case "armchair":
      return (
        <group>
          <B p={[0, 0.3, 0]} s={[w, 0.25, d]} c={c} r={0.9} />
          <B p={[0, h * 0.62, -d / 2 + 0.09]} s={[w, h * 0.55, 0.18]} c={c} r={0.9} />
          <B p={[-w / 2 + 0.08, 0.5, 0]} s={[0.16, 0.35, d]} c={c} r={0.9} />
          <B p={[w / 2 - 0.08, 0.5, 0]} s={[0.16, 0.35, d]} c={c} r={0.9} />
          {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
            <B key={`${sx}${sz}`} p={[sx * (w / 2 - 0.08), 0.09, sz * (d / 2 - 0.08)]} s={[0.05, 0.18, 0.05]} c={LEG} />
          )))}
        </group>
      );
    case "coffeeTable":
    case "desk":
      return (
        <group>
          <B p={[0, h - 0.025, 0]} s={[w, 0.05, d]} c={c} r={0.4} />
          {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
            <B key={`${sx}${sz}`} p={[sx * (w / 2 - 0.06), (h - 0.05) / 2, sz * (d / 2 - 0.06)]} s={[0.05, h - 0.05, 0.05]} c={LEG} />
          )))}
        </group>
      );
    case "bed":
      return (
        <group>
          <B p={[0, 0.17, 0]} s={[w, 0.3, d]} c="#6b4a33" />
          <B p={[0, 0.42, 0.05]} s={[w - 0.06, 0.22, d - 0.12]} c="#f3eee6" r={1} />
          <B p={[0, 0.55, 0.3]} s={[w - 0.04, 0.06, d * 0.6]} c={c} r={1} />
          <B p={[-w / 4, 0.6, -d / 2 + 0.3]} s={[w / 2 - 0.15, 0.14, 0.35]} c="#ffffff" r={1} />
          <B p={[w / 4, 0.6, -d / 2 + 0.3]} s={[w / 2 - 0.15, 0.14, 0.35]} c="#ffffff" r={1} />
          <B p={[0, h / 2, -d / 2 + 0.04]} s={[w, h, 0.08]} c="#6b4a33" />
        </group>
      );
    case "lamp":
      return (
        <group>
          <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.16, 0.18, 0.04, 24]} /><meshStandardMaterial color={c} metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.015, 0.015, h, 8]} /><meshStandardMaterial color={c} metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, h - 0.12, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 0.3, 24, 1, true]} /><meshStandardMaterial color="#f1e6cf" side={2} emissive="#f6d79a" emissiveIntensity={0.4} /></mesh>
        </group>
      );
    case "rug":
      return <B p={[0, h / 2, 0]} s={[w, h, d]} c={c} r={1} />;
    case "shelf":
      return (
        <group>
          <B p={[-w / 2 + 0.02, h / 2, 0]} s={[0.04, h, d]} c={c} />
          <B p={[w / 2 - 0.02, h / 2, 0]} s={[0.04, h, d]} c={c} />
          <B p={[0, h / 2, -d / 2 + 0.01]} s={[w, h, 0.02]} c={c} />
          {[0, 1, 2, 3, 4].map((i) => (
            <B key={i} p={[0, 0.02 + (i * (h - 0.04)) / 4, 0]} s={[w, 0.03, d]} c={c} />
          ))}
          {["#a8433a", "#3f5f6b", "#c9a14a", "#55704f"].map((bookColor, i) => (
            <B key={`b${i}`} p={[-w / 4 + (i % 2) * 0.2, 0.14 + (i * (h - 0.04)) / 4, 0]} s={[0.25, 0.22, d * 0.7]} c={bookColor} r={0.8} />
          ))}
        </group>
      );
  }
}
