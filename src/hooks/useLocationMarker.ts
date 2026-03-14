import { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { getEnemiesByCity } from '@/api';
import type { Enemy } from '@/types/api';
import type { MapMarkerData } from '@/types/game';

/**
 * Resolves a location by id using only server data or the active dungeon session.
 */
export function useLocationMarker(locationId: string | undefined) {
  const { state } = useGame();
  const [serverEnemy, setServerEnemy] = useState<Enemy | null>(null);
  const [loading, setLoading] = useState(false);

  // Check dungeon session first — resolves directly from local state (no API call)
  const dungeonEnemy = locationId && state.dungeonSession
    ? state.dungeonSession.enemies.find((e) => e.id === locationId) ?? null
    : null;

  useEffect(() => {
    if (!locationId || !state.token || dungeonEnemy != null) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, state.token, dungeonEnemy != null]);

  const resolvedEnemy = dungeonEnemy ?? serverEnemy;

  const marker: MapMarkerData | null = resolvedEnemy
    ? {
        id: resolvedEnemy.id,
        type: resolvedEnemy.dungeonEntrance ? 'dungeon' : 'monster',
        x: 0,
        y: 0,
        label: resolvedEnemy.name,
        enemyId: resolvedEnemy.id,
        lat: resolvedEnemy.latitude,
        lng: resolvedEnemy.longitude,
      }
    : null;

  return {
    marker,
    serverEnemy: resolvedEnemy,
    loading,
    isDungeonEnemy: dungeonEnemy != null,
  };
}
