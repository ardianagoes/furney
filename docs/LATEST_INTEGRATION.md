# Latest teammate integration

Baseline: Furney main `c6c0ab4f2b9b10999281f0093f61cdc91136a3da`, including Shreya's matching changes merged in PR #5. PR #4 merges this baseline without rewriting history.

## Shreya

Preserved PR #5's matching implementation and attributes exactly, including its [source provenance at ecd9f15](https://github.com/shreya-sneha-dhakal/pixel-perfect-replica/tree/ecd9f15fedd90da6946b91a8a8e47d326123826a):

- Retained the seven corrected product descriptors: Linden, Marlo, Nordby, Rise, Nook, Arlo and Taper.
- Retained color families, +30 compatible-color bonus and conservative −20 recognized-mismatch penalty. Unknown/missing colors are not penalized; category, material, style and keyword rules remain.
- Retained all 23 matching regressions in main's existing photo-match.test.ts. Removed PR #4's duplicate regression file and carried its explicit UPPLAND-above-Marlo cream-sofa assertion into that suite.

The existing 21 catalog records, 15 images, IDs, meter dimensions, prices and retailer URLs are unchanged. Results still return canonical product objects to the existing Add to Room callback.

## Angelo

Adapted [main at 2e91b68](https://github.com/angelochen448/roomfit-furnish-finder/tree/2e91b68dd8b1dc453d51cd27b7f84b4347298762):

- Reused SeatingMesh, ShapeFurniture, deterministic upholstery microtextures, sloped/rolled arms, sectional depths, distinct cushions, and tapered/splayed/sled supports.
- Added only the appearance fields needed by these renderers to the derived SceneItem record. The shared FurnitureProduct, PlacedItem and RoomPlannerProps interfaces stay unchanged.
- plannerAdapter uses existing furnitureAttributes through productVisuals for colors and shapes. Small extensions distinguish office chairs, standing/wall desks, daybed rails and three-legged side tables. These are illustrative traits, without duplicated products, prices or dimensions.
- Every complete mesh is normalized to its actual catalog width/depth/height and grounded at y=0. Normalization measures transformed vertices, avoiding the inflated bounding boxes of angled legs. It runs when shape/dimensions change rather than during every drag.

Excluded: measurement diagrams, product/part importers, assembly extraction, Angelo's standalone catalog/UI, TanStack/server/auth/AI integrations. Furney's RoomScene camera, pointer dragging, room photo overlay and shared-state callbacks are retained.

## Placement

The existing reducer calls a pure free-space search. It tries center first, then contact positions from room and obstacle edges in deterministic distance order, then 90° orientation. Exact rotated footprints and existing fit/overlap rules remain authoritative. Edge contact is permitted; rectangular sectional bounds stay conservative. A full/too-small/too-low room falls back to the center with existing warnings; no item is removed or resized. It is a placement aid, not a walking-clearance or room-layout optimizer.

## AI and release safety

The existing OpenAI Responses handler, validation, rate limits, frontend request flow and server-only OPENAI_MODEL override are unchanged. Production's GPT-5.4 Mini selection remains controlled by Vercel configuration; no keys, environment files, environment variables or production credentials were changed.

`vercel.json` disables automatic Git deployments for **only** `codex/integrate-latest-teammate-improvements`, following [Vercel's branch-specific deployment setting](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled). Main and other branches retain their existing behavior. This PR is for review, with no automatic merge or deployment.

## Verification

After merging main at `c6c0ab4` (PR #5), all 133 tests and the production build passed again. The matching implementation and product attributes are byte-for-byte identical to that main revision; Angelo's rendering and automatic-placement implementation remain unchanged from PR #4's initial `a9b2a7f` commit. Duplicate matching regressions were consolidated into main's existing test suite.

- `npm ci`: passed, zero audit vulnerabilities.
- `npm test`: 133 passing tests. Includes all 23 Shreya regressions, geometry for all 21 products at 0°/90°, automatic placement, and real image bytes through the actual handler with mocked OpenAI transport into matches → Add → shared scene props → drag/rotate → price.
- `npm run build`: passed. The existing separately loaded Three.js/Drei scene bundle still triggers Vite's size advisory.
- Real HTTP smoke test against the existing production `https://furney.vercel.app`: stored chair image → Chairs, stored sofa image → Sofas. These were actual image-analysis requests, separate from mocks, and do not deploy this branch.
- Chrome desktop QA: distinct cream/rust seating and dining chair, automatic placement without overlap, pointer drag, rotation, numeric positioning, boundary warnings, manual photo matches → Add → WebGL, $2,746 shared total, MICKE query/category/ascending prices, and retailer links.
- Chrome 390px mobile QA: catalog/photo-search layout and manual results, no horizontal overflow (clientWidth and scrollWidth both 375px).

Browser automation's file-attachment helper requires the ChatGPT extension's optional file-URL permission, which was left unchanged. Therefore the full **live AI upload in the browser on this branch** was not verified as one continuous flow. Real production HTTP analysis, automated upload/handler/matching/state interactions, and live local WebGL interactions were checked separately. Review the integrated branch before merging and deploying it.
