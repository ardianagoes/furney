import { useRef, useState } from 'react';
import { ArrowUpRight, Camera, Plus, Search, X } from 'lucide-react';
import type { FurnitureCatalogProps } from '../types';
import { formatFeetInches, formatPrice } from '../lib/units';
import { getRetailerLink, getVisibleProducts, type CatalogSort } from '../lib/catalog';
import { ProductImage } from './ProductImage';
import { PhotoSearch } from './PhotoSearch';

export function FurnitureCatalog({ products, placedItems, onAddProduct }: FurnitureCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<CatalogSort>('none');
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);
  const photoTrigger = useRef<HTMLButtonElement>(null);
  const closePhotoSearch = () => { setPhotoSearchOpen(false); photoTrigger.current?.focus(); };
  const categories = ['All', ...new Set(products.map(product => product.category))];
  const visible = getVisibleProducts(products, query, category, sort);
  return <aside className="catalog-panel" aria-labelledby="catalog-heading">
    <div className="catalog-heading"><div><span className="eyebrow">THE COLLECTION</span><h3 id="catalog-heading">Find your next favorite.</h3></div><ArrowUpRight size={19} /></div>
    <p className="demo-notice"><span className="demo-badge">CURATED CATALOG</span> 15 sample pieces + IKEA-linked products.</p>
    <p className="catalog-price-notice">Prices are imported estimates, not live or independently verified. Check retailer pages for current details.</p>
    <div className="catalog-search-area" onKeyDown={event => { if (event.key === 'Escape' && photoSearchOpen) { event.stopPropagation(); closePhotoSearch(); } }}>
      <div className="catalog-search-row"><label className="search-input"><Search size={17} /><span className="sr-only">Search furniture</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a piece…" /></label><button ref={photoTrigger} type="button" className="photo-search-trigger" aria-expanded={photoSearchOpen} aria-controls="catalog-photo-search" onClick={() => setPhotoSearchOpen(value => !value)}><Camera size={15} /> Search by Photo</button></div>
      {photoSearchOpen && <div id="catalog-photo-search"><PhotoSearch products={products} onAddProduct={onAddProduct} onClose={closePhotoSearch} /></div>}
    </div>
    <div className="category-filters" role="group" aria-label="Filter furniture by category">{categories.map(value => <button key={value} type="button" aria-pressed={category === value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{value}</button>)}</div>
    <label className="catalog-sort"><span>Sort by</span><select aria-label="Sort by price" value={sort} onChange={event => setSort(event.target.value as CatalogSort)}>
      <option value="none">Featured</option>
      <option value="asc">Price: Low to High</option>
      <option value="desc">Price: High to Low</option>
    </select></label>
    <div className="catalog-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'piece' : 'pieces'} to make it yours</div>
    <div className="product-grid" role="region" aria-label="Furniture results" tabIndex={0}>
      {visible.map(product => {
        const count = placedItems.filter(item => item.productId === product.id).length;
        const retailer = getRetailerLink(product.retailerUrl);
        return <article className="product-card" key={product.id}>
          <div className={`product-image product-image-${product.category.toLowerCase()}`}>
            <ProductImage product={product} />
            {count > 0 && <span className="product-count">{count} in your room</span>}
          </div>
          <span className="product-category">{product.category}</span><h4>{product.title}</h4>
          <span className={`product-source ${retailer ? 'product-source-retailer' : ''}`}>{retailer ? `${retailer.name} link` : 'Sample product'}</span>
          <p className="product-dimensions" aria-label="Width, depth, and height">{formatFeetInches(product.widthM)} × {formatFeetInches(product.depthM)} × {formatFeetInches(product.heightM)}</p>
          <p className="product-price">{product.priceUSD === null ? 'Price unavailable' : formatPrice(product.priceUSD)}<span> / {retailer ? 'imported price' : 'sample price'}</span></p>
          <button type="button" className="catalog-add-button" onClick={() => onAddProduct(product.id)} aria-label={`Add ${product.title} to your room`}><Plus size={13} /> Add to Room</button>
          {retailer && <a className="retailer-link" href={retailer.href} target="_blank" rel="noopener noreferrer" aria-label={`View ${product.title} at ${retailer.name} (opens in a new tab)`}>View at {retailer.name} <ArrowUpRight size={12} /></a>}
        </article>;
      })}
    </div>
    {visible.length === 0 && <div className="catalog-empty"><Search size={25} /><h4>No pieces found</h4><p>Try another search or category.</p><button className="text-button" onClick={() => { setQuery(''); setCategory('All'); setSort('none'); }}><X size={14} /> Clear filters</button></div>}
    <p className="catalog-footnote">Sample images are illustrative. Retailer-linked details<br />come from Shreya’s catalog snapshot.</p>
  </aside>;
}
