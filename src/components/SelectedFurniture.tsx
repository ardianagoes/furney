import { Armchair, ArrowRight, Trash2, X } from 'lucide-react';
import type { FurnitureProduct, PlacedItem } from '../types';
import { FurnitureIllustration } from './FurnitureIllustration';
import { formatPrice } from '../lib/units';
import { getPriceEstimate } from '../state/plannerState';

interface Props {
  products: readonly FurnitureProduct[];
  items: readonly PlacedItem[];
  onRemove: (instanceId: string) => void;
  onClear: () => void;
}

export function SelectedFurniture({ products, items, onRemove, onClear }: Props) {
  const estimate = getPriceEstimate(products, items);
  return <section className="selected-panel" aria-labelledby="selected-heading">
    <div className="selected-header"><div><h3 id="selected-heading">Your room, piece by piece. <span>{items.length}</span></h3><p>A little of this. A little of you.</p></div>{items.length > 0 && <button className="text-button clear-button" onClick={onClear}><Trash2 size={14} /> Clear all</button>}</div>
    {items.length === 0 ? <div className="selected-empty"><span><Armchair size={25} strokeWidth={1.4} /></span><div><strong>Good things start with one piece.</strong><p>Add something you love from the demo collection.</p></div><ArrowRight size={20} className="empty-arrow" /></div> : <ul className="selected-list">{items.map((item, index) => {
      const product = products.find(value => value.id === item.productId);
      if (!product) return null;
      return <li key={item.instanceId}><div className="selected-thumbnail">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <FurnitureIllustration category={product.category} variant={product.id} />}</div><div className="selected-item-name"><strong>{product.title}</strong><span>{product.category} · Piece {index + 1}</span></div><span className="selected-item-price">{product.priceUSD === null ? 'Unpriced' : formatPrice(product.priceUSD)}</span><button className="remove-item" aria-label={`Remove ${product.title}, piece ${index + 1}`} onClick={() => onRemove(item.instanceId)}><X size={17} /></button></li>;
    })}</ul>}
    <div className="estimate-row"><div><strong>Estimated total</strong><span>Demo prices · excludes tax & delivery</span></div><span className="estimate-price" aria-live="polite">{formatPrice(estimate.total)}</span></div>
    {estimate.unpricedCount > 0 && <p className="unpriced-note" role="status">{estimate.unpricedCount} {estimate.unpricedCount === 1 ? 'piece has' : 'pieces have'} no price and {estimate.unpricedCount === 1 ? 'is' : 'are'} excluded from this estimate.</p>}
  </section>;
}
