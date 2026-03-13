import { Item, ShopItem } from '@/types/game';
import { items } from './items';

const xpBoost: Item = {
  id: 'xp_boost',
  name: 'XP Boost',
  emoji: '⭐',
  category: 'boosters',
  rarity: 'rare',
  description: 'Double XP for 1 hour.',
  stackable: true,
  price: 0,
  gemPrice: 5,
};

const goldBoost: Item = {
  id: 'gold_boost',
  name: 'Gold Boost',
  emoji: '🪙',
  category: 'boosters',
  rarity: 'uncommon',
  description: 'Double gold drops for 1 hour.',
  stackable: true,
  price: 0,
  gemPrice: 4,
};

const avatarFrame: Item = {
  id: 'avatar_frame',
  name: 'Dragon Frame',
  emoji: '🖼️',
  category: 'cosmetics',
  rarity: 'legendary',
  description: 'Exclusive dragon avatar border.',
  stackable: false,
  price: 0,
  gemPrice: 10,
};

const trailEffect: Item = {
  id: 'trail_effect',
  name: 'Fire Trail',
  emoji: '🔥',
  category: 'cosmetics',
  rarity: 'epic',
  description: 'Leaves a fiery trail on the map.',
  stackable: false,
  price: 0,
  gemPrice: 8,
};

export const shopItems: ShopItem[] = [
  // Potions
  { item: items.health_potion, featured: true },
  { item: items.spell_scroll },
  // Keys
  { item: items.dungeon_key, featured: true },
  { item: items.golden_key },
  // Boosters
  { item: xpBoost, featured: true },
  { item: goldBoost },
  // Cosmetics
  { item: avatarFrame, featured: true },
  { item: trailEffect },
];
