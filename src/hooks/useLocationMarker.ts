import { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { getEnemiesByCity } from '@/api';
import type { Enemy } from '@/types/api';
import type { MapMarkerData } from '@/types/game';
import { mapMarkers } from '@/data/monsters';
import { monsters } from '@/data/monsters';

/**
 * Resolves location by id: static marker + local monster, dungeon session enemy, or API enemy.
 */
export function useLocationMarker(locationId: string | undefined) {
  const { state } = useGame();
  const [serverEnemy, setServerEnemy] = useState<Enemy | null>(null);
  const [loading, setLoading] = useState(false);

  const staticMarker = locationId ? mapMarkers.find((m) => m.id === locationId) : null;
  const localMonster = staticMarker?.monsterId
    ? monsters.find((m) => m.id === staticMarker.monsterId) ?? null
    : null;

  // Check if this is a dungeon session enemy — resolve directly from session state
  const dungeonEnemy = locationId && state.dungeonSession
    ? state.dungeonSession.enemies.find((e) => e.id === locationId) ?? null
    : null;

  useEffect(() => {
    if (!locationId || !state.token || staticMarker != null || dungeonEnemy != null) {
      setServerEnemy(null);
      return;
    }
    setLoading(true);
    getEnemiesByCity('Kyiv')
      .then((list) => {
        const enemy = (list ?? []).find((e) => e.id === locationId) ?? null;
        setServerEnemy(enemy);
      })
      .catch(() => setServerEnemy(null))
      .finally(() => setLoading(false));
  }, [locationId, state.token, staticMarker != null, dungeonEnemy != null]);

  const resolvedEnemy = dungeonEnemy ?? serverEnemy;

  const marker: MapMarkerData | null = staticMarker ?? (resolvedEnemy
    ? {
        id: resolvedEnemy.id,
        type: 'monster',
        x: 0,
        y: 0,
        label: resolvedEnemy.name,
        enemyId: resolvedEnemy.id,
      }
    : null);

  return {
    marker,
    monster: localMonster,
    serverEnemy: resolvedEnemy,
    loading,
    isDungeonEnemy: dungeonEnemy != null,
  };
}
