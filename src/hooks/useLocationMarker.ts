import { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { getEnemiesByCity } from '@/api';
import type { Enemy } from '@/types/api';
import type { MapMarkerData } from '@/types/game';
import { mapMarkers } from '@/data/monsters';
import { monsters } from '@/data/monsters';

/**
 * Resolves location by id: static marker + local monster, or API enemy (when logged in).
 */
export function useLocationMarker(locationId: string | undefined) {
  const { state } = useGame();
  const [serverEnemy, setServerEnemy] = useState<Enemy | null>(null);
  const [loading, setLoading] = useState(false);

  const staticMarker = locationId ? mapMarkers.find((m) => m.id === locationId) : null;
  const localMonster = staticMarker?.monsterId
    ? monsters.find((m) => m.id === staticMarker.monsterId) ?? null
    : null;

  useEffect(() => {
    if (!locationId || !state.token || staticMarker != null) {
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
  }, [locationId, state.token, staticMarker != null]);

  const marker: MapMarkerData | null = staticMarker ?? (serverEnemy
    ? {
        id: serverEnemy.id,
        type: 'monster',
        x: 0,
        y: 0,
        label: serverEnemy.name,
        enemyId: serverEnemy.id,
      }
    : null);

  return {
    marker,
    monster: localMonster,
    serverEnemy,
    loading,
  };
}
