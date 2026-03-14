/**
 * API layer re-exports. Use these modules for all SHARE-server calls.
 */

export { getApiBase, getAuthHeaders, request } from './client';
export type { RequestOptions } from './client';

export {
  login,
  register,
  getStoredToken,
  clearAuth,
  AUTH_TOKEN_KEY,
} from './auth';
export type { ApiAuthResponse, RegisterPayload } from './auth';

export { updateProfile, updateItems } from './user';
export { createItem, getItem } from './item';
export { getEnemiesByCity, killEnemy, createEnemy } from './enemy';
export {
  uploadUserPhoto,
  uploadItemPhoto,
  uploadEnemyPhoto,
  getProfilePhotoUrl,
  getEnemyPhotoUrl,
} from './photo';
export { getStreet } from './map';
export { generateBattle, endBattle } from './battles';
export {
  getPrivateMessages,
  subscribePrivateChat,
  sendPrivateMessage,
} from './chat';
export {
  askAi,
  generateProfilePhoto,
  checkAi,
  generateBattlePhoto,
  generateChests,
} from './ai';
export type { AvatarStyle } from './ai';

export { startDungeon } from './dungeon';
export type { DungeonStartResponse } from './dungeon';
