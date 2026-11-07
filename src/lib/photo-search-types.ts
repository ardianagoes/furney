// Adapted from Shreya's photo-search-types.ts @ 57e756b6bc0daa5f043ada909f07035ad2e0ca43.
export interface PhotoAnalysis {
  category: string;
  primaryColor: string;
  material: string;
  style: string;
  keywords: string[];
}

export type PhotoAnalysisResult =
  | { ok: true; analysis: PhotoAnalysis }
  | { ok: false; code: 'not_configured' | 'api_error' | 'not_furniture' | 'unsupported' | 'rate_limited'; message: string };

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
// 3 MiB becomes ~4 MiB base64 JSON, below Vercel's 4.5 MB function limit.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const PHOTO_CATEGORIES = ['Sofas', 'Beds', 'Desks', 'Chairs', 'Tables', 'Other'] as const;

export function parsePhotoAnalysis(value: unknown): PhotoAnalysis | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (!(PHOTO_CATEGORIES as readonly unknown[]).includes(data.category)) return null;
  const strings = ['primaryColor', 'material', 'style'] as const;
  if (strings.some(key => typeof data[key] !== 'string' || (data[key] as string).length > 100)) return null;
  if (!Array.isArray(data.keywords) || data.keywords.length > 8 || data.keywords.some(word => typeof word !== 'string' || word.length > 80)) return null;
  return {
    category: data.category as string,
    primaryColor: (data.primaryColor as string).trim().toLowerCase(),
    material: (data.material as string).trim().toLowerCase(),
    style: (data.style as string).trim().toLowerCase(),
    keywords: [...new Set((data.keywords as string[]).map(word => word.trim().toLowerCase()).filter(Boolean))],
  };
}
