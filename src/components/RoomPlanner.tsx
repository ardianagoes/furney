import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Box, CheckCircle2, Grid3X3, ImagePlus, Layers3, RotateCcw, RotateCw, Trash2, X } from 'lucide-react';
import type { RoomPlannerProps } from '../types';
import { formatFeetInches } from '../lib/units';
import { itemProblems } from '../lib/room';
import { placementFromDrag, rotatePlacement, toSceneItem, toSceneRoom } from '../lib/plannerAdapter';
import {createCameraStore,defaultRig,topDownRig,type CameraRig} from '../lib/cameraControls';
import {CameraControls} from './CameraControls';
import { SceneBoundary } from './room/SceneBoundary';
import { RoomPhotoAnalysis } from './room/RoomPhotoAnalysis';
import { occupiedBy } from '../lib/occupiedAreas';
import type { RoomAnalysis, OccupiedArea } from '../lib/room-photo-types';

// Keep the renderer out of the initial landing-page bundle.
const RoomScene = lazy(() => import('./room/RoomScene').then(module => ({ default: module.RoomScene })));


/** Angelo's renderer, driven exclusively by Furney's RoomPlannerProps.
 * Only selection, camera, grid, and a local photo are UI state here. */
export function RoomPlanner({ room, products, placedItems, onItemChange, onItemRemove, occupiedAreas = [], onOccupiedAreasChange = () => {} }: RoomPlannerProps & {occupiedAreas?:readonly OccupiedArea[];onOccupiedAreasChange?:(areas:OccupiedArea[])=>void}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraStore] = useState(() => createCameraStore(defaultRig(room)));
  const setRig = (next:CameraRig) => cameraStore.set(next);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [analysis,setAnalysis]=useState<RoomAnalysis|null>(null);
  const [alignment,setAlignment]=useState({x:0,y:0});
  const [frame,setFrame]=useState({width:1,height:1,imageWidth:1,imageHeight:1});
  const [analysisNotice,setAnalysisNotice]=useState('');
  const viewport=useRef<HTMLDivElement>(null);
  const photoVersion=useRef(0);
  const previousIds = useRef(new Set(placedItems.map(item => item.instanceId)));
  const photoInput = useRef<HTMLInputElement>(null);
  const sceneRoom = useMemo(() => toSceneRoom(room), [room]);
  const sceneItems = useMemo(() => placedItems.flatMap(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? [toSceneItem(item, product, room)] : [];
  }), [placedItems, products, room]);
  const issues = useMemo(() => sceneItems.map(item => ({ item, problems: [...itemProblems(item, sceneItems, sceneRoom),...(occupiedBy(item,occupiedAreas)?['Overlaps detected existing furniture (estimated)']:[])] })).filter(entry => entry.problems.length > 0), [sceneItems, sceneRoom,occupiedAreas]);
  const selected = placedItems.find(item => item.instanceId === selectedId);
  const selectedProduct = products.find(product => product.id === selected?.productId);
  const selectedProblems = issues.find(entry => entry.item.id === selectedId)?.problems ?? [];

  useEffect(() => {
    const added = [...placedItems].reverse().find(item => !previousIds.current.has(item.instanceId));
    if (added) setSelectedId(added.instanceId);
    previousIds.current = new Set(placedItems.map(item => item.instanceId));
  }, [placedItems]);
  useEffect(() => { cameraStore.set(defaultRig(room),'angled');setAlignment({x:0,y:0});setAnalysis(null);setAnalysisNotice('');photoVersion.current++; }, [room]);
  useEffect(()=>{
    if(!viewport.current||typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(([entry])=>{if(entry)setFrame(f=>({...f,width:Math.max(1,entry.contentRect.width),height:Math.max(1,entry.contentRect.height)}));});
    observer.observe(viewport.current);return()=>observer.disconnect();
  },[]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  useEffect(()=>()=>{photoVersion.current++;},[]);
  useEffect(()=>{if(cameraStore.getMode()==='top')cameraStore.set(topDownRig(room,frame.width/frame.height),'top');},[cameraStore,room,frame.width,frame.height]);
  function clearAnalysis(){photoVersion.current++;setAnalysis(null);setAnalysisNotice('');onOccupiedAreasChange([]);}
  async function applyAnalysis(result:RoomAnalysis){
    const version=photoVersion.current;
    const {calibrateFloor,occupiedAreas:project}=await import('../lib/room-photo');
    if(version!==photoVersion.current)return;
    const rig=cameraStore.getSnapshot();
    const suggestion=calibrateFloor(result,sceneRoom,frame,rig);
    const camera=suggestion?.rig??rig, offset=suggestion?.alignment??alignment;
    if(suggestion){setRig(camera);setAlignment(offset);setShowGrid(true);}
    const projected=project(result,camera,offset,frame);
    // Reject huge/off-room projections instead of presenting them as measured.
    const areas=projected.areas.filter(a=>a.w<=room.widthM*2&&a.d<=room.depthM*2&&Math.abs(a.x)<=room.widthM&&Math.abs(a.z)<=room.depthM);
    setAnalysis(result);onOccupiedAreasChange(areas);
    setAnalysisNotice((suggestion?'Approximate alignment applied. ':'Could not estimate alignment reliably; manual camera retained. ')+(result.furniture.length-areas.length)+' detections need manual review. Camera edits do not move accepted areas; edit their meter values or reapply alignment.');
  }

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) {
      setPhotoError('Choose a JPG, PNG, or WebP image up to 8 MB.');
      return;
    }
    clearAnalysis();setAlignment({x:0,y:0});setPhoto(URL.createObjectURL(file));
    setPhotoError('');
  }

  function move(id: string, x: number, z: number) {
    const item = placedItems.find(value => value.instanceId === id);
    if (item && Number.isFinite(x) && Number.isFinite(z)) onItemChange(placementFromDrag(item, x, z, room));
  }



  return <section className="interactive-planner" aria-label="Interactive 3D room planner">
    <div className="scene-heading"><span><span className="status-dot" /> YOUR ROOM IN 3D</span><span><Box size={14} /> Approximate furniture shapes</span></div>
    <div className="scene-tools">
      <button type="button" aria-pressed={showGrid} onClick={() => setShowGrid(value => !value)}><Grid3X3 size={14} /> {showGrid ? 'Hide' : 'Show'} grid</button>
      <button type="button" onClick={() => photoInput.current?.click()}><ImagePlus size={14} /> Room photo</button>
      <input ref={photoInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload room photo" onChange={uploadPhoto} />
      {photo && <button type="button" onClick={() => { clearAnalysis();setPhoto(null);setAlignment({x:0,y:0}); setPhotoError(''); }}><X size={13} /> Remove photo</button>}
      <button type="button" onClick={() => {cameraStore.set(defaultRig(room),'angled');setAlignment({x:0,y:0});}}><RotateCcw size={14} /> Reset view</button>
      <button type="button" onClick={()=>{cameraStore.set(topDownRig(room,frame.width/frame.height),'top');setAlignment({x:0,y:0});}}>Top-down view</button>
    </div>
    {photoError && <p role="alert" className="scene-notice scene-error">{photoError}</p>}
    {photo && <p className="scene-notice">Photo overlay is a visual reference. Align the camera manually; your room measurements still control fit.</p>}
    {photo&&import.meta.env.VITE_ENABLE_ROOM_ANALYSIS==='true'&&<RoomPhotoAnalysis photo={photo} analysis={analysis} areas={occupiedAreas} room={room} onAnalysis={applyAnalysis} onAlign={()=>{if(analysis)void applyAnalysis(analysis);}} onClear={clearAnalysis} onAreasChange={onOccupiedAreasChange}/>}
    {analysisNotice&&<p role="status" className="scene-notice">{analysisNotice}</p>}
    <div className="scene-viewport" ref={viewport}>
      {photo && <img className="room-photo" src={photo} alt="Uploaded room reference" onLoad={e=>{const image=e.currentTarget;setFrame(f=>({...f,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight}));}} onError={() => { clearAnalysis();setPhoto(null); setPhotoError('The selected photo could not be displayed.'); }} />}
      <div className="scene-renderer"><SceneBoundary><Suspense fallback={<div className="scene-loading" role="status">Loading your 3D room…</div>}>
        <RoomScene room={sceneRoom} items={sceneItems} selectedId={selected?.instanceId ?? null} showGrid={showGrid} photoMode={photo !== null} rig={cameraStore.getSnapshot()} cameraStore={cameraStore} alignment={alignment} occupied={occupiedAreas} onSelect={setSelectedId} onMove={move} />
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
    <CameraControls store={cameraStore} room={room} photo={photo!==null} />
    {photo&&<div className="scene-tools">{(['x','y'] as const).map(key=><label key={key}>Photo alignment {key}<input aria-label={'Photo alignment '+key} type="range" min="-1.5" max="1.5" step="0.01" value={alignment[key]} onChange={e=>setAlignment(a=>({...a,[key]:Number(e.target.value)}))}/></label>)}</div>}
    <div className="stage-bottom"><span><Layers3 size={14} /> {placedItems.length} {placedItems.length === 1 ? 'piece' : 'pieces'} selected</span><span>{formatFeetInches(room.widthM)} × {formatFeetInches(room.depthM)}</span></div>
  </section>;
}
