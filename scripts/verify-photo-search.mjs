// Opt-in REAL image-analysis smoke test. This never mocks provider responses.
// Run only against your own configured Furney dev server or Vercel deployment.
import { readFile } from 'node:fs/promises';

const baseUrl = process.env.PHOTO_SEARCH_BASE_URL || 'http://127.0.0.1:5173';
const endpoint = new URL('/api/photo-search', baseUrl);
let failures = 0;
for (const [file, expected] of [['chair-2.jpg', 'Chairs'], ['sofa-1.jpg', 'Sofas']]) {
  try {
    const image = await readFile(new URL(`../src/assets/furniture/${file}`, import.meta.url));
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: `data:image/jpeg;base64,${image.toString('base64')}` }),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      failures++;
      console.error(`${file}: BLOCKED/FAILED (${response.status}, ${result.code || 'unknown'}). ${result.message || 'No successful analysis returned.'}`);
    } else if (result.analysis?.category !== expected) {
      failures++;
      console.error(`${file}: expected ${expected}, received ${String(result.analysis?.category)}.`);
    } else {
      console.log(`${file}: real endpoint returned ${expected}.`);
    }
  } catch {
    failures++;
    console.error(`${file}: could not complete the real image-analysis request. Check the server URL and configuration.`);
  }
}
if (failures) {
  console.error('Real chair/sofa classification is NOT verified. Resolve the errors above (server-side OPENAI_API_KEY and/or deployment access), then rerun this check.');
  process.exitCode = 1;
} else console.log('Verified distinct chair and sofa classifications through real image-analysis requests.');
