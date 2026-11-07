import type { FurnitureProduct } from '../types';

// Illustrative products and prices only. No retailer affiliation or live inventory.
export const demoProducts: FurnitureProduct[] = [
  { id: 'demo-sofa', title: 'Everyday sofa', category: 'Seating', widthM: 2.05, depthM: 0.9, heightM: 0.8, priceUSD: 599, imageUrl: null, retailerUrl: null },
  { id: 'demo-chair', title: 'Sunday lounge chair', category: 'Seating', widthM: 0.75, depthM: 0.82, heightM: 0.78, priceUSD: 249, imageUrl: null, retailerUrl: null },
  { id: 'demo-table', title: 'Round coffee table', category: 'Tables', widthM: 0.8, depthM: 0.8, heightM: 0.4, priceUSD: 129, imageUrl: null, retailerUrl: null },
  { id: 'demo-lamp', title: 'Arc floor lamp', category: 'Lighting', widthM: 0.45, depthM: 0.45, heightM: 1.65, priceUSD: 89, imageUrl: null, retailerUrl: null },
  { id: 'demo-rug', title: 'Soft landing rug', category: 'Rugs', widthM: 1.6, depthM: 2.3, heightM: 0.02, priceUSD: 119, imageUrl: null, retailerUrl: null },
  { id: 'demo-shelf', title: 'Open oak shelf', category: 'Storage', widthM: 0.8, depthM: 0.35, heightM: 1.5, priceUSD: null, imageUrl: null, retailerUrl: null },
];
