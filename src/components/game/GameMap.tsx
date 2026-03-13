import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import type { MapMarkerData } from '@/types/game';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LatLng { lat: number; lng: number }

interface GameMapProps {
  markers: MapMarkerData[];
  onMarkerClick: (marker: MapMarkerData) => void;
  onCenterRef?: (centerFn: () => void) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 }; // Kyiv
const DEFAULT_ZOOM = 15;
const SPREAD = 0.008; // ~900 m spread
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

const MARKER_META: Record<string, { color: string; emoji: string }> = {
  monster: { color: '#ef4444', emoji: '⚔️' },
  chest:   { color: '#f59e0b', emoji: '📦' },
  event:   { color: '#a855f7', emoji: '🌟' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function markerToLatLng(marker: MapMarkerData, center: LatLng): LatLng {
  return {
    lat: center.lat + (0.5 - marker.y / 100) * SPREAD,
    lng: center.lng + (marker.x / 100 - 0.5) * SPREAD,
  };
}

// ─── Marker overlay element ───────────────────────────────────────────────────

function GameMarkerOverlay({
  marker,
  center,
  onClick,
}: {
  marker: MapMarkerData;
  center: LatLng;
  onClick: () => void;
}) {
  const meta = MARKER_META[marker.type] ?? { color: '#3b82f6', emoji: '❓' };
  const label = marker.label.length > 14 ? marker.label.slice(0, 13) + '…' : marker.label;

  return (
    <OverlayView
      position={markerToLatLng(marker, center)}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          transform: 'translate(-50%, -100%)',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Pin body */}
        <div
          style={{
            background: meta.color,
            border: '2px solid white',
            borderRadius: 8,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: `0 3px 0 ${meta.color}99, 0 4px 12px rgba(0,0,0,0.35)`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 14 }}>{meta.emoji}</span>
          <span
            style={{
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {label}
          </span>
        </div>
        {/* Tip arrow */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${meta.color}`,
            marginTop: -1,
          }}
        />
      </div>
    </OverlayView>
  );
}

// ─── Inner map (only rendered when API is loaded) ─────────────────────────────

function MapRenderer({
  markers,
  onMarkerClick,
  onCenterRef,
}: GameMapProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [playerLocation, setPlayerLocation] = useState<LatLng | null>(null);
  const mapCenter = playerLocation ?? DEFAULT_CENTER;
  const mapReady = !!mapInstance;

  const centerOnPlayer = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPlayerLocation(loc);
        mapInstance?.panTo(loc);
        mapInstance?.setZoom(DEFAULT_ZOOM);
      },
      () => {},
    );
  }, [mapInstance]);

  useEffect(() => {
    onCenterRef?.(centerOnPlayer);
  }, [onCenterRef, centerOnPlayer]);

  const onLoad = useCallback((m: google.maps.Map) => {
    setMapInstance(m);
    // Force resize so tiles paint (fixes blank map when container size wasn't ready)
    const triggerResize = () => google.maps.event.trigger(m, 'resize');
    triggerResize();
    window.requestAnimationFrame(triggerResize);
    setTimeout(triggerResize, 100);
  }, []);

  // Fix blank map on mobile
  useEffect(() => {
    if (!mapInstance) return;
    const trigger = () =>
      window.requestAnimationFrame(() =>
        google.maps.event.trigger(mapInstance, 'resize'),
      );
    trigger();
    const t = setTimeout(trigger, 150);
    window.addEventListener('resize', trigger);
    return () => { clearTimeout(t); window.removeEventListener('resize', trigger); };
  }, [mapInstance]);

  // Auto-acquire GPS on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        setPlayerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        options={{
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {mapReady &&
          markers.map((marker) => (
            <GameMarkerOverlay
              key={marker.id}
              marker={marker}
              center={mapCenter}
              onClick={() => onMarkerClick(marker)}
            />
          ))}

        {mapReady && playerLocation && (
          <OverlayView
            position={playerLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'hsl(217 91% 60%)',
                border: '3px solid white',
                boxShadow: '0 0 0 4px hsl(217 91% 60% / 0.3)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
}

// ─── Loader wrapper (calls useJsApiLoader only when key is present) ───────────

function GoogleMapLoader(props: GameMapProps & { apiKey: string }) {
  const { apiKey, ...rest } = props;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="w-full h-full game-gradient-sky flex items-center justify-center p-6">
        <div className="text-center bg-card/90 backdrop-blur rounded-lg border-2 border-b-4 border-border p-4">
          <p className="font-display font-bold text-destructive mb-1">Map failed to load</p>
          <p className="text-xs text-muted-foreground">Check API key & Maps JS billing</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full game-gradient-sky flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse-glow mb-2">🗺️</div>
          <p className="text-sm text-muted-foreground font-display">Loading map…</p>
        </div>
      </div>
    );
  }

  return <MapRenderer {...rest} />;
}

// ─── Public component ─────────────────────────────────────────────────────────

export function GameMap(props: GameMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return (
      <div className="w-full h-full game-gradient-sky flex items-center justify-center">
        <div className="text-center px-6 py-4 bg-card/90 backdrop-blur rounded-lg border-2 border-b-4 border-border">
          <p className="font-display font-bold text-foreground mb-1">No Maps API key</p>
          <p className="text-xs text-muted-foreground">Add VITE_GOOGLE_MAPS_API_KEY to .env</p>
        </div>
      </div>
    );
  }

  return <GoogleMapLoader apiKey={apiKey} {...props} />;
}
