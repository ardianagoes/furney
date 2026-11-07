import { useState } from 'react';
import { Armchair } from 'lucide-react';
import type { FurnitureProduct } from '../types';

/** Local sample images and external retailer images share a graceful fallback. */
export function ProductImage({ product, decorative = false }: { product: FurnitureProduct; decorative?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!product.imageUrl || failedUrl === product.imageUrl) {
    return <div className="product-image-fallback" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${product.title}: image unavailable`} aria-hidden={decorative || undefined}>
      <Armchair size={25} strokeWidth={1.4} aria-hidden="true" />
      <span>Image unavailable</span>
    </div>;
  }
  return <img src={product.imageUrl} alt={decorative ? '' : product.title} loading="lazy" decoding="async" onError={() => setFailedUrl(product.imageUrl)} />;
}
