import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { MAX_IMAGE_BYTES, ACCEPTED_IMAGE_TYPES, type PhotoAnalysisResult } from '../src/lib/photo-search-types.js';
import { analyzeFurniturePhoto } from './photo-analysis.server.js';
import type { RoomAnalysisResult } from '../src/lib/room-photo-types.js';

const MAX_JSON_BYTES = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 512;
const WINDOW_MS = 60_000;

export function validateImage(dataUrl: unknown): dataUrl is string {
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_JSON_BYTES) return false;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(match[1]) || match[2].length % 4 !== 0) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== match[2]) return false;
  if (match[1] === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (match[1] === 'image/jpeg') return bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  return bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
}

/** Bounded warm-instance rate limiter. No images or raw IP addresses stored.
 * Serverless instances do not share this state; add deployment-level limits for
 * a strict global production quota. */
export function createRateLimiter(now = Date.now) {
  const buckets = new Map<string, { count: number; expires: number }>();
  let global = { count: 0, expires: 0 };
  return (address: string) => {
    const time = now();
    for (const [key, value] of buckets) if (value.expires <= time) buckets.delete(key);
    if (global.expires <= time) global = { count: 0, expires: time + WINDOW_MS };
    const key = createHash('sha256').update(address).digest('hex');
    const bucket = buckets.get(key) ?? { count: 0, expires: time + WINDOW_MS };
    if (global.count >= 20 || bucket.count >= 5 || (!buckets.has(key) && buckets.size >= 1000)) return false;
    bucket.count++; global.count++; buckets.set(key, bucket);
    return true;
  };
}

async function readBody(request: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (Number(request.headers['content-length']) > MAX_JSON_BYTES) throw new RangeError('Request too large');
  if (request.body !== undefined) {
    const raw = Buffer.isBuffer(request.body) ? request.body.toString('utf8') : typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    if (Buffer.byteLength(raw) > MAX_JSON_BYTES) throw new RangeError('Request too large');
    return JSON.parse(raw);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > MAX_JSON_BYTES) { request.resume(); throw new RangeError('Request too large'); }
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createPhotoHandler(options: { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch; allowRequest?: (address: string) => boolean; analyze?: (dataUrl: string, options: {apiKey:string;model?:string;fetchImpl?:typeof fetch}) => Promise<PhotoAnalysisResult | RoomAnalysisResult> } = {}) {
  const allowRequest = options.allowRequest ?? createRateLimiter();
  return async (request: IncomingMessage & { body?: unknown }, response: ServerResponse) => {
    const send = (status: number, result: PhotoAnalysisResult | RoomAnalysisResult) => {
      response.statusCode = status;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end(JSON.stringify(result));
    };
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return send(405, { ok: false, code: 'unsupported', message: 'Use POST to upload a furniture image.' });
    }
    try {
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) return send(403, { ok: false, code: 'unsupported', message: 'Use photo search from this application.' });
    } catch { return send(403, { ok: false, code: 'unsupported', message: 'Invalid request origin.' }); }
    const forwarded = process.env.VERCEL ? request.headers['x-vercel-forwarded-for'] : undefined;
    const address = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || request.socket.remoteAddress || 'unknown';
    if (!allowRequest(address)) {
      response.setHeader('Retry-After', '60');
      return send(429, { ok: false, code: 'rate_limited', message: 'Too many photo searches. Wait a minute or use manual search.' });
    }
    if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') return send(415, { ok: false, code: 'unsupported', message: 'Upload a JPG, PNG, or WebP photo using JSON.' });
    let body: unknown;
    try { body = await readBody(request); }
    catch (error) { return send(error instanceof RangeError ? 413 : 400, { ok: false, code: 'unsupported', message: 'Invalid image request. Choose a JPG, PNG, or WebP up to 3 MB.' }); }
    const dataUrl = body && typeof body === 'object' && 'dataUrl' in body ? body.dataUrl : undefined;
    if (!validateImage(dataUrl)) return send(400, { ok: false, code: 'unsupported', message: 'Invalid image. Choose a genuine JPG, PNG, or WebP up to 3 MB.' });
    const env = options.env ?? process.env;
    if (!env.OPENAI_API_KEY?.trim()) return send(503, { ok: false, code: 'not_configured', message: 'AI photo analysis is not configured. Manual category/style search still works.' });
    const result = await (options.analyze ?? analyzeFurniturePhoto)(dataUrl, { apiKey: env.OPENAI_API_KEY.trim(), model: env.OPENAI_MODEL, fetchImpl: options.fetchImpl });
    send(result.ok ? 200 : result.code === 'not_configured' ? 503 : result.code === 'rate_limited' ? 429 : result.code === 'not_furniture' ? 422 : 502, result);
  };
}
