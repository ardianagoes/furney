import { useState } from 'react';
import { ArrowUpRight, Plus, Search, X } from 'lucide-react';
import type { FurnitureCatalogProps } from '../types';
import { formatFeetInches, formatPrice } from '../lib/units';
import { FurnitureIllustration } from './FurnitureIllustration';

export function FurnitureCatalog({ products, placedItems, onAddProduct }: FurnitureCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(products.map(product => product.category))];
  const visible = products.filter(product => (category === 'All' || product.category === category) && `${product.title} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <aside className="catalog-panel" aria-labelledby="catalog-heading">
    <div className="catalog-heading"><div><span className="eyebrow">THE COLLECTION</span><h3 id="catalog-heading">Find your next favorite.</h3></div><ArrowUpRight size={19} /></div>
    <p className="demo-notice"><span className="demo-badge">DEMO DATA</span> Sample pieces & illustrative prices.</p>
    <label className="search-input"><Search size={17} /><span className="sr-only">Search furniture</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a piece for your space…" /></label>
    <div className="category-filters" role="group" aria-label="Filter furniture by category">{categories.map(value => <button key={value} type="button" aria-pressed={category === value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{value}</button>)}</div>
    <div className="catalog-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'piece' : 'pieces'} to make it yours</div>
    <div className="product-grid">
      {visible.map(product => {
        const count = placedItems.filter(item => item.productId === product.id).length;
        return <article className="product-card" key={product.id}>
          <div className={`product-image product-image-${product.category.toLowerCase()}`}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.title} loading="lazy" /> : <FurnitureIllustration category={product.category} variant={product.id} />}
            {count > 0 && <span className="product-count">{count} in your room</span>}
            <button className="add-product" type="button" onClick={() => onAddProduct(product.id)} aria-label={`Add ${product.title} to your room`}><Plus size={18} /></button>
          </div>
          <span className="product-category">{product.category}</span><h4>{product.title}</h4>
          <p className="product-dimensions">{formatFeetInches(product.widthM)} × {formatFeetInches(product.depthM)}</p>
          <p className="product-price">{product.priceUSD === null ? 'Price unavailable' : formatPrice(product.priceUSD)}<span> / demo</span></p>
        </article>;
      })}
    </div>
    {visible.length === 0 && <div className="catalog-empty"><Search size={25} /><h4>No pieces found</h4><p>Try another search or category.</p><button className="text-button" onClick={() => { setQuery(''); setCategory('All'); }}><X size={14} /> Clear filters</button></div>}
    <p className="catalog-footnote">A starting point for your imagination.<br />Real product discovery is coming next.</p>
  </aside>;
}
