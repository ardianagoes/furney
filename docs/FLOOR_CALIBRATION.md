# Perspective floor calibration

Based on Furney main `3437e7c` (PR #9). Reviewed Angelo's normalized floor-corner and furniture-contact implementation at `64866ec5ea4b38890ecabc56e2c9cc8027f5a0ee`; no TanStack/Lovable infrastructure is imported.

## Using Align Floor

1. Enter measured room dimensions and upload a JPG, PNG, or WebP room photo.
2. In **Align Floor**, drag handles 1–4 to the measured floor's rear-left, rear-right, front-right, and front-left corners. The inset shows the grid projected into the original photo. Handles support mouse/touch pointer capture and keyboard arrows (Shift for larger steps).
3. Apply the alignment. The selected quadrilateral is perspective-rectified onto the measured 3D floor. The photograph never becomes the viewport background. Camera presets and zoom only change the viewing camera.
4. Reopen Align Floor to adjust it, choose **Use cropped fallback** to retain PR #9's uncalibrated behavior, or remove the photo to restore the original floor. No calibration/photo persists after a page reload.

Corners must form a sufficiently large, convex, noncrossing quadrilateral inside the image. Overhead photographs, including rotated overhead views, use the same workflow and ordered corner correspondence. If room corners are hidden or off-image, calibration is approximate; use manual review or the explicitly labeled cropped fallback. One photograph does not establish exact dimensions, lens correction, wall geometry, or furniture heights.

## One coordinate contract

`src/lib/floorCalibration.ts` owns normalized image coordinates (top-left origin, X right/Y down), the unit measured-floor square, and a validated forward/inverse homography. Unit floor `(0,0)` is rear-left; `(1,1)` is front-right. Centered scene meters are `x=(u-.5)*widthM`, `z=(v-.5)*depthM`. The existing planner adapter converts those to shared corner-origin placements; product dimensions/prices and placement state are unchanged.

The calibration inset projects the same centered half-meter grid as the scene through the forward matrix. The floor material samples the photo using that matrix with homogeneous division per fragment, preserving standard lighting/shadows. The inverse maps AI furniture-contact polygons after clipping them to the photographed floor. Conservative meter-aligned bounding areas feed the existing occupied-area state, auto-placement and collision warnings. These may overestimate occupied space and remain editable/ignorable.

Image and editor resizing do not change normalized corners. Changing measured room dimensions changes meter scale and recalculates detected areas. Recalibration also recalculates detections, replacing prior manual area edits; camera/viewport changes do not. Placed products remain in shared meter coordinates. Photo replacement/removal disposes the old texture/object URL, clears detections and resets calibration.

## AI status and validation

Manual calibration works without AI. Existing room analysis remains gated by `VITE_ENABLE_ROOM_ANALYSIS=true` (frontend build) and `ENABLE_ROOM_ANALYSIS=true` (server). No AI endpoint, key handling, production variables, model, or furniture-photo search behavior changes. The endpoint continues to use server-only `OPENAI_API_KEY` and `OPENAI_MODEL` when enabled; the existing Vercel Production configuration is compatible.

A valid complete AI floor quadrilateral with confidence >= 0.75 initializes the suggestion. Missing/low-confidence/invalid corners open manual calibration instead. Explicitly confirmed manual corners are retained on reanalysis; **Review AI floor suggestion** lets the user deliberately replace them. AI detections need confidence >= 0.5 and a valid floor-contact polygon. Neither an overhead label alone nor a rear edge fabricates missing floor corners.

Automated tests cover perspective/overhead/rotated mapping, round trips, degenerate corners, half-meter grid registration, clipping, resizing, calibrated collisions/automatic placement, pointer/keyboard editing, real R3F material uniforms/resource cleanup, and application placement/rotation/dimensions/prices. AI responses are mocked in these tests. No new live image-analysis request was made; real AI corner reliability remains unverified, and existing room-analysis gates are unchanged.

Browser QA uses an angled checkerboard reference to inspect the actual WebGL homography, corner dragging, top-down/angled views, and catalog additions/rotation. The branch's Vercel deployment is disabled; review/merge/deployment remain manual.
