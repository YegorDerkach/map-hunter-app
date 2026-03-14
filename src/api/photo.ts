/**
 * Photo API: upload user/item/enemy, get profile photo URL.
 */

import { request } from './client';
import type { User, ApiItem, Enemy } from '@/types/api';

export async function uploadUserPhoto(file: File): Promise<User> {
  return request<User>('/api/photo/uploadUser', 'POST', file, { skipContentType: true });
}

export async function uploadItemPhoto(itemId: string, file: File): Promise<ApiItem | null> {
  return request<ApiItem | null>(`/api/photo/${encodeURIComponent(itemId)}/uploadItem`, 'POST', file, {
    skipContentType: true,
  });
}

export async function uploadEnemyPhoto(enemyId: string, file: File): Promise<Enemy | null> {
  return request<Enemy | null>(`/api/photo/${encodeURIComponent(enemyId)}/uploadEnemy`, 'POST', file, {
    skipContentType: true,
  });
}

export async function getProfilePhotoUrl(): Promise<string> {
  return request<string>('/api/photo/profile', 'GET', undefined, { responseText: true });
}

export async function getEnemyPhotoUrl(enemyId: string): Promise<string> {
  return request<string>(`/api/photo/enemy/${encodeURIComponent(enemyId)}`, 'GET', undefined, { responseText: true });
}

