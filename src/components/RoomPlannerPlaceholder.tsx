import { Box, Layers3, MoveUpRight } from 'lucide-react';
import type { RoomPlannerProps } from '../types';
import { formatFeetInches } from '../lib/units';

/** Replace only this component with Angelo's R3F planner.
 * Accept the same RoomPlannerProps; keep state in the host. */
export function RoomPlannerPlaceholder({ room, placedItems }: RoomPlannerProps) {
  return <section className="planner-stage" aria-label="Future interactive 3D room planner">
    <div className="stage-top"><span><span className="status-dot" /> YOUR CANVAS</span><span className="stage-mode"><Box size={14} /> 3D preview · coming soon</span></div>
    <div className="empty-room-art" aria-hidden="true">
      <svg viewBox="0 0 600 340" fill="none">
        <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 300 60)"><path d="M30 0H0v30" stroke="#bcc5af" strokeWidth="1" /></pattern></defs>
        <path d="m92 183 208-105 208 105-208 105z" fill="#e4e9d9" />
        <path d="m92 183 208-105 208 105-208 105z" fill="url(#grid)" />
        <path d="M92 183V67L300-38V78z" fill="#e9ecdf" /><path d="M300-38 508 67v116L300 78z" fill="#e2e6d7" />
        <path d="m92 183 208-105 208 105m-208-105V-38" stroke="#c3cbb8" strokeWidth="1.5" />
        <path d="m92 199 208 105 208-105" stroke="#a2ae94" strokeDasharray="4 5" />
        <path d="M92 193v13m208 92v13m208-118v13" stroke="#a2ae94" />
      </svg>
    </div>
    <div className="stage-placeholder-label"><span className="stage-box"><Box size={22} strokeWidth={1.4} /></span><h3>A little space for big ideas.</h3><p>Your interactive 3D room is on its way.<br />Set your dimensions and explore the demo collection.</p><span className="placeholder-badge">Interactive room view coming soon</span></div>
    <div className="stage-bottom"><span><Layers3 size={14} /> {placedItems.length} {placedItems.length === 1 ? 'piece' : 'pieces'} selected</span><span>{formatFeetInches(room.widthM)} × {formatFeetInches(room.depthM)} <MoveUpRight size={13} /></span></div>
  </section>;
}
