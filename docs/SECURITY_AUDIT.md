# Security and cost audit — November 10, 2026

Repository: `ardianagoes/furney-emergent-hackathon`. Baseline: latest main `548ac8d`.
This is a code/history review and focused test pass, not a penetration test,
account audit, or absolute security guarantee. No billable AI requests were made.
No production credentials, account settings, deployment or substantive history
were changed. **A PR does not secure the currently running deployment.**

## Findings and financial exposure

### Critical: none identified within the inspected scope

No credential-pattern matches were found in the initial 117 tracked files or
240 locally available Git blobs (4,595,056 bytes), spanning 30 commits, fetched
PR heads #1–#10, deleted files, and two unreachable blobs. Only an empty-key
`.env.example` was tracked, including historical environment paths. No tracked
private keys, `.vercel` credentials, dependencies, build output, logs, personal
room uploads or generated build state were identified. The room fixture has an
IKEA source record. Historical product images are legitimate project assets,
not credentials. The reproducible scanner reports rules/locations, never values.

These checks are heuristic: arbitrary/encoded credentials, unfetched forks,
hidden refs, past CI artifacts, provider logs and secrets in account settings
are outside this result. Enable GitHub secret scanning/push protection and use
an independent scanner periodically. Rotate/revoke any actual discovered key
immediately; deleting a file or rewriting Git alone is insufficient.

### High — H1: anonymous paid AI had no durable usage or spend bound

**Confirmed in baseline code.** `/api/photo-search` accepted any valid JSON photo
when `OPENAI_API_KEY` existed. It did not authenticate callers. Requests without
Origin were accepted, and a script can supply a matching Origin: CORS/Origin is
not authentication. Anyone can bypass the frontend with direct HTTP requests.

The old counter allowed five requests/IP/minute and twenty total/minute per warm
handler. A new process reset both counts; separate serverless instances and the
two API routes did not share them. IP rotation further weakens caller limits.
There was no durable daily/monthly budget or cross-instance concurrency cap.
Consequently a bot could repeatedly trigger OpenAI charges up to whatever
external account/model limits existed, regardless of hidden UI controls.
Per-call output/timeout limits constrain each call, not the number of calls.

`/api/room-photo` was gated on server-side `ENABLE_ROOM_ANALYSIS`, which does
prevent direct calls when unset. If enabled, it used the same insufficient
per-instance protection, high-detail images and up to 4000 output tokens versus
500 for furniture. A frontend flag alone never protects either route.

**Fix:** deployed paid routes now fail closed before reading/decoding the body
or contacting OpenAI. A production key, forged headers, old feature flags, or
`ENABLE_LOCAL_AI=true` cannot unlock them. Production clients avoid unnecessary
AI uploads too. There is deliberately no public-enabling environment switch.
This revision does not provision storage, subscriptions or paid infrastructure.
Keep public paid AI disabled until a durable guard is implemented and tested.

Only the Vite development hook can opt into local paid analysis, with an explicit
server-side flag, a real loopback socket and a non-Vercel/non-production process.
Its five attempts/minute and single in-flight call are local burst controls,
**not** a serverless spending guarantee. Manual discovery/matching and 3D planning
continue without AI or credentials.

**Still exposed before an owner deploys/blocks old routes:** current and legacy
deployments may retain old code and keys. Restrict old deployment URLs too;
changing a key/environment setting on a new deployment does not establish that
all old immutable deployments are safe. We did not inspect their configurations.

### Medium — M1: hosting/resource exhaustion is separate from OpenAI spend

Even a cheap 503 consumes some hosting resources, and the CDN serves product
images/Three.js bundles to anonymous visitors. Application code cannot prevent
all invocation, request or bandwidth costs before the platform receives traffic.
The existing 3 MiB decoded/approximately 4 MiB JSON limit and Vercel's platform
body limit do not impose a daily hosting budget. Body pre-parsing may happen at
the platform before application policy executes.

**Fixes:** early public denial, no automatic client AI uploads, 30-second max
duration on both API entries, and owner guidance for edge blocking/budgets.
Residual hosting/DDoS risk requires platform safeguards; it is not eliminated by
in-memory counters or this patch.

### Medium — M2: image/resource validation needed stronger bounds

Baseline MIME/magic-byte checks accepted signature-only and huge-dimension
headers. Local upload reading had no deadline or in-flight cap. Client-side
file limits can be bypassed with direct requests.

