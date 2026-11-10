# Furniture photo search

The UI/ranking/attributes were adapted from [Shreya's implementation at 57e756b](https://github.com/shreya-sneha-dhakal/pixel-perfect-replica/tree/57e756b6bc0daa5f043ada909f07035ad2e0ca43/src). The app uses Vite, not TanStack Start. Matches reference the canonical 19-product IKEA catalog and use the shared Add to Room callback, dimensions, price totals and 3D placements.

## Current availability

**Manual search works without AI:** open Search by Photo, choose category/style, and Find matches. Results are explicitly labeled manual; no image is classified. Catalog search, filters and sorting stay independent.

**Paid AI routes are closed on public deployments in the audited revision.** Production frontend code avoids sending photos to these routes, and the server independently returns 503 before reading images or contacting OpenAI. Existing production keys/flags do not unlock these routes. This change applies only after an owner deploys the code; it does not change the running site automatically.

The OpenAI furniture adapter remains available for explicit loopback development testing. See [SETUP.md](SETUP.md) for local opt-in, and [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for why a durable shared usage guard is required before any public paid launch. No paid infrastructure is provisioned.

## Validation and privacy

- One JSON data URL, JPG/PNG/WebP only; no remote URL/model/prompt parameters.
- Up to 3 MiB decoded, canonical base64, valid file signatures/structure and bounded dimensions: 4096 pixels/edge, 12 megapixels. Animated PNG/WebP and truncated headers are rejected. These checks are not a complete image decoder or malware scan.
- Five-second upload deadline. Local calls have one in-flight operation and five attempts/minute. These local counters are explicitly not production spend protection.
- Fixed HTTPS OpenAI host, redirects rejected, no automatic retries, furniture image detail low, maximum 500 output tokens and 20-second provider timeout. Room analysis is separate (high detail, maximum 4000 output tokens, 25 seconds).
- Provider JSON is limited to 128 KiB. Provider errors/photos/keys are not logged or returned; structured descriptors are checked before display. Requests use `store:false`, which does not itself override OpenAI's retention policies.
- Images exist transiently in browser/server memory; the application does not save them to disk, databases or analytics. Closing/clearing cancels the client request; local disconnect signals propagate to the provider operation. Cancellation cannot guarantee a provider refund.
- Manual results, uncertainty, failures, and missing configuration are explicit. Descriptions never invent catalog products, dimensions, retailer quotes, or placements.

## Verification history

Earlier integration notes recorded successful chair/sofa classifications against a configured production service, and an earlier preview was authentication-protected. Those observations are historical, not proof of current security or AI availability. This security audit made **no billable image-analysis requests**. Its tests use real image bytes with mocked provider transport, plus production-route denial and manual fallback tests.

The opt-in live smoke script requires `CONFIRM_BILLABLE_AI_TEST=yes` and is excluded from normal tests/CI. Keep it pointed only at an owned, explicitly enabled local server. This audit supersedes older instructions suggesting that a Vercel key alone safely enables public photo search.
