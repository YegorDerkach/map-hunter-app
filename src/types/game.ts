export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type MarkerType = 'monster' | 'chest';
export type ItemCategory =
  | 'weapons'
  | 'armor'
  | 'consumables'
  | 'materials'
  | 'keys'
  | 'boosters'
  | 'cosmetics';

export type QuestType = 'daily' | 'weekly' | 'story';
export type ShopCategory = 'potions' | 'keys' | 'boosters' | 'cosmetics';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  agility: number;
  luck: number;
}

export interface Player extends PlayerStats {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  gems: number;
  avatarEmoji: string;
}

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  lootTable: string[];
}

export interface MapMarkerData {
  id: string;
  type: MarkerType;
  x: number;
  y: number;
  label: string;
  monsterId?: string;
  chestId?: string;
  /** Server enemy id (from getEnemiesByCity); when set, location uses API enemy */
  enemyId?: string;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
  rarity: Rarity;
  description: string;
  stats?: Partial<PlayerStats>;
  stackable: boolean;
  price: number;
  gemPrice?: number;
}

export interface InventoryItem {
  item: Item;
  quantity: number;
  equipped?: boolean;
}

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardGold: number;
  rewardXP: number;
  rewardItems?: string[];
  completed: boolean;
}

export interface ShopItem {
  item: Item;
  featured?: boolean;
  discountPercent?: number;
}

export interface TutorialStep {
  id: number;
  title: string;
  body: string;
  icon: string;
}

export interface BattleState {
  monster: Monster;
  playerHp: number;
  turn: 'player' | 'enemy';
  log: string[];
  /** When set, battle is from API; on win call killEnemy + endBattle */
  serverEnemyId?: string;
  /** When true, use only game 4 (boss minigame) */
  isBoss?: boolean;
}

export interface GameSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export type Locale = 'uk' | 'en';

/** Server user from auth (SHARE-server). Optional; present when logged in via API. */
export interface AuthUser {
  id: string;
  nickname?: string;
  email?: string;
  pathToPhoto?: string;
  hp?: number;
  xp?: number;
  lvl?: number;
  damage?: number;
  coins?: number;
  gems?: number;
  items?: unknown[];
}

export interface GameState {
  player: Player;
  isLoggedIn: boolean;
  tutorialComplete: boolean;
  inventory: InventoryItem[];
  activeBattle: BattleState | null;
  settings: GameSettings;
  lastLoot: InventoryItem[];
  locale: Locale;
  /** JWT from SHARE-server auth */
  token?: string | null;
  /** User from server when logged in via login/register */
  authUser?: AuthUser | null;
  /** Indices of non-boss games (0,1,2) already used this cycle; reset when all 3 used */
  usedNonBossGameIds: number[];
}
