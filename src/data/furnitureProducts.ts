import sofa1Img from "../assets/furniture/sofa-1.jpg";
import sofa2Img from "../assets/furniture/sofa-2.jpg";
import sofa3Img from "../assets/furniture/sofa-3.jpg";
import bed1Img from "../assets/furniture/bed-1.jpg";
import bed2Img from "../assets/furniture/bed-2.jpg";
import bed3Img from "../assets/furniture/bed-3.jpg";
import desk1Img from "../assets/furniture/desk-1.jpg";
import desk2Img from "../assets/furniture/desk-2.jpg";
import desk3Img from "../assets/furniture/desk-3.jpg";
import chair1Img from "../assets/furniture/chair-1.jpg";
import chair2Img from "../assets/furniture/chair-2.jpg";
import chair3Img from "../assets/furniture/chair-3.jpg";
import table1Img from "../assets/furniture/table-1.jpg";
import table2Img from "../assets/furniture/table-2.jpg";
import table3Img from "../assets/furniture/table-3.jpg";
import type { FurnitureProduct } from "../types";

/**
 * Imported from shreya-sneha-dhakal/pixel-perfect-replica at
 * acffabaf350a3687f87f14a90e3936857f3e1bc7 (src/data/furnitureProducts.ts).
 * The first 15 records are illustrative samples, not retailer listings.
 * The first 15 images are AI-generated sample illustrations stored locally.
 * Six IKEA-linked entries follow; their data and prices are imported, not live or
 * independently verified by Furney.
 */
export const furnitureProducts: FurnitureProduct[] = [
  { id: "sofa-1", title: "Linden Three-Seat Sofa", category: "Sofas", widthM: 2.1, depthM: 0.92, heightM: 0.84, priceUSD: 1299, imageUrl: sofa1Img, retailerUrl: null },
  { id: "sofa-2", title: "Marlo Compact Loveseat", category: "Sofas", widthM: 1.5, depthM: 0.85, heightM: 0.8, priceUSD: 749, imageUrl: sofa2Img, retailerUrl: null },
  { id: "sofa-3", title: "Oslo Corner Sectional", category: "Sofas", widthM: 2.8, depthM: 1.75, heightM: 0.86, priceUSD: 2149, imageUrl: sofa3Img, retailerUrl: null },
  { id: "bed-1", title: "Haven Queen Platform Bed", category: "Beds", widthM: 1.63, depthM: 2.13, heightM: 1.05, priceUSD: 899, imageUrl: bed1Img, retailerUrl: null },
  { id: "bed-2", title: "Nordby King Upholstered Bed", category: "Beds", widthM: 1.98, depthM: 2.18, heightM: 1.2, priceUSD: 1499, imageUrl: bed2Img, retailerUrl: null },
  { id: "bed-3", title: "Pine Twin Daybed", category: "Beds", widthM: 1.0, depthM: 1.98, heightM: 0.9, priceUSD: 429, imageUrl: bed3Img, retailerUrl: null },
  { id: "desk-1", title: "Atlas Oak Writing Desk", category: "Desks", widthM: 1.2, depthM: 0.6, heightM: 0.75, priceUSD: 389, imageUrl: desk1Img, retailerUrl: null },
  { id: "desk-2", title: "Rise Standing Desk", category: "Desks", widthM: 1.4, depthM: 0.7, heightM: 1.2, priceUSD: 649, imageUrl: desk2Img, retailerUrl: null },
  { id: "desk-3", title: "Nook Wall Desk", category: "Desks", widthM: 0.9, depthM: 0.45, heightM: 0.76, priceUSD: 219, imageUrl: desk3Img, retailerUrl: null },
  { id: "chair-1", title: "Arlo Lounge Armchair", category: "Chairs", widthM: 0.82, depthM: 0.86, heightM: 0.78, priceUSD: 549, imageUrl: chair1Img, retailerUrl: null },
  { id: "chair-2", title: "Wren Dining Chair", category: "Chairs", widthM: 0.46, depthM: 0.52, heightM: 0.82, priceUSD: 149, imageUrl: chair2Img, retailerUrl: null },
  { id: "chair-3", title: "Ergo Mesh Office Chair", category: "Chairs", widthM: 0.66, depthM: 0.66, heightM: 1.15, priceUSD: 329, imageUrl: chair3Img, retailerUrl: null },
  { id: "table-1", title: "Sienna Round Dining Table", category: "Tables", widthM: 1.2, depthM: 1.2, heightM: 0.75, priceUSD: 799, imageUrl: table1Img, retailerUrl: null },
  { id: "table-2", title: "Bloc Walnut Coffee Table", category: "Tables", widthM: 1.1, depthM: 0.6, heightM: 0.4, priceUSD: 349, imageUrl: table2Img, retailerUrl: null },
  { id: "table-3", title: "Taper Side Table", category: "Tables", widthM: 0.45, depthM: 0.45, heightM: 0.55, priceUSD: 129, imageUrl: table3Img, retailerUrl: null },

  // Imported from Shreya’s catalog snapshot; prices and availability are unverified.
  { id: "ikea-kivik-80519531", title: "KIVIK Sofa, Grann/Bomstad black", category: "Sofas", widthM: 2.270125, depthM: 0.949325, heightM: 0.828675, priceUSD: 1299, imageUrl: "https://www.ikea.com/us/en/images/products/kivik-sofa-grann-bomstad-black__0137863_pe296632_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/kivik-sofa-grann-bomstad-black-80519531/" },
  { id: "ikea-uppland-19384116", title: "UPPLAND Sofa, Blekinge white", category: "Sofas", widthM: 2.24155, depthM: 0.92075, heightM: 0.92075, priceUSD: 899, imageUrl: "https://www.ikea.com/us/en/images/products/uppland-sofa-blekinge-white__1578502_pe1034145_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/uppland-sofa-blekinge-white-s19384116/" },
  { id: "ikea-micke-80213074", title: "MICKE Desk, white, 41 3/8x19 5/8 \"", category: "Desks", widthM: 1.050925, depthM: 0.498475, heightM: 0.7493, priceUSD: 109.99, imageUrl: "https://www.ikea.com/us/en/images/products/micke-desk-white__0736018_pe740345_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/micke-desk-white-80213074/" },
  { id: "ikea-micke-30213076", title: "MICKE Desk, white, 28 3/4x19 5/8 \"", category: "Desks", widthM: 0.73025, depthM: 0.498475, heightM: 0.7493, priceUSD: 69.99, imageUrl: "https://www.ikea.com/us/en/images/products/micke-desk-white__0736022_pe740349_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/micke-desk-white-30213076/" },
  { id: "ikea-lack-30449908", title: "LACK Side table, white, 21 5/8x21 5/8 \"", category: "Tables", widthM: 0.549275, depthM: 0.549275, heightM: 0.45085, priceUSD: 16.99, imageUrl: "https://www.ikea.com/us/en/images/products/lack-side-table-white__0702210_pe724345_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/lack-side-table-white-30449908/" },
  { id: "ikea-lack-90449905", title: "LACK Coffee table, white, 35 3/8x21 5/8 \"", category: "Tables", widthM: 0.549275, depthM: 0.898525, heightM: 0.45085, priceUSD: 29.99, imageUrl: "https://www.ikea.com/us/en/images/products/lack-coffee-table-white__0750652_pe746803_s5.jpg", retailerUrl: "https://www.ikea.com/us/en/p/lack-coffee-table-white-90449905/" },
];
