/**
 * Battles API: generate and end battle.
 */

import { request } from './client';
import type { User } from '@/types/api';

export async function generateBattle(): Promise<User> {
  return request<User>('/api/battles/generate-battle', 'POST');
}

export async function endBattle(): Promise<User> {
  return request<User>('/api/battles/end-battle', 'GET');
}
