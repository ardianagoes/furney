# Furney

**Your room. Your dimensions. Your budget.**

A furniture-planning web app built at **Emergent Hackathon 2026**. Furney brings together a real furniture catalog, photo-based discovery, and an interactive 3D room planner so you can explore layouts, check whether pieces fit, and estimate the cost of furnishing a space.

**[Try Furney](https://furney.vercel.app)** · **[Developer setup](docs/SETUP.md)**

## What Furney does

### 1. Find furniture

Browse **19 real IKEA US products**, search by name or category, sort by price, and follow links to the original listings. Furney uses a verified November 8, 2026 catalog snapshot, with product dimensions, local images, and listed prices.

**Search by photo** lets you upload an image of furniture and get catalog matches using optional OpenAI-powered image analysis. Category and style matching is also available without AI.

### 2. Plan your room in 3D

Enter your room's width, depth, and height, then add furniture to an interactive **React Three Fiber** scene. Move and rotate pieces, switch between angled and top-down views, and use numeric position controls for precision.

Furney checks furniture footprints against walls, ceiling height, and other placed pieces, warning you when something doesn't fit. An automatic placement aid looks for available space while keeping previous placements intact.

You can also upload a room photo and **manually align four floor corners** to use it as a perspective-corrected floor reference. A photo is not treated as a complete 3D scan.

### 3. Track your budget

Your selected furniture and estimated subtotal update as you add or remove pieces. Multiple instances of the same product are counted individually, and product links make it easy to check the retailer.

## How it's built

| Area | Technologies |
| --- | --- |
| Web app | React 19, TypeScript, Vite, Tailwind CSS 4 |
| 3D planning | Three.js, React Three Fiber, Drei |
| Furniture matching | Catalog ranking rules and optional OpenAI Responses API |
| Backend | Vercel serverless functions |
| Testing | Vitest, React Testing Library |

One shared React state model connects the catalog, 3D placements, fit warnings, and pricing. The 3D renderer uses illustrative, dimension-scaled geometry rather than exact manufacturer CAD models.

## Team

Built by **Ardian Agoes, Angelo Chen, and Shreya Dhakal** for **Emergent Hackathon 2026**.

- **Ardian:** Application integration, shared state, and connecting the planner, catalog, and search workflows
- **Angelo:** Interactive 3D room planning, furniture visualization, and room-photo alignment
- **Shreya:** Furniture catalog, photo-based matching, and product discovery

## Project scope

Furney is a **hackathon prototype**, not a live furniture marketplace. Catalog prices reflect a November 8, 2026 snapshot, not real-time prices or availability; totals exclude tax and delivery. 3D furniture shapes are illustrative, and fit checks use approximate footprints rather than full installation or walking-clearance requirements.

Furniture photo search has a manual fallback when AI is unavailable. **Experimental AI room-photo analysis remains disabled by default** pending live validation; manual floor alignment works without it. Room layouts are not saved between page refreshes.

For installation, API configuration, tests, deployment, and technical limitations, see **[Developer Setup](docs/SETUP.md)**. The [final submission notes](docs/FINAL_SUBMISSION.md) and [IKEA catalog sources](docs/ikea-catalog-sources.json) document the verified product data and feature scope.
