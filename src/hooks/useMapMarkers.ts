import { useEffect, useState } from 'react';
import { getEnemiesByCity } from '@/api';
import { useGame } from '@/context/GameContext';
import type { Enemy } from '@/types/api';
import type { MapMarkerData } from '@/types/game';
import { mapMarkers } from '@/data/monsters';

const DEFAULT_CENTER = { lat: 50.4501, lng: 30.5234 };
const SPREAD = 0.022;

function enemyToMarker(enemy: Enemy): MapMarkerData {
  const x = ((enemy.longitude - DEFAULT_CENTER.lng) / SPREAD + 0.5) * 100;
  const y = (0.5 - (enemy.latitude - DEFAULT_CENTER.lat) / SPREAD) * 100;
  return {
    id: enemy.id,
    type: enemy.dungeonEntrance ? 'dungeon' : 'monster',
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    label: enemy.name,
    enemyId: enemy.id,
    lat: enemy.latitude,
    lng: enemy.longitude,
  };
}

/**
 * Returns map markers from the server: fetches enemies via getEnemiesByCity(city),
 * merges dungeon session enemies (when active), and falls back to static markers.
 */
export function useMapMarkers(city = 'Kyiv'): {
  markers: MapMarkerData[];
  loading: boolean;
  error: string | null;
} {
  const { state } = useGame();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getEnemiesByCity(city)
      .then((list) => {
        setEnemies(list ?? []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load enemies');
        setEnemies([]);
      })
      .finally(() => setLoading(false));
  }, [city]);

  const staticNonMonsters = mapMarkers.filter((m) => m.type !== 'monster');
  const apiEnemyMarkers = enemies.map(enemyToMarker);

  // Dungeon session enemies: show on map as monster markers (no re-scan needed)
  const dungeonMarkers: MapMarkerData[] = (state.dungeonSession?.enemies ?? []).map((e) => ({
    id: e.id,
    type: 'monster' as const,
    x: 50,
    y: 50,
    label: e.isBoss ? `👑 ${e.name}` : e.name,
    enemyId: e.id,
    lat: e.latitude,
    lng: e.longitude,
  }));

  let baseMarkers: MapMarkerData[];
  if (apiEnemyMarkers.length > 0) {
    baseMarkers = [...apiEnemyMarkers, ...staticNonMonsters];
  } else {
    baseMarkers = [...mapMarkers];
  }

  const markers = dungeonMarkers.length > 0
    ? [...baseMarkers, ...dungeonMarkers]
    : baseMarkers;

  return { markers, loading, error };
}
