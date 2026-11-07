// Adapted from Shreya's PhotoSearch.tsx @ 57e756b6bc0daa5f043ada909f07035ad2e0ca43.
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Plus, X } from 'lucide-react';
import { furnitureAttributes, type ProductAttributes } from '../data/furnitureAttributes';
import { matchProducts } from '../lib/photo-match';
import { analyzePhoto } from '../lib/photo-search.functions';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type PhotoAnalysis } from '../lib/photo-search-types';
import { getRetailerLink } from '../lib/catalog';
import { formatPrice } from '../lib/units';
import type { FurnitureProduct } from '../types';
import { ProductImage } from './ProductImage';

export interface PhotoSearchProps {
  products: readonly FurnitureProduct[];
  onAddProduct: (productId: string) => void;
  attributes?: Record<string, ProductAttributes>;
  onClose?: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; source: 'ai' | 'manual'; analysis: Partial<PhotoAnalysis> & { category: string } };

const MANUAL_STYLES = ['', 'modern', 'minimalist', 'scandinavian', 'mid-century', 'industrial', 'traditional'];

export function PhotoSearch({ products, onAddProduct, attributes = furnitureAttributes, onClose }: PhotoSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const reader = useRef<FileReader | null>(null);
  const version = useRef(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [manualCategory, setManualCategory] = useState(products[0]?.category ?? 'Sofas');
  const [manualStyle, setManualStyle] = useState('');
  const categories = [...new Set(products.map(product => product.category))];
  const matches = status.kind === 'done' ? matchProducts(status.analysis, products, attributes) : [];

  function cancelRequest() {
    version.current++;
    request.current?.abort();
    if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
  }
  useEffect(() => () => { cancelRequest(); }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    cancelRequest();
    const current = version.current;
    setPreview(null);
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setStatus({ kind: 'error', message: 'Choose a JPG, PNG, or WebP furniture photo.' });
      return;
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      setStatus({ kind: 'error', message: 'Choose a nonempty image up to 3 MB.' });
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        reader.current = fileReader;
        fileReader.onload = () => {
          if (reader.current === fileReader) reader.current = null;
          typeof fileReader.result === 'string' ? resolve(fileReader.result) : reject(new Error('Unreadable image'));
        };
        fileReader.onerror = () => { if (reader.current === fileReader) reader.current = null; reject(new Error('Unreadable image')); };
        fileReader.onabort = () => { if (reader.current === fileReader) reader.current = null; reject(new Error('Cancelled image')); };
        fileReader.readAsDataURL(file);
      });
      if (current !== version.current) return;
      setPreview(dataUrl);
      const controller = new AbortController();
      request.current = controller;
      const result = await analyzePhoto(dataUrl, controller.signal);
      if (current !== version.current) return;
      setStatus(result.ok ? { kind: 'done', source: 'ai', analysis: result.analysis } : { kind: 'error', message: result.message });
    } catch {
      if (current === version.current) setStatus({ kind: 'error', message: 'The photo could not be read or analyzed. Try another image or use manual search.' });
    }
  }

  function runManual() {
    cancelRequest();
    setStatus({ kind: 'done', source: 'manual', analysis: { category: manualCategory, ...(manualStyle ? { style: manualStyle } : {}) } });
  }

  return <section className="photo-search-panel" aria-label="Photo search">
    <div className="photo-search-heading"><h4>Find a similar piece.</h4>{onClose && <button type="button" aria-label="Close photo search" onClick={onClose}><X size={16} /></button>}</div>
    <p className="photo-search-intro">Upload a furniture photo, or search manually. When AI is configured, your photo is sent to OpenAI for analysis. Matches come only from this catalog.</p>
    <input ref={inputRef} className="sr-only" type="file" aria-label="Upload furniture photo" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={event => {
      void handleFile(event.target.files?.[0]); event.target.value = '';
    }} />
    <button type="button" className="photo-upload" disabled={status.kind === 'loading'} onClick={() => inputRef.current?.click()}>
      {preview ? <img src={preview} alt="Your uploaded furniture" /> : <><Camera size={24} strokeWidth={1.4} /><span>Choose JPG, PNG, or WebP · up to 3 MB</span></>}
    </button>
    {preview && <button type="button" className="text-button" onClick={() => { cancelRequest(); setPreview(null); setStatus({ kind: 'idle' }); }}>Clear photo & results</button>}
    <div className="photo-analysis-status" aria-live="polite">
      {status.kind === 'idle' && <p>No photo analyzed yet. Manual search is always available.</p>}
      {status.kind === 'loading' && <p>Requesting image analysis…</p>}
      {status.kind === 'error' && <div className="photo-search-error" role="alert">{status.message}<p>You can choose category and style below instead.</p></div>}
      {status.kind === 'done' && <>
        <p className="photo-result-source">{status.source === 'ai' ? 'AI description — please review' : 'Manual search — no photo was analyzed'}</p>
        <dl className="photo-descriptors">{([
          ['Category', status.analysis.category], ['Color', status.analysis.primaryColor],
          ['Material', status.analysis.material], ['Style', status.analysis.style],
        ] as const).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {!!status.analysis.keywords?.length && <p className="photo-keywords">{status.analysis.keywords.join(' · ')}</p>}
      </>}
    </div>
    <details className="photo-manual" open={status.kind === 'error'}>
      <summary>Manual search (no AI)</summary>
      <div className="photo-manual-inputs">
        <label>Category<select aria-label="Manual furniture category" value={manualCategory} onChange={event => setManualCategory(event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <label>Style<select aria-label="Manual furniture style" value={manualStyle} onChange={event => setManualStyle(event.target.value)}>{MANUAL_STYLES.map(style => <option key={style} value={style}>{style || 'Any style'}</option>)}</select></label>
      </div>
      <button className="catalog-add-button" type="button" onClick={runManual}>Find matches</button>
    </details>
    {status.kind === 'done' && (matches.length === 0 ? <p className="photo-no-matches">No similar products in this catalog for “{status.analysis.category}”. Try a different manual category.</p> : <ul className="photo-match-list" aria-label="Photo search matches">{matches.map(({ product, reasons }) => {
      const retailer = getRetailerLink(product.retailerUrl);
      return <li key={product.id}>
        <div className="photo-match-top"><div className="photo-match-image"><ProductImage product={product} /></div><div><h5>{product.title}</h5><p>{product.category} · {retailer ? `${retailer.name} link` : 'Sample product'}</p></div></div>
        <p className="photo-match-size">{product.widthM.toFixed(2)} × {product.depthM.toFixed(2)} × {product.heightM.toFixed(2)} m · W × D × H</p>
        <p className="photo-match-price">{product.priceUSD === null ? 'Price unavailable' : formatPrice(product.priceUSD)}<span> · {retailer ? 'imported' : 'sample'} price</span></p>
        <ul className="photo-match-reasons">{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        <button className="catalog-add-button" type="button" aria-label={`Add photo match ${product.title} to your room`} onClick={() => onAddProduct(product.id)}><Plus size={13} /> Add to Room</button>
        {retailer && <a className="retailer-link" href={retailer.href} target="_blank" rel="noopener noreferrer" aria-label={`View photo match ${product.title} at ${retailer.name} (opens in a new tab)`}>View at {retailer.name} <ArrowUpRight size={12} /></a>}
      </li>;
    })}</ul>)}
  </section>;
}
