// Adapted from Angelo's roomfit-furnish-finder @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
import { RoundedBox } from "@react-three/drei";
import type { SceneItem } from "../../lib/room";

export function SeatingMesh({ item }: { item: SceneItem }) {
  const a = item.appearance;
  if (!a) return null;
  const { w, d, h, color } = item;
  const radius = Math.min(w, d, h) * a.softness;
  const seatTop = h * a.seatHeight;
  const cushionH = h * 0.14;
  // Independently extracted appearance fractions can conflict; retain a positive base.
  const leg = h * Math.max(0, Math.min(a.legHeight, a.seatHeight - 0.14 - 0.06));
  const backD = d * a.backDepth;
  const armW = a.arms === "none" ? 0 : w * (a.arms === "slim" ? 0.07 : 0.14);
  const innerW = w - armW * 2;
  const seatD = d - backD;
  const block = (key: string, p: [number, number, number], s: [number, number, number], c = color, round = radius) => <RoundedBox key={key} position={p} args={s} radius={Math.min(round, ...s.map((v) => v * 0.45))} smoothness={4} castShadow receiveShadow><meshStandardMaterial color={c} roughness={0.96} /></RoundedBox>;
  return <group>
    {block("base", [0, leg + (seatTop - cushionH - leg) / 2, 0], [w - armW, Math.max(h * 0.06, seatTop - cushionH - leg), d])}
    {block("back support", [0, seatTop - cushionH / 2, -d / 2 + backD / 2], [innerW, cushionH * 1.3, backD], color, radius * 0.4)}
    {Array.from({ length: a.seats }, (_, i) => {
      const width = innerW / a.seats;
      const chaise = (a.chaise === "left" && i === 0) || (a.chaise === "right" && i === a.seats - 1);
      const depth = chaise || a.chaise === "none" ? seatD : seatD * 0.7;
      return block(`seat${i}`, [-innerW / 2 + width * (i + 0.5), seatTop - cushionH / 2, -d / 2 + backD + depth / 2], [width - w * 0.006, cushionH, depth]);
    })}
    {Array.from({ length: a.back === "single" ? 1 : a.seats }, (_, i) => {
      const count = a.back === "single" ? 1 : a.seats;
      return block(`back${i}`, [-innerW / 2 + innerW / count * (i + 0.5), (seatTop + h) / 2, -d / 2 + backD / 2], [innerW / count - w * 0.006, h - seatTop, backD]);
    })}
    {a.arms !== "none" && [-1, 1].map((side) => {
      const armTop = Math.max(leg + h * 0.06, Math.min(h, h * a.armHeight));
      return block(`arm${side}`, [side * (w - armW) / 2, (leg + armTop) / 2, 0], [armW, armTop - leg, d], color, a.arms === "rolled" ? armW * 0.44 : radius);
    })}
    {a.legs !== "hidden" && [-1, 1].flatMap((x) => [-1, 1].map((z) => block(`leg${x}${z}`, [x * w * 0.4, leg / 2, z * d * 0.38], [w * 0.035, leg, d * 0.035], a.legs === "metal" ? "#343432" : "#785538", 0.004)))}
  </group>;
}
