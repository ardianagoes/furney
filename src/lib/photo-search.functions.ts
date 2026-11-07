// Browser-only transport replacing Shreya's TanStack useServerFn binding.
import { parsePhotoAnalysis, type PhotoAnalysisResult } from './photo-search-types';

export async function analyzePhoto(dataUrl: string, signal?: AbortSignal): Promise<PhotoAnalysisResult> {
  try {
    const response = await fetch('/api/photo-search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }), signal,
    });
    if (response.status === 404) return { ok: false, code: 'not_configured', message: 'The photo analysis endpoint is unavailable. Use manual search below.' };
    if (response.status === 429) return { ok: false, code: 'rate_limited', message: 'Too many photo searches. Wait a minute or use manual search.' };
    if (!response.headers.get('content-type')?.includes('application/json')) return { ok: false, code: 'api_error', message: 'The photo analysis service returned an unreadable response. Use manual search.' };
    const result: unknown = await response.json();
    if (result && typeof result === 'object' && 'ok' in result) {
      const data = result as Record<string, unknown>;
      if (response.ok && data.ok === true) {
        const analysis = parsePhotoAnalysis(data.analysis);
        if (analysis) return { ok: true, analysis };
      }
      if (data.ok === false && typeof data.message === 'string' && ['not_configured', 'api_error', 'not_furniture', 'unsupported', 'rate_limited'].includes(String(data.code))) {
        return { ok: false, code: data.code as Extract<PhotoAnalysisResult, { ok: false }>['code'], message: data.message.slice(0, 300) };
      }
    }
    return { ok: false, code: 'api_error', message: 'The image analysis response could not be read. Use manual search or try again.' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, code: 'api_error', message: 'Could not reach image analysis. Use manual search or try again.' };
  }
}
