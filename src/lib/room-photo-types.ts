// Angelo's normalized-image analysis contract, adapted without Zod/TanStack.
export interface ImagePoint { x: number; y: number }
export interface RoomAnalysis {
  view: 'perspective' | 'overhead';
  rearEdge: { left: ImagePoint; right: ImagePoint; confidence: number } | null;
  floor: { backLeft: ImagePoint; backRight: ImagePoint; frontRight: ImagePoint; frontLeft: ImagePoint; confidence: number } | null;
  furniture: { label: string; footprint: ImagePoint[]; confidence: number }[];
  notes: string;
}
export type RoomAnalysisResult = { ok: true; analysis: RoomAnalysis } | { ok: false; code: string; message: string };
export interface OccupiedArea { id: string; label: string; x: number; z: number; w: number; d: number }
const point = (p: unknown): p is ImagePoint => !!p && typeof p==='object' && ['x','y'].every(k=>typeof (p as Record<string,unknown>)[k]==='number' && Number.isFinite((p as Record<string,number>)[k]) && (p as Record<string,number>)[k]>=0 && (p as Record<string,number>)[k]<=1);
const confidence = (v: unknown) => typeof v==='number' && Number.isFinite(v) && v>=0 && v<=1;
export function parseRoomAnalysis(value: unknown): RoomAnalysis | null {
  if(!value || typeof value!=='object') return null;
  const d=value as RoomAnalysis;
  if(!['perspective','overhead'].includes(d.view) || typeof d.notes!=='string' || d.notes.length>800 || !Array.isArray(d.furniture) || d.furniture.length>20) return null;
  if(d.rearEdge!==null && (!d.rearEdge || !point(d.rearEdge.left)||!point(d.rearEdge.right)||!confidence(d.rearEdge.confidence))) return null;
  if(d.floor!==null && (!d.floor||![d.floor.backLeft,d.floor.backRight,d.floor.frontRight,d.floor.frontLeft].every(point)||!confidence(d.floor.confidence))) return null;
  if(d.furniture.some(o=>!o||typeof o.label!=='string'||o.label.length>80||!confidence(o.confidence)||!Array.isArray(o.footprint)||o.footprint.length>8||(o.footprint.length>0&&o.footprint.length<3)||!o.footprint.every(point))) return null;
  const f=d.floor;
  const validFloor=f && f.confidence>=0.5 && f.backRight.x>f.backLeft.x && f.frontRight.x>f.frontLeft.x && f.frontLeft.y+f.frontRight.y>f.backLeft.y+f.backRight.y+0.1;
  return {view:d.view,notes:d.notes,rearEdge:d.rearEdge && d.rearEdge.confidence>=0.5 && d.rearEdge.right.x>d.rearEdge.left.x+0.05 ? d.rearEdge : null, floor:validFloor?f:null,furniture:d.furniture.map(o=>({...o,footprint:o.footprint.map(p=>({...p}))}))};
}
