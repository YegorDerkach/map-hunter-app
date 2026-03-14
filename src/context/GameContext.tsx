import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, InventoryItem, BattleState, Locale, AuthUser, DungeonSession } from '@/types/game';
import type { Enemy } from '@/types/api';
import { startingInventory } from '@/data/items';
import { monsters } from '@/data/monsters';
import { getStoredToken, clearAuth } from '@/service/auth';

const LOCALE_STORAGE_KEY = 'map-hunter-locale';

function getInitialLocale(): Locale {
  try {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (s === 'uk' || s === 'en') return s;
  } catch {}
  return 'uk';
}

const initialPlayer: Player = {
  name: 'Hunter',
  level: 5,
  xp: 340,
  xpToNextLevel: 500,
  gold: 280,
  gems: 12,
  hp: 85,
  maxHp: 100,
  attack: 22,
  defense: 15,
  agility: 18,
  luck: 10,
  avatarEmoji: '🧙',
};

function getInitialAuth(): { token: string | null; authUser: AuthUser | null } {
  try {
    const token = getStoredToken();
    return { token, authUser: token ? {} as AuthUser : null };
  } catch {
    return { token: null, authUser: null };
  }
}

const initialAuth = getInitialAuth();

const initialState: GameState = {
  player: initialPlayer,
  isLoggedIn: !!initialAuth.token,
  tutorialComplete: false,
  inventory: startingInventory,
  activeBattle: null,
  settings: {
    musicEnabled: true,
    soundEnabled: true,
    notificationsEnabled: true,
  },
  lastLoot: [],
  locale: getInitialLocale(),
  token: initialAuth.token,
  authUser: initialAuth.authUser,
  usedNonBossGameIds: [],
  dungeonSession: null,
};

