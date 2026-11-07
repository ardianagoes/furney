import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Box, CheckCircle2, Grid3X3, ImagePlus, Layers3, RotateCcw, RotateCw, Trash2, X } from 'lucide-react';
import type { RoomDimensions, RoomPlannerProps } from '../types';
import { formatFeetInches } from '../lib/units';
import { itemProblems } from '../lib/room';
import { placementFromDrag, rotatePlacement, toSceneItem, toSceneRoom } from '../lib/plannerAdapter';
import type { CameraRig } from './room/RoomScene';
import { SceneBoundary } from './room/SceneBoundary';

// Keep the renderer out of the initial landing-page bundle.
const RoomScene = lazy(() => import('./room/RoomScene').then(module => ({ default: module.RoomScene })));

function defaultRig(room: RoomDimensions): CameraRig {
  const distance = Math.max(room.widthM, room.depthM, room.heightM) * 1.4;
  return { height: distance * Math.tan(34 * Math.PI / 180), distance, yaw: 30, pitch: 34, fov: 50 };
}

/** Angelo's renderer, driven exclusively by Furney's RoomPlannerProps.
 * Only selection, camera, grid, and a local photo are UI state here. */
export function RoomPlanner({ room, products, placedItems, onItemChange, onItemRemove }: RoomPlannerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [rig, setRig] = useState(() => defaultRig(room));
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const previousIds = useRef(new Set(placedItems.map(item => item.instanceId)));
  const photoInput = useRef<HTMLInputElement>(null);
  const sceneRoom = useMemo(() => toSceneRoom(room), [room]);
  const sceneItems = useMemo(() => placedItems.flatMap(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? [toSceneItem(item, product, room)] : [];
  }), [placedItems, products, room]);
  const issues = useMemo(() => sceneItems.map(item => ({ item, problems: itemProblems(item, sceneItems, sceneRoom) })).filter(entry => entry.problems.length > 0), [sceneItems, sceneRoom]);
  const selected = placedItems.find(item => item.instanceId === selectedId);
  const selectedProduct = products.find(product => product.id === selected?.productId);
  const selectedProblems = issues.find(entry => entry.item.id === selectedId)?.problems ?? [];

  useEffect(() => {
    const added = [...placedItems].reverse().find(item => !previousIds.current.has(item.instanceId));
    if (added) setSelectedId(added.instanceId);
    previousIds.current = new Set(placedItems.map(item => item.instanceId));
  }, [placedItems]);
  useEffect(() => { setRig(defaultRig(room)); }, [room]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) {
      setPhotoError('Choose a JPG, PNG, or WebP image up to 8 MB.');
      return;
    }
    setPhoto(URL.createObjectURL(file));
    setPhotoError('');
  }

  function move(id: string, x: number, z: number) {
    const item = placedItems.find(value => value.instanceId === id);
    if (item && Number.isFinite(x) && Number.isFinite(z)) onItemChange(placementFromDrag(item, x, z, room));
  }

  const cameraFields = [
    { key: 'height', label: 'Camera height', min: 0.25, max: Math.max(10, room.heightM * 4, room.widthM * 3, room.depthM * 3), step: 0.05, unit: 'm' },
    { key: 'distance', label: 'Distance', min: 0.5, max: Math.max(20, room.widthM * 4, room.depthM * 4), step: 0.1, unit: 'm' },
    { key: 'pitch', label: 'Tilt down', min: -10, max: 80, step: 1, unit: '°' },
    { key: 'yaw', label: 'Turn', min: -180, max: 180, step: 1, unit: '°' },
    { key: 'fov', label: 'Lens width', min: 30, max: 100, step: 1, unit: '°' },
  ] as const;

  return <section className="interactive-planner" aria-label="Interactive 3D room planner">
    <div className="scene-heading"><span><span className="status-dot" /> YOUR ROOM IN 3D</span><span><Box size={14} /> Approximate furniture shapes</span></div>
    <div className="scene-tools">
      <button type="button" aria-pressed={showGrid} onClick={() => setShowGrid(value => !value)}><Grid3X3 size={14} /> {showGrid ? 'Hide' : 'Show'} grid</button>
      <button type="button" onClick={() => photoInput.current?.click()}><ImagePlus size={14} /> Room photo</button>
      <input ref={photoInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload room photo" onChange={uploadPhoto} />
      {photo && <button type="button" onClick={() => { setPhoto(null); setPhotoError(''); }}><X size={13} /> Remove photo</button>}
      <button type="button" onClick={() => setRig(defaultRig(room))}><RotateCcw size={14} /> Reset view</button>
    </div>
    {photoError && <p role="alert" className="scene-notice scene-error">{photoError}</p>}
    {photo && <p className="scene-notice">Photo overlay is a visual reference. Align the camera manually; your room measurements still control fit.</p>}
    <div className="scene-viewport">
      {photo && <img className="room-photo" src={photo} alt="Uploaded room reference" onError={() => { setPhoto(null); setPhotoError('The selected photo could not be displayed.'); }} />}
      <div className="scene-renderer"><SceneBoundary><Suspense fallback={<div className="scene-loading" role="status">Loading your 3D room…</div>}>
        <RoomScene room={sceneRoom} items={sceneItems} selectedId={selected?.instanceId ?? null} showGrid={showGrid} photoMode={photo !== null} rig={rig} onSelect={setSelectedId} onMove={move} />
      </Suspense></SceneBoundary></div>
      <div className={`scene-fit-badge ${issues.length > 0 ? 'has-issues' : ''}`} role="status">
        {issues.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
        {placedItems.length === 0 ? 'Add a piece from the collection' : issues.length > 0 ? `${issues.length} ${issues.length === 1 ? 'piece needs' : 'pieces need'} attention` : 'All pieces fit'}
      </div>
    </div>
    <div className="scene-instructions">Select a piece, then drag it across the floor. Dragging snaps to 5 cm. Use the controls below to rotate or position precisely.</div>
    <div className="scene-selection">
      <label className="scene-select-label">Selected piece<select aria-label="Selected furniture" value={selected?.instanceId ?? ''} onChange={event => setSelectedId(event.target.value || null)}>
        <option value="">Select a piece…</option>
        {placedItems.map((item, index) => <option key={item.instanceId} value={item.instanceId}>{index + 1}. {products.find(p => p.id === item.productId)?.title ?? 'Unknown piece'}</option>)}
      </select></label>
      {selected && selectedProduct && <>
        <div className="scene-position-inputs">{(['xM', 'zM'] as const).map(axis => <label key={axis}>{axis === 'xM' ? 'X' : 'Z'} (m)<input type="number" aria-label={axis === 'xM' ? 'Selected piece X in meters' : 'Selected piece Z in meters'} step="0.05" min="0" max={axis === 'xM' ? room.widthM : room.depthM} value={Number(selected[axis].toFixed(4))} onChange={event => {
          const value = event.target.valueAsNumber;
          const max = axis === 'xM' ? room.widthM : room.depthM;
          if (Number.isFinite(value) && value >= 0 && value <= max) onItemChange({ ...selected, [axis]: value });
        }} /></label>)}</div>
        <button type="button" className="scene-rotate" aria-label="Rotate selected furniture 90 degrees" onClick={() => onItemChange(rotatePlacement(selected))}><RotateCw size={15} /> {selected.rotationDeg}°</button>
        <button type="button" className="scene-remove" aria-label="Remove selected furniture" onClick={() => onItemRemove(selected.instanceId)}><Trash2 size={15} /> Remove</button>
        <p className="scene-selected-size">{selectedProduct.widthM.toFixed(2)} × {selectedProduct.depthM.toFixed(2)} × {selectedProduct.heightM.toFixed(2)} m · W × D × H</p>
        {selectedProblems.length > 0 && <p className="scene-selected-warning" role="status">{selectedProblems.join(' · ')}</p>}
      </>}
    </div>
    {issues.length > 0 && <details className="scene-warnings"><summary>Review fit warnings</summary><ul>{issues.map(({ item, problems }) => <li key={item.id}><strong>{item.label}</strong>: {problems.join(' · ')}</li>)}</ul></details>}
    <details className="camera-controls"><summary>Camera controls {photo ? '· match your photo' : '· adjust your view'}</summary><div className="camera-sliders">{cameraFields.map(field => <label key={field.key}>
      <span>{field.label}<output>{Number(rig[field.key].toFixed(2))}{field.unit}</output></span>
      <input type="range" aria-label={field.label} min={field.min} max={field.max} step={field.step} value={rig[field.key]} onChange={event => setRig(previous => ({ ...previous, [field.key]: Number(event.target.value) }))} />
    </label>)}</div></details>
    <div className="stage-bottom"><span><Layers3 size={14} /> {placedItems.length} {placedItems.length === 1 ? 'piece' : 'pieces'} selected</span><span>{formatFeetInches(room.widthM)} × {formatFeetInches(room.depthM)}</span></div>
  </section>;
}
