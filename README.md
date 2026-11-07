# Furney

**Your room. Your dimensions. Your budget.**

The initial React + TypeScript frontend for Furney, built for a Brown University hackathon. Includes a responsive landing page, room dimensions, replaceable demo catalog, selected furniture list, and estimated pricing. No backend, accounts, API keys, retailer listings, or AI calls.

## Run locally

Use Node.js **22.12+** (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). No environment variables are needed.

```sh
npm run test     # unit conversions, placement state, and price estimates
npm run build    # strict TypeScript check + production output in dist/
npm run preview  # serve the production build locally
```

After cloning with the included lockfile, `npm ci` provides a reproducible install. Refreshing resets the room; persistence is intentionally not implemented.

## Structure

```text
src/
  components/       Landing, room form, planner boundary, catalog, selection
  data/             Explicitly labeled demo products
  lib/units.ts      Feet/inches conversions and display formatting
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

`src/data/demoProducts.ts` is the single replaceable data source, passed into `PlannerProvider`. Replace it with normalized `FurnitureProduct[]`, keeping stable product IDs. The exported `FurnitureCatalogProps` boundary takes `products`, `placedItems`, and `onAddProduct(productId)`, so Shreya's component can replace `FurnitureCatalog` without owning placement or pricing state.

The current local search matches title/category, and category filters are derived from the supplied products. `imageUrl: null` uses a local illustration. Demo products have **no retailer URLs**. All demo prices are illustrative, with one intentionally unpriced item. `priceUSD: null` is excluded from the numeric subtotal and clearly flagged; it is never silently represented as a free item. Estimates exclude tax and delivery.

For asynchronous discovery later, add an explicit loading/error UI and a reducer action to update products in the central provider. Preserve product records referenced by placed items so selection/pricing remain resolvable. Never put live discovery state or calls inside the 3D renderer.

## Current scope

- Room dimensions accept whole feet/inches, 0–11 inches, and totals from 1 to 100 feet per axis. Invalid input leaves the existing room unchanged.
- Search, category filters, repeated additions, individual removal, clear-all, and price estimates work locally.
- Responsive layouts include a stacked mobile workspace, visible keyboard focus, labeled controls, screen-reader announcements, and reduced-motion support.
- AI discovery and interactive 3D planning are explicitly marked as future integrations; no simulated AI or retailer inventory is presented.

Vite setup follows the [Vite guide](https://vite.dev/guide/), with the [Tailwind Vite plugin](https://tailwindcss.com/docs/installation/using-vite).

## Verification

The production build and 13 unit tests pass. The dependency installation reports zero known vulnerabilities. The local Vite server responds with HTTP 200. Browser visual/interaction checks could not be completed in the development session because the in-app browser timed out connecting to the local server; desktop/mobile layouts still need a manual browser review.
