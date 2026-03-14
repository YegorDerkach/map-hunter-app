/**
 * Battles API: generate, attack, and end battle.
 */

import { request } from './client';
import type { User, BattleStateDTO } from '@/types/api';

export async function generateBattle(enemyId: string): Promise<BattleStateDTO> {
  return request<BattleStateDTO>(`/api/battles/generate-battle?enemyId=${encodeURIComponent(enemyId)}`, 'POST');
}

export async function attackEnemy(enemyId: string): Promise<BattleStateDTO> {
  return request<BattleStateDTO>('/api/battles/attack', 'POST', { enemyId });
}

export async function endBattle(): Promise<User> {
  return request<User>('/api/battles/end-battle', 'GET');
}