**Fixes:** canonical base64 and strict one-field JSON; bounded chunked and
pre-parsed bodies; unsupported content encodings rejected; five-second read
deadline; PNG/JPEG/WebP structure/dimension checks; nonanimated images only,
4096 pixels/edge and 12 megapixels. This is not a full decoder, image sanitizer
or malware scan. Invalid inputs never reach the provider in focused tests.

Local requests are serialized after body reading to close a concurrent-upload
race. Upstream calls keep their 20/25-second timeouts, fixed token limits and
`store:false`, add disconnect cancellation, reject redirects, bound response JSON
to 128 KiB, and do not retry. Aborting a request cannot guarantee no provider
charge for work already started. Errors are generic and do not log/return keys,
photos, raw provider bodies or stack traces.

### Low — L1: missing browser security headers and regression automation

The live HTML's GET response had HSTS but no CSP, frame restriction, referrer
policy or nosniff header. No GitHub Actions workflow existed in the inspected
baseline/history. No current XSS exploit was found; React renders descriptors
as text, retailer links reject non-HTTP(S) schemes and use noopener/noreferrer.

**Fixes:** CSP limits scripts/connects to self, permits local blob/data photo
images, denies object embedding/framing, and restricts browser permissions.
Inline styles remain permitted for React/Three positioning. Static production
builds must be checked under this CSP; preview toolbars/external integrations may
need narrowly reviewed exceptions. No unsafe-eval or inline script allowance is
added. Existing Vercel HTTPS/HSTS behavior is not weakened.

New public-PR CI has a read-only token, no secrets, credential persistence off,
full-SHA-pinned checkout/setup-node actions, install scripts disabled, a ten-minute
timeout, audit/tests/typecheck/build and secret/artifact checks. It uses
`pull_request`, never privileged `pull_request_target`, and performs no deployment
or live AI smoke tests. Owner branch rules and approval requirements still need
configuration. Untrusted PRs can modify CI itself, so required review and account
rules remain necessary.

### Low — L2: repository presentation and license status

GitHub description was empty; homepage already points to the correct live site.
No project-wide license exists. This PR records `UNLICENSED` and documents the
status without granting rights for the three authors. IKEA image/name provenance
is recorded, but attribution/verification does not establish redistribution
permission. The team should review asset rights and agree on a source license.

The README is reduced to a short overview with the three authors credited.
Extended setup/security/geometry documentation stays in docs. Ignore rules now
also cover credential files, package-manager auth config, logs and editor state.
No substantive Git history or team credit is removed.

## Other code and deployment checks

- The only provider destination is fixed HTTPS `api.openai.com/v1/responses`;
  uploads cannot supply an upstream URL, model, prompt, retailer URL or redirect.
  No server-side fetching of user-selected URLs, shell execution, authentication
  database, payments or user file storage was found. Remote-URL/SVG upload attempts
  are rejected. Catalog images are local; retailer links open in the browser.
- Server adapters import shared validators/types; the React app does not import
  server implementations. Vite loads OpenAI/local opt-in variables only into its
  server hook. Never put credentials in a `VITE_` variable. Production builds with
  synthetic server-only key/model canaries are scanned for leakage, server module
  identifiers, credential patterns and source maps.
- Read-only live checks: homepage 200; `/api/photo-search` GET 405 and
  `/api/room-photo` GET 405; served entry JavaScript had no OpenAI key identifier,
  obvious key pattern or provider endpoint. A 405 does not prove paid POSTs are
  disabled. The room response differs from baseline's disabled-flag 503, so treat
  room analysis as potentially enabled until its owner checks settings. No paid
  POST, active abuse probe or account/billing inspection was performed.
- `npm audit` against the registry reported **zero known vulnerabilities** in the
  locked tree at review time. No dependency upgrade or new runtime package was
  needed. Audit results are point-in-time, not a guarantee about every package.
- All ten accessible PR heads were fetched; no open PRs were returned at review.
  Branch-protection inspection returned 403 to the connector. Actions workflow
  listing was not exposed through that connector endpoint. Account/org policy,
  secret-scanning status, past build logs/artifacts, and Vercel project settings
  therefore remain unverified. No tracked workflow existed at baseline.

## Owner actions — no settings were changed by this audit

### Before leaving the old paid deployment publicly callable

1. In Vercel Firewall, block `/api/` paths used by the two paid functions (including
   legacy deployment hostnames), or deploy this reviewed closed-route revision.
   Manual search and planning need neither API. Confirm matching/coverage in the
   dashboard; do not assume hiding the photo button or disabling only room AI is
   sufficient. Protect or retire legacy previews containing keys/old handlers.
