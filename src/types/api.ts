/**
 * Types mirroring SHARE-server DTOs and entities.
 * Use ApiItem for server Item to avoid clash with game Item in types/game.ts.
 */

// --- DTOs (request/response) ---

export interface RegisterDTO {
  id: string;
  nickname: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserDTO {
  id: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  pathToPhoto?: string;
  password?: string;
  hp?: number;
  damage?: number;
  coins?: number;
  gems?: number;
  items?: ApiItem[];
}

export interface CreateItemDTO {
  name: string;
  pathToPhoto?: string;
  hp?: number;
  damage?: number;
  equipped?: boolean;
}

export interface CreateEnemyDTO {
  name: string;
  pathToPhoto?: string;
  city: string;
  longitude?: number;
  latitude?: number;
  hp?: number;
  damageToEnemy?: number;
  isBoss?: boolean;
  chestType?: string;
}

export interface ChatMessageDTO {
  sender?: string;
  receiver: string;
  content: string;
}

export interface AiAskDTO {
  message: string;
}

// --- API response wrappers ---

export interface ApiResponse<T = unknown> {
  token: string;
  message: string;
  data: T | null;
}

export interface ErrorResponse {
  message?: string;
  path?: string;
  status?: number;
  fieldErrors?: Array<{ field: string; message: string }>;
}

// --- Entities (server models) ---

export interface User {
  id: string;
  nickname?: string;
  email?: string;
  pathToPhoto?: string;
  password?: string | null;
  hp?: number;
  xp?: number;
  lvl?: number;
  damage?: number;
  coins?: number;
  gems?: number;
  items?: ApiItem[];
  lvlMap?: Record<number, number>;
}

export interface ApiItem {
  id: string;
  name: string;
  pathToPhoto?: string;
  hp?: number;
  damage?: number;
  equipped?: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  pathToPhoto?: string;
  city: string;
  longitude: number;
  latitude: number;
  hp: number;
  damageToEnemy: number;
  isBoss: boolean;
  chestType?: string;
}

export interface ChatMessageEntity {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string; // ISO date string
}
