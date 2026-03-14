import { useEffect, useState } from 'react';
import { getEnemiesByCity } from '@/api';
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
    type: 'monster',
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    label: enemy.name,
    enemyId: enemy.id,
    lat: enemy.latitude,
    lng: enemy.longitude,
  };
}

/**
 * Returns map markers from the server: fetches enemies via getEnemiesByCity(city)
 * and merges with static chests/events. No auth required for enemy list.
 */
export function useMapMarkers(city = 'Kyiv'): {
  markers: MapMarkerData[];
  loading: boolean;
  error: string | null;
} {
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
  const apiMonsterMarkers = enemies.map(enemyToMarker);
  const markers =
    apiMonsterMarkers.length > 0
      ? [...apiMonsterMarkers, ...staticNonMonsters]
      : mapMarkers;

  return { markers, loading, error };
}