2. Use a dedicated Furney OpenAI project/key. Review recent usage for both photo
   functions. Set alerts and a small **enforced hard spend limit**, not merely an
   alert/budget label; restrict the key to required Responses permissions and
   project models/rates. The current official [OpenAI spend-limit guide](https://developers.openai.com/api/docs/guides/spend-limits)
   distinguishes alerts from enforced organization/project limits and notes
   propagation overshoot. Verify the controls actually available in your account.
   Avoid a broadly privileged personal/admin key; keep unrelated projects separate.
3. If your existing Vercel plan supports it, set an on-demand budget **with Pause
   Production Deployments enabled**, plus alerts. A budget alone does not stop
   traffic, pausing can lag several minutes and affects all team projects, and
   some storage/other products keep accruing costs. See [Vercel Spend Management](https://vercel.com/docs/spend-management).
   On plans without this control, use included limits, firewall blocking and
   monitoring. Do not buy an upgrade or enable paid add-ons for this prototype.
4. Check [Firewall rule availability and pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
   on the existing plan before enabling any metered feature. Edge per-IP limits
   are useful defense in depth but are not a global OpenAI budget. No subscription
   or integration has been purchased/provisioned by this PR.

### Before any future public AI launch

Implement an atomic durable attempt/cost reservation shared by both routes and
every instance: per-caller limits, a global daily/monthly ceiling, bounded
concurrency leases with safe expiry, and fail-closed behavior on store errors.
Do not refund attempts automatically on uncertain provider failures. Weight room
analysis appropriately for its higher input/output budget. Use a trusted caller
identity (or privacy-preserving platform IP identification), never arbitrary
client headers. Test cold starts, parallel races, time-window rollover, store
outage, aborted requests and both routes together. No such store is configured
in this revision, so public paid AI remains unavailable. Account hard caps and
edge protections should remain in place even after a durable guard exists.

### GitHub professionalism and review

- Suggested About description: **Furniture discovery and interactive 3D room
  planning, built by Ardian Agoes, Angelo Chen, and Shreya Dhakal at Emergent
  Hackathon 2026.** Homepage is already `https://furney.vercel.app/`.
- Enable secret scanning/push protection, Dependabot alerts/security updates,
  private vulnerability reporting, 2FA, protected main/required reviews and CI.
  Require approval for outside contributors' workflow runs; keep Actions token
  permissions read-only and production secrets out of PR workflows.
- Restrict Vercel project membership and preview environment access; untrusted
  forks/branches should never receive production credentials. This branch's
  Vercel deployment is disabled in code; verify account deployment policies too.
- Agree on license/asset permissions with all three contributors; see
  [LICENSE_STATUS.md](LICENSE_STATUS.md). No license was selected on their behalf.

## Verification and verdict

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run check:public`,
`npm run audit:secrets` and `npm audit`. Normal tests mock upstream OpenAI.
The optional live script requires `CONFIRM_BILLABLE_AI_TEST=yes` and was not run.
Clean installation with `npm ci --ignore-scripts`, typecheck, **193 tests across
26 files**, production build and public-artifact/canary checks passed locally.
The build retains the existing Three.js chunk-size advisory. Chrome checked the
production static build with the proposed CSP: manual chair matching, Add to Room,
actual WebGL rendering, rotation, a $149 estimate and top-down view worked; no CSP
violations were observed. These were local checks, not a new Vercel deployment.
Final results are also recorded in the PR. Focused tests cover actual API entry
points, repeated fresh handlers/IPs, missing/forged flags, early body denial,
size/encoding/time limits, malformed images, concurrency, cancellation, bounded
provider errors and production client upload avoidance. Existing tests cover
manual matching, the catalog, shared placement/price state and 3D geometry.

**Public source:** reasonably suitable to remain public within this review's
limits; no detected credential disclosure, with licensing/asset review still due.
**Audited application after deployment:** manual features are reasonably safe for
a public prototype with paid AI closed and residual hosting controls configured.
**Current live paid AI:** cannot be endorsed as financially bounded from the
verified evidence. Existing production keys are known to work from prior project
history; a missing local key is not a production configuration problem. Confirm
account caps and close/protect old paid routes before assuming this PR's
safeguards apply. No claim of absolute security, zero cost or live AI accuracy is
made.
