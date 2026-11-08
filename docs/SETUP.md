# Furney: developer setup

This guide covers local development, configuration, testing, and deployment. For the project overview, see the [README](../README.md).

## Requirements

- Node.js **22.12 or newer** (Node 24 recommended)
- npm
- A modern browser with WebGL2 for the interactive 3D scene

The furniture catalog, manual photo matching, pricing, and numeric placement controls work without an OpenAI API key. If WebGL2 is unavailable, the 3D scene may not load, but the rest of the workspace is available.

## Run locally

```sh
git clone https://github.com/ardianagoes/furney.git
cd furney
npm ci
npm run dev
```

Open the address printed by Vite, usually `http://localhost:5173`.

Furney is a React + TypeScript single-page app built with Vite. The room planner uses React Three Fiber, Three.js, and Drei. Furniture, placement, and pricing all share one React state provider.

**Data is session-only:** refreshing the page resets the room, selected furniture, and any uploaded reference photo.

## Optional furniture-photo AI

1. Copy `.env.example` to `.env.local`. The latter is ignored by Git.
2. Add a server-side OpenAI key:

   ```dotenv
   OPENAI_API_KEY=your_private_key
   OPENAI_MODEL=gpt-4.1-mini
   ```

3. Restart `npm run dev`.

The model is configurable; the production deployment has previously used `gpt-5.4-mini`. The Vite dev server serves `/api/photo-search` through local middleware, while Vercel uses `api/photo-search.ts`. Do not use `VITE_OPENAI_API_KEY` or commit your credentials.

Photo search uploads are restricted to JPG, PNG, or WebP images of up to 3 MiB. Descriptions and matches are estimates, and results are ranked against the existing product catalog. Manual category/style matching works without the API.

See [PHOTO_SEARCH.md](PHOTO_SEARCH.md) for request validation, rate limits, privacy, error handling, and opt-in live testing.

## Room photographs and floor calibration

A separate **Room photo** control accepts a JPG, PNG, or WebP image of up to 8 MiB as a local floor reference. In **Align Floor**, identify four floor corners to project the photo onto the measured room floor. Manual calibration requires no AI and does not infer actual measurements from a photograph.

Experimental room-photo analysis is implemented but **disabled by default** while live validation is incomplete. For controlled testing only, enable both flags in the relevant frontend/server environments:

```dotenv
VITE_ENABLE_ROOM_ANALYSIS=true
ENABLE_ROOM_ANALYSIS=true
```

The feature also requires the server-side OpenAI configuration above. Do not describe it as a fully validated production feature. For the geometry and feature gates, see [FLOOR_CALIBRATION.md](FLOOR_CALIBRATION.md) and [FINAL_SUBMISSION.md](FINAL_SUBMISSION.md).

## Test and build

```sh
npm test           # Vitest automated tests
npm run build      # TypeScript check + production build into dist/
npm run preview    # Preview the static production build
```

`npm run preview` does not provide Vite's development API middleware, so live photo analysis requires a deployed API or the development server.

When the AI endpoint is properly configured, you can opt into a real provider smoke test:

```sh
npm run test:vision
```

This makes actual OpenAI requests and can incur charges. Regular automated tests mock provider transport. See the [final submission verification](FINAL_SUBMISSION.md) for the recorded test scope and limitations.

## Deploy to Vercel

Use the existing repository with the **Vite** framework preset, `npm run build` as the build command, and `dist` as the output directory. The `api/` directory contains the Vercel serverless endpoints. Configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as **server-side** Vercel environment variables, then redeploy. Leave the experimental room-analysis flags unset until separately validated.

The product catalog is a November 8, 2026 snapshot of 19 IKEA US listings with local copies of official product imagery. There is no runtime retailer price or inventory feed. See [the source record](ikea-catalog-sources.json) for verification and [FINAL_SUBMISSION.md](FINAL_SUBMISSION.md) for product scope.

## Architecture reference

- `src/components/room/`: 3D renderer, furniture geometry, floor and camera
- `src/components/PhotoSearch.tsx` and `src/lib/photo-match.ts`: furniture-photo and manual matching
- `src/data/furnitureProducts.ts`: catalog product records
- `src/state/`: shared room, placement, catalog, and price state
- `src/lib/plannerAdapter.ts` and `src/lib/floorCalibration.ts`: scene and floor coordinate conversion
- `api/` and `server/`: server-side photo endpoints and validation

Historical integration and test results are recorded in [LATEST_INTEGRATION.md](LATEST_INTEGRATION.md). The UI requires no accounts, payment information, or database.
