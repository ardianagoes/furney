import { useState } from 'react';
import { ArrowUpRight, Sprout } from 'lucide-react';
import { usePlanner } from '../state/PlannerProvider';
import { RoomDimensionsForm } from './RoomDimensionsForm';
import { RoomPlanner } from './RoomPlanner';
import { FurnitureCatalog } from './FurnitureCatalog';
import { SelectedFurniture } from './SelectedFurniture';

export function PlannerWorkspace() {
  const { state, dispatch } = usePlanner();
  const [announcement, setAnnouncement] = useState('');
  return <section id="planner" className="workspace-section" aria-labelledby="planner-heading">
    <div className="page-width">
      <div className="workspace-heading"><div><div className="eyebrow"><Sprout size={14} /> ROOM TO REIMAGINE</div><h2 id="planner-heading">Your next chapter starts here.</h2><p>Measure. Explore. Bring it all together.</p></div><span className="prototype-label"><span className="status-dot" /> Early access prototype</span></div>
      <div className="workspace-grid">
        <div className="workspace-room">
          <RoomDimensionsForm room={state.room} onChange={room => dispatch({ type: 'room/update', room })} />
          <RoomPlanner room={state.room} products={state.products} placedItems={state.placedItems} occupiedAreas={state.occupiedAreas} onOccupiedAreasChange={areas=>dispatch({type:'occupied/update',areas})} onItemChange={item => dispatch({ type: 'item/update', item })} onItemRemove={instanceId => dispatch({ type: 'item/remove', instanceId })} />
        </div>
        <FurnitureCatalog products={state.products} placedItems={state.placedItems} onAddProduct={productId => {
          dispatch({ type: 'product/add', productId, instanceId: crypto.randomUUID() });
          const product = state.products.find(value => value.id === productId);
          setAnnouncement(`${product?.title ?? 'Piece'} added. ${state.placedItems.length + 1} pieces in your room.`);
        }} />
        <SelectedFurniture products={state.products} items={state.placedItems} onRemove={instanceId => { dispatch({ type: 'item/remove', instanceId }); setAnnouncement('Piece removed from your room.'); }} onClear={() => { dispatch({ type: 'items/clear' }); setAnnouncement('Your furniture list is now empty.'); }} />
      </div>
      <div className="workspace-note"><span><span className="note-dot" /> A work in progress, with room to grow.</span><p>Explore your room in 3D. Find IKEA pieces by photo and plan your space.</p><a href="#how-it-works">Back to the basics <ArrowUpRight size={14} /></a></div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </div>
  </section>;
}
