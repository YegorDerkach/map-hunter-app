/**
 * Enemy API: by city, kill, create.
 */

import { request } from './client';
import type { Enemy, CreateEnemyDTO } from '@/types/api';

export async function getEnemiesByCity(city: string): Promise<Enemy[]> {
  return request<Enemy[]>(`/api/enemy/${encodeURIComponent(city)}`, 'GET');
}

export async function killEnemy(enemyId: string): Promise<string> {
  return request<string>(`/api/enemy/${encodeURIComponent(enemyId)}/kill`, 'POST');
}

export async function createEnemy(dto: CreateEnemyDTO): Promise<Enemy> {
  return request<Enemy>('/api/enemy/create', 'POST', dto);
}
