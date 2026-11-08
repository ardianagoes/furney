# Furney

Final submission catalog: **19 real IKEA US products**, verified November 8, 2026, with local official images and snapshot prices. All fictional public products are removed. See [final submission notes](docs/FINAL_SUBMISSION.md) and [listing sources](docs/ikea-catalog-sources.json) for current behavior and verification. Experimental room-photo analysis is implemented but disabled by default pending live validation; existing Production furniture photo search and server-side OpenAI configuration are preserved. Earlier integration details below describe historical milestones.

**Your room. Your dimensions. Your budget.**

The React + TypeScript frontend for Furney, built for a Brown University hackathon. Includes a responsive landing page, room dimensions, Angelo's interactive React Three Fiber room planner, Shreya's catalog and photo/manual matching, selected furniture list, and estimated pricing. The optional OpenAI image-analysis endpoint requires a server-side key; all manual search and room planning work without one. The 3D view requires WebGL2; catalog, pricing, and numeric placement controls remain available if 3D cannot start.

## Run locally

Use Node.js **22.12+** (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). No environment variables are needed.

To enable actual photo analysis, set server-side `OPENAI_API_KEY` in ignored `.env.local` (locally) or Vercel environment variables (deployment), then restart/redeploy. See [photo-search setup and real verification](docs/PHOTO_SEARCH.md). Without it, uploaded photos receive a clear unavailable message and manual category/style matching works. No successful live AI analysis is claimed from mocked tests.

```sh
npm run test     # coordinates, fit, real mesh geometry, shared-state UI, and costs
npm run build    # strict TypeScript check + production output in dist/
npm run preview  # serve the production build locally
```

After cloning with the included lockfile, `npm ci` provides a reproducible install. Refreshing resets the room; persistence is intentionally not implemented.

## Structure

```text
src/
  components/       Landing, room form, shared-state planner host, catalog, selection
    room/           Angelo's adapted scene, dimensioned meshes, and WebGL boundary
  assets/furniture/ 15 local sample product images from Shreya's repository
  data/             Imported 21-product catalog and data-integrity tests
  lib/              Units, catalog controls, scene coordinate adapter, fit/geometry rules
  state/            Central reducer, provider, estimate selector, unit tests
  types/index.ts    Shared product, room, placement, and integration contracts
  App.tsx           Application composition
  styles.css        Tailwind v4 + responsive component styles and design tokens
```

`api/photo-search.ts` is the Vercel serverless entry point; `server/` contains image validation, rate limiting, and the OpenAI adapter. Vite runs the same handler as local dev middleware. `src/components/PhotoSearch.tsx`, `src/lib/photo-match.ts`, and `src/data/furnitureAttributes.ts` adapt Shreya's browser UI, ranking rules, and product descriptors. No new runtime dependencies are required.

## Integration: Angelo's 3D planner

`src/components/RoomPlanner.tsx` replaces the static placeholder and accepts the unchanged `RoomPlannerProps` contract. It adapts Angelo's [RoomScene, FurnitureMesh, geometry scaling, camera rig, dragging, and fit rules](https://github.com/angelochen448/roomfit-furnish-finder/tree/f541bc9f521201cccc1e0b15aaa58abc3bb5c284/src) from commit `f541bc9f521201cccc1e0b15aaa58abc3bb5c284`. The source scene components and pure rules carry provenance comments.

```tsx
<RoomPlanner
  room={state.room}
  products={state.products}
  placedItems={state.placedItems}
  onItemChange={item => dispatch({ type: 'item/update', item })}
  onItemRemove={instanceId => dispatch({ type: 'item/remove', instanceId })}
/>
```

- The renderer derives `SceneItem[]` from Furney's `products` and `placedItems` on every shared-state update. There is **no second catalog or placement state**. Local UI state is limited to selection, camera, grid visibility, and an optional reference photo.
- All dimensions and coordinates remain **meters**. Feet/inches exist only at the form/display boundary. Furney's floor origin is the top-left corner; `xM` increases across room width and `zM` along room depth. Coordinates refer to the **center** of a product's footprint; the floor is `y = 0`.
- `src/lib/plannerAdapter.ts` converts to Angelo's center-origin scene with `x = xM - room.widthM / 2` and `z = zM - room.depthM / 2`. The inverse adds the half-extents. No axis or rotation sign is flipped. Rotations remain `0 | 90 | 180 | 270` around positive Y; 0 aligns product width with the x-axis. At 90/270 degrees width/depth swap for fit checks.
- Catalog and photo-match Add to Room use the same reducer to create unique instances. Automatic placement tries the center, then free boundary/contact positions, and a quarter turn if needed. It respects rotated footprints, walls and ceilings, and never moves existing pieces. If the room is full or the product is oversized, it falls back to the center and the existing fit warnings remain visible. Pricing counts every instance.
- Select a mesh by clicking/tapping it, then drag along the floor. Angelo's ray/plane intersection and pointer capture are retained. Dragging snaps to 5 cm; centers are clamped **after snapping** to avoid losing pieces or rejecting movements at room edges that are not multiples of 5 cm. Pointer cancellation/lost capture ends a drag.
- Use the selected-piece dropdown for keyboard selection, X/Z inputs for exact positions, the rotate button for quarter turns, and Remove for deletion. All changes go through `onItemChange`/`onItemRemove` into the existing reducer. The numeric controls use Furney's corner-origin meters.
- Fit checks use rotated bounding footprints and product height, not just center positions. Red outlines and warnings identify wall/ceiling violations or overlaps. Edge touching is allowed within a small numeric tolerance. Rugs may sit beneath other pieces. Warnings are advisory: overlapping/oversized pieces remain editable. Room resizing clamps centers and immediately recomputes fit warnings.
- Categories map sofas, chairs, beds, desks, tables, lighting, rugs, and storage to Angelo's procedural geometry. Unknown categories use a simple box. Geometry is normalized to **the catalog's full width/depth/height**, centered in x/z, and grounded at y=0 for every category. Models are illustrative, not manufacturer-exact meshes; a sectional's overall rectangular footprint is conservative.
- Angelo's height, distance, tilt, turn, and lens-width camera controls are available under **Camera controls**, with Reset view and a grid toggle. Applying new room dimensions resets the view to frame the new space. The 3D code loads in a separate bundle and uses capped pixel density for smaller screens.
- **Room photo** adds a local JPG/PNG/WebP reference up to 8 MB. It stays in memory, is never uploaded, and is released on replacement/removal/unmount. The canvas overlays the photo with a transparent floor; align it manually with the camera controls. A photo does **not** reconstruct a room or infer measurements. No sample photo, AI, retailer import server, authentication, or TanStack Start code is included.

