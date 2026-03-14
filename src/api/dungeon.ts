/**
 * Dungeon Arena API: start a dungeon session.
 */

import { getApiBase, getAuthHeaders } from './client';
import type { Enemy } from '@/types/api';

export interface DungeonStartResponse {
  /** When false, canStart=false and message explains why (too far, photo mismatch). */
  canStart?: boolean;
  message?: string;
  backgroundUrl: string | null;
  enemies: Enemy[];
  centerLat: number;
  centerLng: number;
}

const AUTH_TOKEN_KEY = 'map-hunter-auth-token';

function getToken(): string | null {
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

export async function startDungeon(
  photo: File,
  lat: number,
  lng: number,
  entranceId: string
): Promise<DungeonStartResponse> {
  const base = getApiBase();
  if (!base) throw new Error('VITE_API_BASE is not set');

  const form = new FormData();
  form.append('file', photo);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), entranceId });
  const res = await fetch(`${base}/api/dungeon/start?${params}`, {
    method: 'POST',
    headers,
    body: form,
  });

  const text = await res.text();
  let data: DungeonStartResponse;
  try { data = JSON.parse(text); } catch { throw new Error(text || 'Dungeon start failed'); }

  if (!res.ok) {
    throw new Error((data as unknown as { message?: string })?.message ?? 'Dungeon start failed');
  }
  return data;
}
