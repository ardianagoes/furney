import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPhotoHandler as createHandler, createRateLimiter, validateImage } from './photo-handler';
import { analyzeFurniturePhoto } from './photo-analysis.server';
import { MAX_IMAGE_BYTES } from '../src/lib/photo-search-types';

const chair = `data:image/jpeg;base64,${readFileSync(new URL('../src/assets/ikea/00457235.jpg', import.meta.url)).toString('base64')}`;
const sofa = `data:image/jpeg;base64,${readFileSync(new URL('../src/assets/ikea/80519531.jpg', import.meta.url)).toString('base64')}`;
const analysis = { isFurniture: true, category: 'Chairs', primaryColor: 'brown', material: 'wood', style: 'scandinavian', keywords: ['dining', 'wood'] };
const providerResponse = (value: unknown) => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }), { status: 200 });
// Explicit LOCAL opt-in, mocked transport; public-route tests use real entry points.
const createPhotoHandler=(options:Parameters<typeof createHandler>[0]={})=>createHandler({...options,localDevelopment:true,env:{...options.env,ENABLE_LOCAL_AI:'true'}});

async function invoke(handler: ReturnType<typeof createPhotoHandler>, options: { method?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}) {
  const request = Readable.from([options.raw ?? JSON.stringify(options.body ?? { dataUrl: chair })]) as IncomingMessage & { body?: unknown };
  Object.assign(request, { method: options.method ?? 'POST', headers: { host: 'localhost', 'content-type': 'application/json', ...options.headers }, socket: { remoteAddress: '127.0.0.1' } });
  const headers: Record<string, string> = {};
  let output = '';
  const response = { statusCode: 200, setHeader: (name: string, value: string) => { headers[name.toLowerCase()] = value; }, end: (body: string) => { output = body; } } as unknown as ServerResponse;
  await handler(request, response);
  return { status: response.statusCode, headers, body: JSON.parse(output), raw: output };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('server image validation and rate limiting', () => {
  it('accepts real stored chair/sofa JPEGs and rejects spoofed MIME, remote URLs, malformed base64, empty and oversized data', () => {
    expect(validateImage(chair)).toBe(true);
    expect(validateImage(sofa)).toBe(true);
    for (const invalid of [chair.replace('image/jpeg', 'image/png'), 'https://example.com/photo.jpg', 'data:image/jpeg;base64,garbage!', 'data:image/jpeg;base64,', 'data:image/svg+xml;base64,PHN2Zz4=', `data:image/jpeg;base64,${Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64')}`]) expect(validateImage(invalid)).toBe(false);
  });
  it('limits loopback development to five requests/minute across callers, then expires', () => {
    let time = 1;
    const allow = createRateLimiter(() => time);
    for (let i = 0; i < 5; i++) expect(allow('one-client')).toBe(true);
    expect(allow('one-client')).toBe(false);
    expect(allow('another-client')).toBe(false);
    time += 60_000;
    expect(allow('one-client')).toBe(true);
  });
  it('requires POST, JSON, same-origin browser requests, and valid image data', async () => {
    const fetchImpl = vi.fn();
    const handler = createPhotoHandler({ env: {}, fetchImpl,allowRequest:()=>true });
    expect((await invoke(handler, { method: 'GET' })).status).toBe(405);
    expect((await invoke(handler, { headers: { 'content-type': 'text/plain' } })).status).toBe(415);
    expect((await invoke(handler, { headers: { origin: 'https://another.example' } })).status).toBe(403);
    expect((await invoke(handler, { raw: 'bad json' })).status).toBe(400);
    expect((await invoke(handler, { body: { dataUrl: 'not-an-image' } })).status).toBe(400);
    expect((await invoke(handler, { headers: { 'content-length': String(MAX_IMAGE_BYTES * 2) } })).status).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('returns 503 rather than fabricating analysis when no OpenAI key exists', async () => {
    const fetchImpl = vi.fn();
    const handler = createPhotoHandler({ env: {}, fetchImpl });
    for (const dataUrl of [chair, sofa]) {
      const result = await invoke(handler, { body: { dataUrl } });
      expect(result.status).toBe(503);
      expect(result.body).toMatchObject({ ok: false, code: 'not_configured' });
      expect(result.body.analysis).toBeUndefined();
      expect(result.headers['cache-control']).toBe('no-store');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('returns 429 and Retry-After before contacting the provider', async () => {
    const fetchImpl = vi.fn();
    const result = await invoke(createPhotoHandler({ env: { OPENAI_API_KEY: 'test-only-key' }, fetchImpl, allowRequest: () => false }));
    expect(result.status).toBe(429);
    expect(result.headers['retry-after']).toBe('60');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('OpenAI adapter (mocked transport, not a real image-classification check)', () => {
  it('sends images only server-side, disables response storage, and validates structured descriptors', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(providerResponse(analysis));
    const result = await invoke(createPhotoHandler({ env: { OPENAI_API_KEY: 'test-only-key', OPENAI_MODEL: 'configured-model' }, fetchImpl }));
    expect(result.body).toEqual({ ok: true, analysis: { category: 'Chairs', primaryColor: 'brown', material: 'wood', style: 'scandinavian', keywords: ['dining', 'wood'] } });
    const [url, options] = fetchImpl.mock.calls[0];
    const body = JSON.parse(String(options?.body));
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(body).toMatchObject({ model: 'configured-model', store: false });
    expect(body.input[0].content[1]).toMatchObject({ type: 'input_image', image_url: chair });
    expect(body.text.format.strict).toBe(true);
    expect(result.raw).not.toContain('test-only-key');
    expect(result.raw).not.toContain('data:image/');
  });
  it('does not confuse a successful HTTP response with furniture identification', async () => {
    const result = await analyzeFurniturePhoto(chair, { apiKey: 'test-only-key', fetchImpl: vi.fn().mockResolvedValue(providerResponse({ ...analysis, isFurniture: false })) });
    expect(result).toMatchObject({ ok: false, code: 'not_furniture' });
  });
  it.each([401, 403, 429, 500])('handles provider status %s without logging or exposing its body', async status => {
    const error = vi.spyOn(console, 'error');
    const log = vi.spyOn(console, 'log');
    const result = await analyzeFurniturePhoto(chair, { apiKey: 'test-only-key', fetchImpl: vi.fn().mockResolvedValue(new Response('sensitive provider body', { status })) });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain('sensitive provider body');
    expect(error).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
  it('rejects invalid descriptors and handles timeouts without exposing/logging images or keys', async () => {
    const error = vi.spyOn(console, 'error');
    const invalid = await analyzeFurniturePhoto(chair, { apiKey: 'test-only-key', fetchImpl: vi.fn().mockResolvedValue(providerResponse({ ...analysis, category: 'invented category' })) });
    expect(invalid).toMatchObject({ ok: false, code: 'api_error' });
    const failed = await analyzeFurniturePhoto(chair, { apiKey: 'test-only-key', fetchImpl: vi.fn().mockRejectedValue(new Error(`test-only-key ${chair}`)) });
    expect(failed).toMatchObject({ ok: false, code: 'api_error' });
    expect(JSON.stringify(failed)).not.toContain('test-only-key');
    expect(error).not.toHaveBeenCalled();
  });
});