## Integration: Shreya's catalog

`src/data/furnitureProducts.ts` is the single catalog source, passed into the existing `PlannerProvider`. It imports all **21 records** from [Shreya's catalog](https://github.com/shreya-sneha-dhakal/pixel-perfect-replica/blob/acffabaf350a3687f87f14a90e3936857f3e1bc7/src/data/furnitureProducts.ts) at commit `acffabaf350a3687f87f14a90e3936857f3e1bc7`: 15 sample products and six IKEA-linked products. Product IDs, dimensions in meters, prices, and retailer URLs are preserved. All **15 local JPEGs** are copied unchanged to `src/assets/furniture/`; each imported file's Git blob hash was checked against that source commit. Vite bundles these images for production. The sample images are AI-generated illustrations according to the source catalog. IKEA image URLs remain external and use an image-unavailable fallback if loading fails.

Search, category filtering, and price sorting are adapted to Furney's existing catalog panel, without importing Shreya's TanStack application, routes, server, configuration, styling system, or UI dependencies. Featured order preserves source order. Both price sort directions place unpriced products last. The scrollable results keep the expanded catalog inside the existing workspace on desktop and mobile.

Sample cards are explicitly labeled **Sample product**. IKEA-linked cards display an **IKEA link** label and open the supplied product page in a new tab with `noopener noreferrer`. Prices are labeled sample/imported estimates, **not live or independently verified by Furney**. Check retailer pages for current details; this import performs no scraping or price refresh. `priceUSD: null` is excluded from the numeric subtotal and clearly flagged. Estimates retain cents, count each placed instance, and exclude tax and delivery.

The exported `FurnitureProduct`, `PlacedItem`, and `RoomPlannerProps` interfaces are unchanged. The existing `FurnitureCatalogProps` boundary takes `products`, `placedItems`, and `onAddProduct(productId)`. Every Add to Room calls the host, which creates a unique placed item through the same reducer used by the 3D planner. Filtering and sorting never remove or alter selections. The landing page, room dimensions form, catalog panel, and pricing UI are preserved.

For asynchronous discovery later, add an explicit loading/error UI and a reducer action to update products in the central provider. Preserve product records referenced by placed items so selection/pricing remain resolvable. Never put live discovery state or calls inside the 3D renderer.

## Current scope

- Room dimensions accept whole feet/inches, 0–11 inches, and totals from 1 to 100 feet per axis. Invalid input leaves the existing room unchanged.
- Search, category filters, price sorting, repeated additions, individual removal, clear-all, and price estimates work locally.
- Responsive layouts include a stacked mobile workspace, visible keyboard focus, labeled controls, screen-reader announcements, and reduced-motion support.
- Interactive 3D selection, dragging, quarter-turn rotation, removal, fit warnings, and a manual room-photo overlay work locally. Furniture photo search is separate from the room-photo overlay: matching uses the existing catalog, with manual fallback and optional server-side OpenAI analysis. Retailer prices remain imported estimates.

Vite setup follows the [Vite guide](https://vite.dev/guide/), with the [Tailwind Vite plugin](https://tailwindcss.com/docs/installation/using-vite).

## Verification

See [latest teammate integration notes](docs/LATEST_INTEGRATION.md) for the imported source commits, product appearances, automatic placement, production AI smoke test and review/deployment limits.

Run `npm test` and `npm run build`. The 133 tests cover the catalog, unit conversion, coordinate round trips, all quarter-turn orientations, snapping/clamping, wall/height/overlap rules, exact geometry for all 21 products, shared-state callbacks, automatic placement (including narrow gaps, rotated obstacles and full-room fallback), pricing, Shreya's 23 matching regressions, request/image validation, rate limits, provider errors, manual fallback, and upload-to-placement integration. App DOM tests replace only the WebGL canvas; mesh tests inspect actual R3F geometry without a GPU. OpenAI transport is mocked in automated tests. Use the opt-in `npm run test:vision` against a configured server for real chair/sofa analysis.

Live Chrome QA additionally verified catalog-to-WebGL additions, pointer dragging, rotation, removal, overlap and wall warnings, precise positioning, and layouts at desktop and a 390px mobile viewport (no horizontal page overflow). WebGL support varies by device; use the fallback controls if it is unavailable. The production build emits a separate, relatively large Three.js/Drei scene bundle; Vite's size advisory is expected. No renderer or camera code was added to the landing page.
