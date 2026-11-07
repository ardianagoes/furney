// Adapted from Angelo @ 2e91b68dd8b1dc453d51cd27b7f84b4347298762.
import { RoundedBox } from "@react-three/drei";
import type { SceneItem } from "../../lib/room";
import { SlopedArm, useUpholstery } from "./Upholstery";

export function SeatingMesh({ item }: { item: SceneItem }) {
  const a = item.appearance;
  const material = useUpholstery(a?.upholstery);
  if (!a) return null;
  const { w, d, h, color } = item;
  const radius = Math.min(w, d, h) * Math.min(a.softness, a.silhouette === "boxy" ? 0.025 : 0.15);
  const seatTop = h * a.seatHeight;
  const cushionH = h * (a.cushionHeight ?? 0.14);
  // Independently extracted appearance fractions can conflict; retain a positive base.
  const leg = h * Math.max(0, Math.min(a.legHeight, a.seatHeight - cushionH / h - 0.06));
  const backD = d * a.backDepth;
  const armW = a.arms === "none" ? 0 : w * (a.armWidth ?? (a.arms === "slim" ? 0.07 : 0.14));
  const innerW = w - armW * 2;
  const seatD = d - backD;
  const baseH = Math.max(h * 0.06, seatTop - cushionH - leg);
  const regularD = a.chaise === "none" ? d : Math.max(backD + d * 0.1, d * (a.regularDepth ?? 0.7));
  const sections = a.chaise === "none" && a.seatCushion === "bench" ? 1 : a.seats;
  // Local +X is the left side for a viewer facing the front (+Z).
  const isChaise = (i: number) => (a.chaise === "left" && i === sections - 1) || (a.chaise === "right" && i === 0);
  const sectionDepth = (i: number) => isChaise(i) ? d : regularD;
  const legWidth = Math.min(w, d) * (a.legThickness ?? (a.legs === "metal" ? 0.018 : 0.04));
  const block = (key: string, p: [number, number, number], s: [number, number, number], c = color, round = radius) => <RoundedBox key={key} name={key} position={p} args={s} radius={Math.min(round, ...s.map((v) => v * 0.45))} smoothness={4} castShadow receiveShadow><meshStandardMaterial color={c} {...material} /></RoundedBox>;
  return <group>
    {Array.from({ length: sections }, (_, i) => {
      const width = innerW / sections;
      const depth = sectionDepth(i);
      return block(`base${i}`, [-innerW / 2 + width * (i + 0.5), leg + baseH / 2, -d / 2 + depth / 2], [width, baseH, depth]);
    })}
    {block("back support", [0, seatTop - cushionH / 2, -d / 2 + backD / 2], [innerW, cushionH * 1.3, backD], color, radius * 0.4)}
    {Array.from({ length: sections }, (_, i) => {
      const width = innerW / sections;
      const depth = Math.min(seatD, sectionDepth(i) - backD);
      return block(`seat${i}`, [-innerW / 2 + width * (i + 0.5), seatTop - cushionH / 2, -d / 2 + backD + depth / 2], [width - w * 0.006, cushionH, depth]);
    })}
    {Array.from({ length: a.back === "single" ? 1 : a.backCushions ?? a.seats }, (_, i) => {
      const count = a.back === "single" ? 1 : a.backCushions ?? a.seats;
      const width = innerW / count;
      const backH = Math.min(h - seatTop, h * (a.backHeight ?? 1));
      const slope = Math.atan2(d * (a.backSlope ?? 0), backH);
      return <group key={`back${i}`} position={[-innerW / 2 + width * (i + 0.5), seatTop, -d / 2 + backD / 2]} rotation={[-slope, 0, 0]}>
        {a.back === "tufted" ? Array.from({ length: 6 }, (_, cell) => {
          const col = cell % 3, row = Math.floor(cell / 3);
          return block(`tuft${i}-${cell}`, [(col - 1) * width / 3, (row + 0.5) * backH / 2, 0], [width / 3 - w * 0.003, backH / 2 - h * 0.004, backD], color, radius * 0.5);
        }) : block(`back${i}`, [0, backH / 2, 0], [width - w * 0.006, backH, backD])}
      </group>;
    })}
    {a.arms !== "none" && [-1, 1].map((side) => {
      const armTop = Math.max(leg + h * 0.06, Math.min(h, h * a.armHeight));
      const depth = (a.chaise === "left" && side === 1) || (a.chaise === "right" && side === -1) ? d : regularD;
      const z = -d / 2 + depth / 2;
      const profile = a.armProfile ?? (a.arms === "rolled" ? "rolled" : a.silhouette === "boxy" ? "rectangular" : "rounded");
      if (profile === "sloped") return <group key={`arm${side}`} position={[side * (w - armW) / 2, (leg + armTop) / 2, z]}><SlopedArm width={armW} height={armTop - leg} depth={depth} color={color} material={material} /></group>;
      if (profile === "rolled") return <group key={`arm${side}`}>
        {block(`arm${side}`, [side * (w - armW) / 2, (leg + armTop) / 2 - armW * 0.12, z], [armW * 0.72, Math.max(h * 0.04, armTop - leg - armW * 0.24), depth])}
        <mesh name={`arm-roll${side}`} position={[side * (w - armW) / 2, armTop - armW / 2, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><cylinderGeometry args={[armW / 2, armW / 2, depth, 24]} /><meshStandardMaterial color={color} {...material} /></mesh>
      </group>;
      return block(`arm${side}`, [side * (w - armW) / 2, (leg + armTop) / 2, z], [armW, armTop - leg, depth], color, profile === "rectangular" ? Math.min(armW * 0.06, h * 0.012) : Math.max(radius, armW * 0.22));
    })}
    {a.legs !== "hidden" && leg > 0 && [-1, 1].flatMap((x) => {
      const depth = (a.chaise === "left" && x === 1) || (a.chaise === "right" && x === -1) ? d : regularD;
      const legColor = a.legs === "metal" ? "#343432" : "#785538";
      const front = -d / 2 + depth - d * 0.08, rear = -d * 0.42;
      if (a.legShape === "sled") return [<group key={`sled${x}`}>
        {block(`rail${x}`, [x * w * 0.4, legWidth / 2, (front + rear) / 2], [legWidth, legWidth, front - rear + legWidth], legColor, 0.002)}
        {[rear, front].map((z, i) => <mesh key={i} name={`leg${x}-${i}`} position={[x * w * 0.4, leg / 2, z]} castShadow receiveShadow><boxGeometry args={[legWidth, leg, legWidth]} /><meshStandardMaterial color={legColor} metalness={a.legs === "metal" ? 0.75 : 0} roughness={0.4} /></mesh>)}
      </group>];
      return [rear, front].map((z, i) => <mesh key={`leg${x}-${i}`} name={`leg${x}-${i}`} position={[x * w * 0.4, leg / 2, z]} rotation={[a.legShape === "splayed" ? (i === 0 ? -0.16 : 0.16) : 0, 0, a.legShape === "splayed" ? x * 0.16 : 0]} castShadow receiveShadow>
        {a.legShape === "tapered" || a.legShape === "splayed" || a.legs === "metal" ? <cylinderGeometry args={[legWidth / 2, legWidth * (a.legShape === "tapered" ? 0.28 : 0.5), leg, 12]} /> : <boxGeometry args={[legWidth, leg, legWidth]} />}
        <meshStandardMaterial color={legColor} roughness={a.legs === "metal" ? 0.35 : 0.65} metalness={a.legs === "metal" ? 0.75 : 0} />
      </mesh>);
    })}
  </group>;
}
