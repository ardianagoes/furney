// Adapted from Angelo @ 2e91b68dd8b1dc453d51cd27b7f84b4347298762.
import type { SceneItem } from "../../lib/room";

/** Normalized component geometry; the outer bounds wrapper supplies confirmed dimensions. */
export function ShapeFurniture({ item }: { item: SceneItem }) {
  const a = item.structure ?? {};
  const color = item.color;
  const material = { color, roughness: a.material === "glass" ? 0.12 : 0.65, metalness: a.material === "metal" ? 0.7 : 0, transparent: a.material === "glass", opacity: a.material === "glass" ? 0.5 : 1 };
  const t = a.thickness ?? 0.055;
  const leg = a.legThickness ?? 0.055;
  const box = (name: string, p: [number, number, number], s: [number, number, number], c = color) => <mesh key={name} name={name} position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial {...material} color={c} /></mesh>;
  const surface = (name: string, y: number, height: number, shape: string, width = 1, depth = 1) => shape === "round" || shape === "oval"
    ? <mesh key={name} name={name} position={[0, y, 0]} scale={[width, 1, depth]} castShadow receiveShadow><cylinderGeometry args={[0.5, 0.5, height, 48]} /><meshStandardMaterial {...material} /></mesh>
    : box(name, [0, y, 0], [width, height, depth]);
  const supports = (height: number) => {
    if (a.legCount === 3) return <group>{[0, 1, 2].map(i => {
      const angle = i * Math.PI * 2 / 3;
      return <mesh key={i} name={`tripod-leg-${i}`} position={[Math.sin(angle) * 0.32, height / 2, Math.cos(angle) * 0.32]} rotation={[Math.cos(angle) * 0.15, 0, -Math.sin(angle) * 0.15]} castShadow receiveShadow>
        <cylinderGeometry args={[leg * 0.65, leg * 0.38, height, 12]} /><meshStandardMaterial {...material} />
      </mesh>;
    })}</group>;
    if (a.supports === "pedestal") return <group>
      {surface("pedestal-foot", t / 2, t, "round", 0.7, 0.7)}
      {surface("pedestal-column", height / 2, height, "round", leg * 2.4, leg * 2.4)}
    </group>;
    if (a.supports === "panels" || a.supports === "trestle") return <group>
      {[-1, 1].map(x => box(`support-${x}`, [x * 0.35, height / 2, 0], [a.supports === "panels" ? t : leg * 1.4, height, 0.8]))}
      {a.supports === "trestle" && box("trestle-stretcher", [0, height * 0.25, 0], [0.75, leg, leg])}
    </group>;
    return <group>
      {[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}${z}`} name={`shape-leg-${x}-${z}`} position={[x * 0.38, height / 2, z * 0.38]} rotation={a.legStyle === "splayed" ? [z * -0.12, 0, x * 0.12] : [0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[a.legStyle === "tapered" ? leg * 0.65 : leg / 2, leg / 2, height, 12]} /><meshStandardMaterial {...material} />
      </mesh>))}
      {a.supports === "sled" && [-1, 1].map(x => box(`sled-rail-${x}`, [x * 0.38, leg / 2, 0], [leg, leg, 0.85]))}
    </group>;
  };
  if (item.type === "desk" && a.variant === "wall") return <group>
    {box("floating-worktop", [0, 0.15, 0], [1, 0.3, 1])}
    {box("cubby-back", [0, 0.65, -0.45], [1, 0.7, 0.1])}
    {box("cubby-top", [0, 0.95, -0.2], [1, 0.1, 0.6])}
    {[-1, 1].map(x => box(`cubby-side-${x}`, [x * 0.47, 0.65, -0.2], [0.06, 0.7, 0.6]))}
  </group>;
  if (item.type === "desk" && a.variant === "standing") return <group>
    {surface("standing-worktop", 1 - t / 2, t, "rectangular")}
    {[-1, 1].map(x => <group key={x}>
      {box(`standing-column-${x}`, [x * 0.37, 0.5, 0], [0.07, 0.9, 0.15], "#292a29")}
      {box(`standing-sleeve-${x}`, [x * 0.37, 0.28, 0], [0.09, 0.5, 0.18], "#343534")}
      {box(`standing-foot-${x}`, [x * 0.37, 0.025, 0], [0.12, 0.05, 0.93], "#292a29")}
    </group>)}
    {box("standing-control", [0.3, 0.91, 0.4], [0.14, 0.04, 0.06], "#292a29")}
  </group>;
  if (item.type === "chair" && a.variant === "office") return <group>
    {box("office-seat", [0, 0.46, 0.02], [0.85, 0.1, 0.8])}
    {box("office-back", [0, 0.77, -0.37], [0.8, 0.46, 0.07])}
    {box("office-headrest", [0, 0.97, -0.37], [0.45, 0.06, 0.09])}
    {box("office-lift", [0, 0.24, 0], [0.08, 0.4, 0.08], "#666866")}
    {[-1, 1].map(x => <group key={x}>
      {box(`office-arm-${x}`, [x * 0.46, 0.62, 0], [0.08, 0.04, 0.6])}
      {box(`office-arm-post-${x}`, [x * 0.46, 0.53, 0], [0.04, 0.18, 0.05])}
    </group>)}
    {[0, 1, 2, 3, 4].map(i => <group key={i} rotation-y={i * Math.PI * 2 / 5}>
      {box(`office-spoke-${i}`, [0, 0.065, 0.22], [0.05, 0.045, 0.44])}
      <mesh name={`office-wheel-${i}`} position={[0, 0.035, 0.43]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.035, 0.035, 0.055, 12]} /><meshStandardMaterial {...material} /></mesh>
    </group>)}
  </group>;
  if (["table", "coffeeTable", "desk"].includes(item.type)) return <group>
    {surface("shape-top", 1 - t / 2, t, a.topShape ?? "rectangular")}
    {supports(1 - t)}
    {a.lowerShelf && surface("lower-shelf", 0.22, t, a.topShape ?? "rectangular", 0.85, 0.85)}
    {item.type === "desk" && Array.from({ length: a.drawers ?? 0 }, (_, i) => box(`desk-drawer-${i}`, [0.24, 0.83 - i * 0.14, 0.08], [0.4, 0.13, 0.7]))}
  </group>;
  if (item.type === "bed") {
    const headboard = a.headboard ?? "solid";
    const mattress = a.mattressHeight ?? 0.2;
    const bedTop = headboard === "none" ? 1 : 0.56;
    return <group>
      {box("shape-bed-frame", [0, (bedTop - mattress) / 2, 0], [1, bedTop - mattress, 1])}
      {box("shape-mattress", [0, bedTop - mattress / 2, 0.025], [0.96, mattress, 0.93], "#f0ece2")}
      {box("bed-duvet", [0, bedTop + 0.025, 0.16], [0.94, 0.05, 0.62], "#d5cdbd")}
      {[-1, 1].map(x => box(`bed-pillow-${x}`, [x * 0.23, bedTop + 0.055, -0.27], [0.41, 0.08, 0.22], "#f7f4ed"))}
      {a.variant === "daybed" && [-1, 1].map(x => box(`daybed-side-rail-${x}`, [x * 0.47, 0.7, 0], [0.06, 0.22, 1]))}
      {headboard !== "none" && headboard !== "slatted" && box("shape-headboard", [0, 0.7, -0.47], [1, 0.6, 0.06])}
      {headboard === "slatted" && <group>
        {[-1, 1].map(x => box(`headboard-post-${x}`, [x * 0.47, 0.7, -0.47], [0.06, 0.6, 0.06]))}
        {box("headboard-top-rail", [0, 0.97, -0.47], [1, 0.06, 0.06])}
      </group>}
      {headboard === "slatted" && Array.from({ length: 6 }, (_, i) => box(`headboard-slat-${i}`, [-0.42 + i * 0.168, 0.76, -0.425], [0.055, 0.43, 0.025]))}
      {headboard === "upholstered" && Array.from({ length: 4 }, (_, i) => box(`headboard-pad-${i}`, [-0.375 + i * 0.25, 0.73, -0.42], [0.24, 0.5, 0.06]))}
    </group>;
  }
  const back = a.backStyle ?? (item.type === "stool" ? "none" : "solid");
  const level = back === "none" ? 1 : (a.seatLevel ?? 0.53);
  const seatT = t;
  const legH = level - seatT;
  return <group>
    {surface("shape-seat", level - seatT / 2, seatT, a.seatShape ?? "rectangular")}
    {supports(legH)}
    {back === "solid" && box("chair-back", [0, (1 + level) / 2, -0.46], [0.9, 1 - level, 0.08])}
    {back === "slatted" && <group>
      {[-1, 1].map(x => box(`back-post-${x}`, [x * 0.44, (1 + level) / 2, -0.46], [leg, 1 - level, leg]))}
      {box("back-top-rail", [0, 0.97, -0.46], [0.94, 0.06, 0.08])}
      {Array.from({ length: 4 }, (_, i) => box(`back-slat-${i}`, [-0.3 + i * 0.2, (1 + level) / 2, -0.46], [0.045, 1 - level - 0.06, 0.05]))}
    </group>}
    {item.appearance && item.appearance.arms !== "none" && [-1, 1].map(x => <group key={x}>
      {box(`chair-arm-${x}`, [x * 0.46, level + 0.18, 0], [0.08, 0.06, 0.75])}
      {box(`chair-arm-post-${x}`, [x * 0.46, level + 0.08, 0.3], [leg, 0.16, leg])}
    </group>)}
    {a.footrest && [-1, 1].flatMap(v => [box(`footrest-x-${v}`, [0, legH * 0.33, v * 0.38], [0.8, leg * 0.65, leg * 0.65]), box(`footrest-z-${v}`, [v * 0.38, legH * 0.33, 0], [leg * 0.65, leg * 0.65, 0.8])])}
  </group>;
}
