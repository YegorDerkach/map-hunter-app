/**
 * AI API: ask, generate profile, check, battle photo, chests.
 * Some responses may have variable shape (typed as unknown where needed).
 */

import { request } from './client';
import type { AiAskDTO } from '@/types/api';

export async function askAi(dto: AiAskDTO): Promise<unknown> {
  return request<unknown>('/api/ai/ask', 'POST', dto);
}

export async function generateProfilePhoto(file: File): Promise<string> {
  return request<string>('/api/ai/generate-profile', 'POST', file, {
    skipContentType: true,
    responseText: true,
  });
}

/** POST with file + lat, lng query params. Response shape varies. */
export async function checkAi(
  file: File,
  lat: number,
  lng: number
): Promise<unknown> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return request<unknown>(`/api/ai/check?${params}`, 'POST', file, {
    skipContentType: true,
  });
}

export async function generateBattlePhoto(
  file: File,
  mobId?: string
): Promise<string> {
  const url = mobId
    ? `/api/ai/generate-battle-photo?mobId=${encodeURIComponent(mobId)}`
    : '/api/ai/generate-battle-photo';
  return request<string>(url, 'POST', file, {
    skipContentType: true,
    responseText: true,
  });
}

export async function generateChests(city?: string): Promise<unknown> {
  const url = city
    ? `/api/ai/generate-chests?city=${encodeURIComponent(city)}`
    : '/api/ai/generate-chests';
  return request<unknown>(url, 'GET');
}
