import { useState, useEffect } from 'react';

const POLL_INTERVAL_MS = 30_000;
const REDISPLAY_INTERVAL_MS = 10_000;

export interface AirRaidAlertState {
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
  alertActive: boolean;
  regionName: string | null;
}

export function useAirRaidAlert(): AirRaidAlertState {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [alertActive, setAlertActive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Get user location once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Reverse geocode to get Ukrainian oblast name
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=uk`,
      { headers: { 'User-Agent': 'MapHunterApp/1.0' } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const state: string | null = data?.address?.state ?? data?.address?.county ?? null;
        setRegionName(state);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [coords]);

  // Poll the air raid API every 30 s
  useEffect(() => {
    if (!regionName) return;

    let cancelled = false;

    const check = async () => {
      try {
        const r = await fetch('https://ubilling.net.ua/aerialalerts/');
        if (!r.ok) return;
        const data = await r.json();
        const states: Record<string, { alertnow: boolean }> = data?.states ?? {};
        const needle = regionName.toLowerCase();
        const matchKey = Object.keys(states).find((k) => {
          const hay = k.toLowerCase();
          // Match if the first meaningful word appears in either string
          const word = needle.split(/\s+/)[0];
          return hay.includes(word) || needle.includes(hay.split(/\s+/)[0]);
        });
        if (cancelled) return;
        const active = matchKey ? (states[matchKey]?.alertnow ?? false) : false;
        setAlertActive(active);
        if (active) setShowDialog(true);
        else setShowDialog(false);
      } catch {}
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [regionName]);

  // Re-display dialog every 10 s while alert is active
  useEffect(() => {
    if (!alertActive) return;
    const id = setInterval(() => setShowDialog(true), REDISPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [alertActive]);

  return { showDialog, setShowDialog, alertActive, regionName };
}
