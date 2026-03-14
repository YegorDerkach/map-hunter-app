export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type MarkerType = 'monster' | 'chest' | 'event';
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
}

export interface GameSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export type Locale = 'uk' | 'en';

export interface GameState {
  player: Player;
  isLoggedIn: boolean;
  tutorialComplete: boolean;
  inventory: InventoryItem[];
  activeBattle: BattleState | null;
  settings: GameSettings;
  lastLoot: InventoryItem[];
  locale: Locale;
}
