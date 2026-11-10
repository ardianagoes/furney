# Furney

Furney is a furniture discovery and interactive 3D room-planning application built at Emergent Hackathon 2026.

[Live website](https://furney.vercel.app/)

## Features

- **Furniture discovery:** Browse 19 real IKEA US products, search and filter by category, sort by price, and open original retailer listings. Dimensions, local product images, and prices come from a verified November 8, 2026 snapshot; prices and availability can change.
- **AI-assisted photo search, when configured:** The server-only OpenAI adapter describes furniture and ranks matches from the existing catalog. Paid AI endpoints are disabled on public deployments until durable usage controls are available. Explicit local testing is optional; manual category/style matching works without credentials.
- **Interactive 3D room planning:** Enter measured room dimensions, add furniture, drag and rotate pieces, and switch between angled and top-down views. Fit warnings and estimated totals use shared placements. Room photographs support manual four-corner floor alignment; they do not produce an accurate 3D reconstruction.

Furniture geometry is illustrative, totals exclude tax and delivery, and layouts reset on refresh. Experimental AI room analysis is separate from furniture search and remains unavailable on public deployments.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, and Drei. Optional server adapters use Vercel functions and OpenAI. Tests use Vitest and React Testing Library.

## Run locally

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run typecheck
npm run build
```

See [setup](docs/SETUP.md), [security and cost audit](docs/SECURITY_AUDIT.md), and [catalog sources](docs/ikea-catalog-sources.json) for details.

## Team

- Ardian Agoes — application integration and shared state.
- Angelo Chen — 3D planning and furniture visualization.
- Shreya Dhakal — catalog, photo matching, and product discovery.

No project-wide open-source license is granted; see [license status](docs/LICENSE_STATUS.md).
