# Final submission update

Historical submission notes. The [November 10 security audit](SECURITY_AUDIT.md) and [current setup](SETUP.md) supersede the AI deployment instructions here: paid public endpoints are now closed, while manual planning and matching remain functional.

Based on main at 70d7366 (PRs #1–#5 already integrated). Work is on codex/final-ikea-room-analysis; no automatic merge or deployment.

## IKEA catalog: ready

All 15 fictional public products and their illustrative images have been removed. The catalog contains 19 real IKEA US listings: the existing six plus POÄNG, STRANDMON, MALM queen, NEIDEN twin/Luröy, two MORABO variants, two LAGKAPTEN/ALEX desks, three LISABO tables, a LISABO chair and TROTTEN.

Official listing JSON-LD, assembled measurement sections, material descriptions and official product images were retrieved on November 8, 2026. Every source URL, article number, price snapshot, original inch measurements, axis mapping and official image URL is recorded in [ikea-catalog-sources.json](ikea-catalog-sources.json). Images are cached locally for reliable display; there is no runtime scraping. Prices/availability can change; no delivery or stock promise is made.

Meters use inches × 0.0254. Bed depth uses assembled frame length, not mattress length; bed height includes the headboard. Round tables use diameter on both floor axes. MORABO chaise uses its full 62¼-inch depth. Long rectangular tables/desks align their long side with local X; the old LACK coffee-table orientation was corrected accordingly. MALM needs separately sold slats/mattress; NEIDEN includes Luröy slats but not a mattress. Style/shape tags and 3D models are approximate visual descriptions, not manufacturer CAD.

Existing search, categories, both price sorts, photo matching, Add to Room, shared placements, movement/rotation, warnings, retailer links and cent-accurate totals are retained. Tests use real IKEA records or isolated fixtures instead of fictional public catalog entries.

## Room analysis: implemented, disabled pending live validation

Angelo's RoomPhotoAnalysis, room-photo, room-photo.server, RoomPlanner and RoomScene were reviewed at 64866ec5ea4b38890ecabc56e2c9cc8027f5a0ee. The normalized-image floor/contact schema, projection and camera-calibration approach were adapted. No TanStack, Lovable gateway, independent catalog or placement store was imported.

When enabled, Room photo → Analyze Room compresses an in-memory image, calls /api/room-photo and estimates furniture floor contacts. Approximate alignment uses manually entered room dimensions. Accepted occupied areas are editable/removable, rendered in amber, included in shared-state automatic placement and overlap warnings, and excluded from pricing. Uncertain/unprojectable detections remain identified for review without active areas. Clear/remove photo or change room dimensions to reset detections. Manual camera/translation changes retain accepted meter areas; reapply alignment explicitly to recalculate them.

The endpoint reuses existing image/MIME/signature/size validation, rate limiting and same-origin checks. OpenAI Responses uses server-only OPENAI_API_KEY and OPENAI_MODEL, store:false, structured output, bounded fields and a timeout; uploaded photos are not stored or logged. The existing furniture-photo endpoint retains its original analysis behavior.

Production's existing OPENAI_API_KEY and OPENAI_MODEL=gpt-5.4-mini are already configured and working for furniture photo search. A missing local key is **not** a production configuration problem. No credentials or production environment variables were changed.

Both room-analysis UI and endpoint are disabled by default. After live testing in a controlled environment, enable with:

- VITE_ENABLE_ROOM_ANALYSIS=true for the intended frontend build.
- ENABLE_ROOM_ANALYSIS=true for its server environment.
- Reuse the existing OPENAI_API_KEY and OPENAI_MODEL; do not expose them with a VITE_ prefix.

These flags were not set in Production. Until then the original room-photo reference and manual camera controls work normally. One photo never supplies exact room dimensions or a complete 3D reconstruction.

## Verification

All 139 tests in 16 files and the production build pass. Automated tests cover actual IKEA image bytes, canonical products/dimensions/prices, all product geometry, matching, shared-state add/move/rotate/remove/price/warnings, and automatic placement. Room tests cover structured response validation, object-cover mapping, measured-scale projection, low-confidence detections, occupied-area placement/clearing, furnished-room bytes through validation with mocked OpenAI, provider errors and the disabled endpoint.

The furnished-room fixture is an official IKEA STRANDMON room photograph, with its source beside the fixture. OpenAI is mocked in room tests; live room recognition/alignment and a continuous browser room-analysis flow have **not** been verified. Deadline scope keeps the new feature disabled. No new browser QA or live API success is claimed for this final branch. The existing lazy Three.js/Drei bundle-size advisory remains.

Run npm test and npm run build. Existing npm run test:vision now sends actual IKEA chair/sofa photos to a configured furniture-photo endpoint. Do not treat mocked tests as proof of live recognition.
