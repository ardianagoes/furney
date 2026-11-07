# Furney

**Your room. Your dimensions. Your budget.**

The React + TypeScript frontend for Furney, built for a Brown University hackathon. Includes a responsive landing page, room dimensions, Shreya's sample and IKEA-linked furniture catalog, selected furniture list, and estimated pricing. No backend, accounts, API keys, or AI calls.

## Run locally

Use Node.js **22.12+** (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). No environment variables are needed.

```sh
npm run test     # conversions, catalog data/controls, shared placements, and costs
npm run build    # strict TypeScript check + production output in dist/
npm run preview  # serve the production build locally
```

After cloning with the included lockfile, `npm ci` provides a reproducible install. Refreshing resets the room; persistence is intentionally not implemented.

## Structure

```text
src/
  components/       Landing, room form, planner boundary, catalog, selection
  assets/furniture/ 15 local sample product images from Shreya's repository
  data/             Imported 21-product catalog and data-integrity tests
  lib/              Unit formatting, catalog search/sort, retailer link validation
  state/            Central reducer, provider, estimate selector, unit tests
  types/index.ts    Shared product, room, placement, and integration contracts
  App.tsx           Application composition
  styles.css        Tailwind v4 + responsive component styles and design tokens
```

## Integration: Angelo's 3D planner

Replace `src/components/RoomPlannerPlaceholder.tsx` with Angelo's React Three Fiber component, or import it in `PlannerWorkspace.tsx` in place of the placeholder. The host already supplies the exported `RoomPlannerProps` contract:

```tsx
<RoomPlanner
  room={state.room}
  products={state.products}
  placedItems={state.placedItems}
  onItemChange={item => dispatch({ type: 'item/update', item })}
  onItemRemove={instanceId => dispatch({ type: 'item/remove', instanceId })}
/>
```

- All dimensions and coordinates are **meters**. Feet/inches exist only at the form/display boundary.
- Floor origin: top-left; `xM` increases across room width, `zM` along room depth; the floor is `y = 0`. Item coordinates refer to the **center** of the footprint.
- Rotations are `0 | 90 | 180 | 270` degrees around the vertical axis; 0 aligns the product width with the room x-axis.
- The central reducer creates a unique instance at the room center on every add. Repeated products are separate instances and count separately in the estimate. New instances initially overlap; the renderer will handle arranging them.
- The renderer reports a complete `PlacedItem` through `onItemChange`, retaining its `instanceId` and `productId`. Reducer validation prevents nonfinite/out-of-room centers and product identity changes. Room resizing clamps existing centers to the room boundary.
- Collision detection, footprint containment, camera controls, picking, and dragging belong to Angelo's integration. The current reducer checks centers only; adding an oversized piece does not claim it will fit.
- The current room artwork is static, decorative SVG. **No Three.js/R3F engine or competing placement implementation is included.** Selections are listed and counted, but are not drawn in the placeholder.

## Integration: Shreya's catalog

`src/data/furnitureProducts.ts` is the single catalog source, passed into the existing `PlannerProvider`. It imports all **21 records** from [Shreya's catalog](https://github.com/shreya-sneha-dhakal/pixel-perfect-replica/blob/acffabaf350a3687f87f14a90e3936857f3e1bc7/src/data/furnitureProducts.ts) at commit `acffabaf350a3687f87f14a90e3936857f3e1bc7`: 15 sample products and six IKEA-linked products. Product IDs, dimensions in meters, prices, and retailer URLs are preserved. All **15 local JPEGs** are copied unchanged to `src/assets/furniture/`; each imported file's Git blob hash was checked against that source commit. Vite bundles these images for production. The sample images are AI-generated illustrations according to the source catalog. IKEA image URLs remain external and use an image-unavailable fallback if loading fails.

Search, category filtering, and price sorting are adapted to Furney's existing catalog panel, without importing Shreya's TanStack application, routes, server, configuration, styling system, or UI dependencies. Featured order preserves source order. Both price sort directions place unpriced products last. The scrollable results keep the expanded catalog inside the existing workspace on desktop and mobile.

Sample cards are explicitly labeled **Sample product**. IKEA-linked cards display an **IKEA link** label and open the supplied product page in a new tab with `noopener noreferrer`. Prices are labeled sample/imported estimates, **not live or independently verified by Furney**. Check retailer pages for current details; this import performs no scraping or price refresh. `priceUSD: null` is excluded from the numeric subtotal and clearly flagged. Estimates retain cents, count each placed instance, and exclude tax and delivery.

The exported `FurnitureProduct`, `PlacedItem`, and `RoomPlannerProps` interfaces are unchanged. The existing `FurnitureCatalogProps` boundary takes `products`, `placedItems`, and `onAddProduct(productId)`. Every Add to Room calls the host, which creates a unique placed item through the same reducer used by Angelo's future planner. Filtering and sorting never remove or alter selections. The landing page, room dimensions form, and planner placeholder remain unchanged.

For asynchronous discovery later, add an explicit loading/error UI and a reducer action to update products in the central provider. Preserve product records referenced by placed items so selection/pricing remain resolvable. Never put live discovery state or calls inside the 3D renderer.

## Current scope

- Room dimensions accept whole feet/inches, 0–11 inches, and totals from 1 to 100 feet per axis. Invalid input leaves the existing room unchanged.
- Search, category filters, price sorting, repeated additions, individual removal, clear-all, and price estimates work locally.
- Responsive layouts include a stacked mobile workspace, visible keyboard focus, labeled controls, screen-reader announcements, and reduced-motion support.
- AI discovery and interactive 3D planning are explicitly marked as future integrations; no simulated AI or retailer inventory is presented.

Vite setup follows the [Vite guide](https://vite.dev/guide/), with the [Tailwind Vite plugin](https://tailwindcss.com/docs/installation/using-vite).

## Verification

Run `npm test` and `npm run build`. Tests cover the 21-product import, all 15 local JPEG references, combined search/category/sort behavior, unavailable prices/images, external link attributes, and adding every imported product through the existing reducer. DOM integration tests exercise the actual Furney app: adding samples and duplicate IKEA products, canvas counts, totals with cents, individual removal, and clearing the room. They also exercise searching, filtering, both price sort directions, and resetting empty results. Desktop/mobile visual review remains manual; the in-app browser could not reach the local server in the initial frontend development session.