export type GameAction =
  | { type: 'LOGIN'; payload: { name: string } }
  | { type: 'LOGIN_SERVER'; payload: { token: string; user: AuthUser } }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'GAIN_XP'; payload: number }
  | { type: 'GAIN_GOLD'; payload: number }
  | { type: 'SPEND_GOLD'; payload: number }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'START_BATTLE'; payload: string }
  | { type: 'START_SERVER_BATTLE'; payload: { enemy: Enemy } }
  | { type: 'DEAL_DAMAGE'; payload: { target: 'player' | 'enemy'; amount: number } }
  | { type: 'HEAL_PLAYER'; payload: number }
  | { type: 'END_BATTLE'; payload: { won: boolean } }
  | { type: 'TOGGLE_SETTING'; payload: keyof GameState['settings'] }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOOT'; payload: InventoryItem[] }
  | { type: 'SET_LOCALE'; payload: Locale }
  | { type: 'RECORD_NON_BOSS_GAME_USED'; payload: number }
  | { type: 'RESET_NON_BOSS_GAMES' }
  | { type: 'SYNC_PLAYER_FROM_SERVER'; payload: AuthUser }
  | { type: 'DUNGEON_START'; payload: DungeonSession }
  | { type: 'DUNGEON_END' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        player: { ...state.player, name: action.payload.name },
        token: null,
        authUser: null,
      };
    case 'LOGIN_SERVER':
      return {
        ...state,
        isLoggedIn: true,
        token: action.payload.token,
        authUser: action.payload.user,
        player: {
          ...state.player,
          name: action.payload.user.nickname || state.player.name,
          level: action.payload.user.lvl ?? state.player.level,
          xp: action.payload.user.xp ?? state.player.xp,
          gold: action.payload.user.coins ?? state.player.gold,
          gems: action.payload.user.gems ?? state.player.gems,
          hp: action.payload.user.hp ?? state.player.hp,
          maxHp: action.payload.user.hp ?? state.player.maxHp,
          attack: action.payload.user.damage ?? state.player.attack,
        },
      };

    case 'COMPLETE_TUTORIAL':
      return { ...state, tutorialComplete: true };

    case 'GAIN_XP': {
      const newXp = state.player.xp + action.payload;
      const leveledUp = newXp >= state.player.xpToNextLevel;
      return {
        ...state,
        player: {
          ...state.player,
          xp: leveledUp ? newXp - state.player.xpToNextLevel : newXp,
          level: leveledUp ? state.player.level + 1 : state.player.level,
          xpToNextLevel: leveledUp
            ? Math.floor(state.player.xpToNextLevel * 1.4)
            : state.player.xpToNextLevel,
        },
      };
    }

    case 'GAIN_GOLD':
      return {
        ...state,
        player: { ...state.player, gold: state.player.gold + action.payload },
      };

    case 'SPEND_GOLD':
      return {
        ...state,
        player: {
          ...state.player,
          gold: Math.max(0, state.player.gold - action.payload),
        },
      };

    case 'ADD_ITEM': {
      const existing = state.inventory.find(
        (inv) => inv.item.id === action.payload.item.id && action.payload.item.stackable
      );
      if (existing) {
        return {
          ...state,
          inventory: state.inventory.map((inv) =>
            inv.item.id === action.payload.item.id
              ? { ...inv, quantity: inv.quantity + action.payload.quantity }
              : inv
          ),
        };
      }
      return { ...state, inventory: [...state.inventory, action.payload] };
    }

    case 'START_BATTLE': {
      const monster = monsters.find((m) => m.id === action.payload);
      if (!monster) return state;
      const battle: BattleState = {
        monster: { ...monster },
        playerHp: state.player.hp,
        turn: 'player',
        log: [`Battle started against ${monster.name}!`],
      };
      return { ...state, activeBattle: battle };
    }

    case 'START_SERVER_BATTLE': {
      const enemy = action.payload.enemy;
      const syntheticMonster = {
        id: enemy.id,
        name: enemy.name,
        emoji: '⚔️',
        level: 1,
        hp: enemy.hp,
        maxHp: enemy.hp,
        attack: enemy.damageToEnemy,
        defense: 0,
        xpReward: 0,
        goldReward: 0,
        lootTable: [] as string[],
      };
      const battle: BattleState = {
        monster: syntheticMonster,
        playerHp: state.player.hp,
        turn: 'player',
        log: [`Battle started against ${enemy.name}!`],
        serverEnemyId: enemy.id,
        isBoss: enemy.isBoss,
        enemyPhotoUrl: enemy.pathToPhoto || undefined,
        lat: enemy.latitude,
        lng: enemy.longitude,
      };
      return { ...state, activeBattle: battle };
    }

    case 'DEAL_DAMAGE': {
      if (!state.activeBattle) return state;
      const { target, amount } = action.payload;
      if (target === 'enemy') {
        const newHp = Math.max(0, state.activeBattle.monster.hp - amount);
        return {
          ...state,
          activeBattle: {
            ...state.activeBattle,
            monster: { ...state.activeBattle.monster, hp: newHp },
            turn: 'enemy',
            log: [
              ...state.activeBattle.log,
              `You dealt ${amount} damage to ${state.activeBattle.monster.name}!`,
            ],
          },
        };
      } else {
        const newHp = Math.max(0, state.activeBattle.playerHp - amount);
        return {
          ...state,
          activeBattle: {
            ...state.activeBattle,
            playerHp: newHp,
            turn: 'player',
            log: [
              ...state.activeBattle.log,
              `${state.activeBattle.monster.name} dealt ${amount} damage to you!`,
            ],
          },
        };
      }
    }

    case 'HEAL_PLAYER': {
      if (!state.activeBattle) return state;
      const healed = Math.min(state.player.maxHp, state.activeBattle.playerHp + action.payload);
      return {
        ...state,
        activeBattle: {
          ...state.activeBattle,
          playerHp: healed,
          turn: 'enemy',
          log: [
            ...state.activeBattle.log,
            `You used a potion and restored ${action.payload} HP!`,
          ],
        },
      };
    }

    case 'END_BATTLE': {
      if (!state.activeBattle) return state;
      const { won } = action.payload;
      if (won) {
        return {
          ...state,
          activeBattle: null,
          player: {
            ...state.player,
            hp: state.activeBattle.playerHp,
          },
        };
      }
      return { ...state, activeBattle: null };
    }

    case 'TOGGLE_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload]: !state.settings[action.payload],
        },
      };

    case 'SET_LOOT':
      return { ...state, lastLoot: action.payload };

    case 'RECORD_NON_BOSS_GAME_USED':
      return {
        ...state,
        usedNonBossGameIds: state.usedNonBossGameIds.includes(action.payload)
          ? state.usedNonBossGameIds
          : [...state.usedNonBossGameIds, action.payload],
      };

    case 'RESET_NON_BOSS_GAMES':
      return { ...state, usedNonBossGameIds: [] };

    case 'SYNC_PLAYER_FROM_SERVER': {
      const u = action.payload;
      return {
        ...state,
        authUser: u,
        player: {
          ...state.player,
          name: u.nickname ?? state.player.name,
          level: u.lvl ?? state.player.level,
          xp: u.xp ?? state.player.xp,
          gold: u.coins ?? state.player.gold,
          gems: u.gems ?? state.player.gems,
          hp: u.hp ?? state.player.hp,
          maxHp: u.hp ?? state.player.maxHp,
          attack: u.damage ?? state.player.attack,
        },
      };
    }

    case 'SET_LOCALE':
      return { ...state, locale: action.payload };

    case 'LOGOUT':
      clearAuth();
      return { ...initialState, token: null, authUser: null, usedNonBossGameIds: [], dungeonSession: null };

    case 'DUNGEON_START':
      return { ...state, dungeonSession: action.payload, usedNonBossGameIds: [] };

    case 'DUNGEON_END':
      return { ...state, dungeonSession: null };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, state.locale);
    } catch {}
  }, [state.locale]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export default GameContext;
