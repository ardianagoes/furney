import type { FurnitureProduct } from '../types';

export type CatalogSort = 'none' | 'asc' | 'desc';

/** Adapted from Shreya's catalog. Sort a filtered copy, retaining source order
 * for equal prices and putting unpriced products last in either direction. */
export function getVisibleProducts(
  products: readonly FurnitureProduct[],
  query: string,
  category: string,
  sort: CatalogSort,
): FurnitureProduct[] {
  const search = query.trim().toLowerCase();
  const visible = products.filter(product =>
    (category === 'All' || product.category === category)
    && `${product.title} ${product.category}`.toLowerCase().includes(search),
  );
  if (sort === 'none') return visible;
  return visible.sort((a, b) => {
    if (a.priceUSD === null && b.priceUSD === null) return 0;
    if (a.priceUSD === null) return 1;
    if (b.priceUSD === null) return -1;
    return sort === 'asc' ? a.priceUSD - b.priceUSD : b.priceUSD - a.priceUSD;
  });
}

export function getRetailerLink(retailerUrl: string | null) {
  if (!retailerUrl) return null;
  try {
    const url = new URL(retailerUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    return { href: url.href, name: host === 'ikea.com' || host.endsWith('.ikea.com') ? 'IKEA' : 'retailer' };
  } catch {
    return null;
  }
}
