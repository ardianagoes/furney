// Adapted from Angelo's RoomScene @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Grid, Lightformer, Line } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { itemProblems, footprint, type SceneItem, type Room } from '../../lib/room';
import { FurnitureMesh } from './Furniture';

export interface CameraRig {
  height: number;
  distance: number;
  yaw: number;
  pitch: number;
  fov: number;
}

export interface RoomSceneProps {
  room: Room;
  items: SceneItem[];
  selectedId: string | null;
  showGrid: boolean;
  photoMode: boolean;
  rig: CameraRig;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
}

function Rig({ rig }: { rig: CameraRig }) {
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const yaw = THREE.MathUtils.degToRad(rig.yaw);
    const pitch = THREE.MathUtils.degToRad(rig.pitch);
    cam.fov = rig.fov;
    cam.position.set(Math.sin(yaw) * rig.distance, rig.height, Math.cos(yaw) * rig.distance);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(-pitch, yaw, 0);
    cam.updateProjectionMatrix();
  }, [camera, rig]);
  return null;
}

const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function SceneFurniture({ item, problems, selected, onSelect, onMove }: {
  item: SceneItem; problems: string[]; selected: boolean;
  onSelect: (id: string) => void; onMove: (id: string, x: number, z: number) => void;
}) {
  const offset = useRef<{ x: number; z: number; pointerId: number } | null>(null);
  const hit = useRef(new THREE.Vector3());
  const f = footprint(item);
  const bad = problems.length > 0;

  const down = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || offset.current) return;
    event.stopPropagation();
    onSelect(item.id);
    if (event.ray.intersectPlane(FLOOR, hit.current)) {
      offset.current = { x: item.x - hit.current.x, z: item.z - hit.current.z, pointerId: event.pointerId };
      (event.target as Element).setPointerCapture(event.pointerId);
    }
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    const drag = offset.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (event.ray.intersectPlane(FLOOR, hit.current)) onMove(item.id, hit.current.x + drag.x, hit.current.z + drag.z);
  };
  const up = (event: ThreeEvent<PointerEvent>) => {
    if (offset.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    offset.current = null;
    const target = event.target as Element;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  };

  return <group position={[item.x, 0, item.z]} name={`furniture-${item.id}`}>
    <group rotation-y={THREE.MathUtils.degToRad(item.rot)} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={() => { offset.current = null; }}>
      <FurnitureMesh item={item} />
    </group>
    {(selected || bad) && <Line
      points={[[-f.w / 2, 0.01, -f.d / 2], [f.w / 2, 0.01, -f.d / 2], [f.w / 2, 0.01, f.d / 2], [-f.w / 2, 0.01, f.d / 2], [-f.w / 2, 0.01, -f.d / 2]]}
      color={bad ? '#b14e3e' : '#72885d'} lineWidth={bad ? 3 : 2}
      dashed={!bad} dashSize={0.1} gapSize={0.06}
    />}
  </group>;
}

export function RoomScene({ room, items, selectedId, showGrid, photoMode, rig, onSelect, onMove }: RoomSceneProps) {
  const problems = useMemo(() => Object.fromEntries(items.map(item => [item.id, itemProblems(item, items, room)])), [items, room]);
  const hw = room.width / 2, hd = room.depth / 2;
  const extent = Math.max(room.width, room.depth, room.height);
  return <Canvas
    shadows dpr={[1, 1.5]}
    gl={{ alpha: true, antialias: true }}
    camera={{ fov: rig.fov, near: 0.03, far: Math.max(150, extent * 10) }}
    onPointerMissed={event => { if (event.button === 0) onSelect(null); }}
    fallback={<div className="scene-unavailable">3D needs WebGL2. Your furniture list and placement controls still work.</div>}
    aria-label="Interactive room canvas"
  >
    <Rig rig={rig} />
    <ambientLight intensity={0.7} />
    <directionalLight position={[extent, extent * 2, extent]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-extent} shadow-camera-right={extent} shadow-camera-top={extent} shadow-camera-bottom={-extent} shadow-camera-far={extent * 5} />
    <Environment resolution={64}>
      <Lightformer intensity={2} position={[0, extent + 2, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
      <Lightformer intensity={1} color="#ffe2c4" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
    </Environment>
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[room.width, room.depth]} />
      {photoMode ? <shadowMaterial opacity={0.35} /> : <meshStandardMaterial color="#dce3cf" roughness={0.95} />}
    </mesh>
    {showGrid && <>
      <Grid args={[room.width, room.depth]} cellSize={0.5} cellThickness={0.6} sectionSize={1} sectionThickness={1.2}
        cellColor={photoMode ? '#ffffff' : '#a9b49b'} sectionColor="#879b70" fadeDistance={extent * 4} position={[0, 0.002, 0]} />
      <Line points={[[-hw, 0.005, -hd], [hw, 0.005, -hd], [hw, 0.005, hd], [-hw, 0.005, hd], [-hw, 0.005, -hd]]} color="#71865b" lineWidth={2} />
      <Line points={[[-hw, 0, -hd], [-hw, room.height, -hd], [hw, room.height, -hd], [hw, 0, -hd]]} color="#8d9d7d" lineWidth={1} transparent opacity={0.55} />
    </>}
    {items.map(item => <SceneFurniture key={item.id} item={item} problems={problems[item.id] ?? []} selected={item.id === selectedId} onSelect={onSelect} onMove={onMove} />)}
  </Canvas>;
}
