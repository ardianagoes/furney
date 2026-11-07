export interface FurnitureProduct {
  id: string;
  title: string;
  category: string;
  widthM: number;
  depthM: number;
  heightM: number;
  priceUSD: number | null;
  imageUrl: string | null;
  retailerUrl: string | null;
}

export interface RoomDimensions {
  widthM: number;
  depthM: number;
  heightM: number;
}

export interface PlacedItem {
  instanceId: string;
  productId: string;
  xM: number;
  zM: number;
  rotationDeg: 0 | 90 | 180 | 270;
}

/** Angelo's planner receives meters. Origin is the floor's top-left corner;
 * x runs across room width, z along depth. Item coordinates mark its center.
 * The host owns all state; the renderer reports edits through callbacks. */
export interface RoomPlannerProps {
  room: RoomDimensions;
  products: readonly FurnitureProduct[];
  placedItems: readonly PlacedItem[];
  onItemChange: (item: PlacedItem) => void;
  onItemRemove: (instanceId: string) => void;
}

/** Shreya can replace the catalog without depending on the state provider. */
export interface FurnitureCatalogProps {
  products: readonly FurnitureProduct[];
  placedItems: readonly PlacedItem[];
  onAddProduct: (productId: string) => void;
}
