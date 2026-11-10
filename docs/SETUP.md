# Furney: developer setup

For an overview, see the [README](../README.md). For the current security/cost decision and account controls, see [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## Requirements and local development

Use Node.js 22.12+ (Node 24 recommended), npm, and a WebGL2-capable browser.

```sh
git clone https://github.com/ardianagoes/furney-emergent-hackathon.git
cd furney-emergent-hackathon
npm ci
npm run dev
```

Open the address printed by Vite. No credentials are required for the 19-product IKEA catalog, manual category/style matching, Add to Room, pricing, camera controls, fit warnings, or room-photo floor calibration. Geometry is illustrative; catalog prices are November 8, 2026 snapshots. Refreshing clears layouts/photos.

## Optional, billable LOCAL testing

Paid AI is intentionally unavailable on deployed routes, even if an OpenAI key or the old room-analysis flags exist. Production client code also avoids uploading images for AI. There is no production-enabling environment flag in this revision. Do not expose a Vite development server publicly.

To test the existing OpenAI adapter **on your own loopback development machine**:

1. Copy `.env.example` to ignored `.env.local`.
2. Set server-only `ENABLE_LOCAL_AI=true`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`. The adapter default remains `gpt-4.1-mini`; production previously used its configured `gpt-5.4-mini` override. Do not prefix a key with `VITE_`.
3. Restart `npm run dev`. Choosing a photo may now incur OpenAI usage charges. Missing keys are reported honestly; no classification is simulated.
4. Set `ENABLE_LOCAL_AI=false` and restart when finished.

Only Vite's development middleware passes the internal local capability; the handler also checks the actual loopback socket and refuses Vercel/production processes. Five attempts/minute and one concurrent operation per handler limit local bursts only; these are not distributed production quotas. Vercel functions cannot be unlocked with this local flag.

Local analysis accepts nonanimated JPG/PNG/WebP up to 3 MiB, 4096 pixels per edge and 12 megapixels. The server checks headers/structure, not a full image decode. Upload reading is limited to five seconds; provider calls time out at 20 seconds (furniture) / 25 seconds (room), with bounded output.

## Room photographs

The separate Room photo control accepts a local reference up to 8 MiB. Align Floor uses four corners and entered measurements; it is not a 3D reconstruction. Local reference photos are not sent to AI unless a separate enabled local analysis is requested.

Experimental room analysis requires local AI above, plus `VITE_ENABLE_ROOM_ANALYSIS=true` and server-only `ENABLE_ROOM_ANALYSIS=true` for controlled development. It remains unverified with live AI in this audit and closed on public deployments. See [FLOOR_CALIBRATION.md](FLOOR_CALIBRATION.md) for its shared geometry contract.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run check:public
npm run audit:secrets
npm audit
npm run preview
```

Regular tests mock OpenAI and incur no provider charges. The build/public checks reject server adapter identifiers, secret canaries and suspicious credential patterns in browser artifacts. The heuristic secret scanner includes locally available deleted/history blobs; it cannot prove all secrets absent.

`npm run preview` serves the static SPA without analysis APIs. The optional `npm run test:vision` can send two billable requests; it refuses to run without `CONFIRM_BILLABLE_AI_TEST=yes`. It is never part of CI or this audit. Do not run it against someone else's server.

## Deployment and future public AI

Use the existing repository, Vite preset, `npm run build`, and output `dist`. This PR does not deploy or modify production settings. Its branch preview deployment is disabled in vercel.json. The API functions return safe disabled responses without reading uploads or contacting OpenAI. Manual features need no Vercel/OpenAI environment variables.

Before public paid AI can be restored, implement and test an atomic shared quota/attempt budget and concurrent-operation leases across both routes/instances, with fail-closed behavior when state is unavailable. Origin checks, hidden buttons and in-memory counters do not provide this. Account/edge safeguards and legacy deployments also need owner review; see the [security audit](SECURITY_AUDIT.md).

## Code and extended references

- `src/state/`: shared room, placement, catalog and pricing state
- `src/components/room/`: renderer, furniture, floor and camera
- `src/lib/photo-match.ts`: Shreya's category-first matching rules
- `server/`, `api/`: policy, validation and optional server-only OpenAI adapters
- [Catalog source record](ikea-catalog-sources.json), [photo search](PHOTO_SEARCH.md), [calibration](FLOOR_CALIBRATION.md), and [license status](LICENSE_STATUS.md)
- [Final submission](FINAL_SUBMISSION.md) and [teammate integration](LATEST_INTEGRATION.md) are historical implementation/verification notes; this audit supersedes their deployment-enabling instructions.
