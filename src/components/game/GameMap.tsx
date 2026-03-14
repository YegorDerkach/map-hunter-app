import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GoogleMap, OverlayViewF, useJsApiLoader } from '@react-google-maps/api';
import type { MapMarkerData } from '@/types/game';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LatLng { lat: number; lng: number }

interface GameMapProps {
  markers: MapMarkerData[];
  onMarkerClick: (marker: MapMarkerData) => void;
  onCenterRef?: (centerFn: () => void) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** When true, never call Geolocation API — player is always Kyiv (no permission prompt). */
const GPS_STUB = false;

const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 }; // Kyiv
const DEFAULT_ZOOM = 14;
const SPREAD = 0.022; // ~2.5 km around Kyiv so monsters are clearly visible
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

const MARKER_META: Record<string, { color: string; emoji: string }> = {
  monster: { color: '#ef4444', emoji: '⚔️' },
  chest:   { color: '#f59e0b', emoji: '📦' },
};

const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function markerToLatLng(marker: MapMarkerData): LatLng {
  // Use raw GPS coords if present (server enemies) — no precision loss
  if (marker.lat !== undefined && marker.lng !== undefined) {
    return { lat: marker.lat, lng: marker.lng };
  }
  // Fallback: decode from x/y percentage (static/local markers) relative to Kyiv center
  return {
    lat: DEFAULT_CENTER.lat + (0.5 - marker.y / 100) * SPREAD,
    lng: DEFAULT_CENTER.lng + (marker.x / 100 - 0.5) * SPREAD,
  };
}

// ─── Marker overlay element ───────────────────────────────────────────────────

function GameMarkerOverlay({
  marker,
  onClick,
}: {
  marker: MapMarkerData;
  onClick: () => void;
}) {
  const meta = MARKER_META[marker.type] ?? { color: '#3b82f6', emoji: '❓' };
  const label = marker.label.length > 14 ? marker.label.slice(0, 13) + '…' : marker.label;

  const position = markerToLatLng(marker);
  const pinWidth = 120;
  const pinHeight = 36;

  return (
    <OverlayViewF
      position={position}
      mapPaneName="floatPane"
      getPixelPositionOffset={(width: number, height: number) => ({
        x: -((width || pinWidth) / 2),
        y: -(height || pinHeight),
      })}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: pinWidth,
          minHeight: pinHeight,
        }}
      >
        {/* Pin body */}
        <div
          style={{
            background: meta.color,
            border: '2px solid hsl(38 35% 88%)',
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
              color: 'hsl(38 30% 96%)',
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
    </OverlayViewF>
  );
}

// ─── Inner map (only rendered when API is loaded) ─────────────────────────────

const LOCATION_ERROR_MESSAGE =
  'Location is blocked. To enable: click the lock or tune icon next to the URL → Site settings → Location → Allow.';

const LOCATION_UNAVAILABLE_MESSAGE =
  'Location could not be determined. On Mac: System Settings → Privacy & Security → Location Services → enable for this browser. You can still use the map centered on Kyiv.';

/** Desktop often fails with kCLErrorLocationUnknown; use shorter timeout to fail fast and avoid console spam. */
function isLikelyDesktop(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints === 0 && !/Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000,
};

const LOCATION_OPTIONS_DESKTOP: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 6000,
  maximumAge: 300000,
};

const LOCATION_OPTIONS_FALLBACK: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 30000,
};

function MapRenderer({
  markers,
  onMarkerClick,
  onCenterRef,
}: GameMapProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [playerLocation, setPlayerLocation] = useState<LatLng | null>(GPS_STUB ? DEFAULT_CENTER : null);
  const [locationError, setLocationError] = useState<'denied' | 'unavailable' | 'timeout' | null>(null);
  const [locationBannerDismissed, setLocationBannerDismissed] = useState(false);
  const mapCenter = playerLocation ?? DEFAULT_CENTER;
  const mapReady = !!mapInstance;

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    if (error.code === 1) setLocationError('denied');
    else if (error.code === 2) setLocationError('unavailable');
    else setLocationError('timeout');
  }, []);

  const requestLocation = useCallback(
    (useFallback = false) => {
      if (!mapInstance) return;
      const onDesktop = isLikelyDesktop();
      const options = useFallback
        ? LOCATION_OPTIONS_FALLBACK
        : onDesktop
          ? LOCATION_OPTIONS_DESKTOP
          : LOCATION_OPTIONS;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPlayerLocation(loc);
          setLocationError(null);
          mapInstance.panTo(loc);
          mapInstance.setZoom(DEFAULT_ZOOM);
        },
        (err: GeolocationPositionError) => {
          if (!onDesktop && !useFallback && (err.code === 2 || err.code === 3)) {
            window.setTimeout(() => requestLocation(true), 3000);
            return;
          }
          handleLocationError(err);
        },
        options,
      );
    },
    [mapInstance, handleLocationError],
  );

  const centerOnPlayer = useCallback(() => {
    if (GPS_STUB) {
      setPlayerLocation(DEFAULT_CENTER);
      setLocationError(null);
      setLocationBannerDismissed(true);
      mapInstance?.panTo(DEFAULT_CENTER);
      mapInstance?.setZoom(DEFAULT_ZOOM);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('unavailable');
      return;
    }
    setLocationBannerDismissed(false);
    if (mapInstance) {
      requestLocation();
    } else {
      const options = isLikelyDesktop() ? LOCATION_OPTIONS_DESKTOP : LOCATION_OPTIONS;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPlayerLocation(loc);
          setLocationError(null);
        },
        handleLocationError,
        options,
      );
    }
  }, [mapInstance, handleLocationError, requestLocation]);

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

  // Request real GPS on mount when not using stub (skip on desktop to avoid CoreLocation spam)
  useEffect(() => {
    if (GPS_STUB || !mapInstance) return;
    if (isLikelyDesktop()) return;
    if (!navigator.geolocation) {
      setLocationError('unavailable');
      return;
    }
    requestLocation();
  }, [GPS_STUB, mapInstance, requestLocation]);

  const showLocationBanner = locationError && !locationBannerDismissed;

  return (
    <div className="w-full h-full relative overflow-hidden">
      {showLocationBanner && (
        <div className="absolute top-2 left-2 right-2 z-20 flex items-start gap-2 rounded-lg border-2 border-amber-500/80 bg-amber-50 px-3 py-2 shadow-lg">
          <p className="flex-1 text-xs text-amber-900">
            {locationError === 'denied' ? LOCATION_ERROR_MESSAGE : LOCATION_UNAVAILABLE_MESSAGE}
          </p>
          <div className="shrink-0 flex items-center gap-1">
            {locationError !== 'denied' && (
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-medium text-amber-800 bg-amber-200/70 hover:bg-amber-300/80"
                onClick={() => {
                  setLocationBannerDismissed(false);
                  setLocationError(null);
                  requestLocation();
                }}
              >
                Try again
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              className="rounded p-1 text-amber-700 hover:bg-amber-200/50"
              onClick={() => setLocationBannerDismissed(true)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
          styles: LIGHT_MAP_STYLES,
        }}
      >
        {mapReady &&
          markers.map((marker) => (
            <GameMarkerOverlay
              key={marker.id}
              marker={marker}
              onClick={() => onMarkerClick(marker)}
            />
          ))}

        {mapReady && playerLocation && (
          <OverlayViewF
            position={playerLocation}
            mapPaneName="floatPane"
            getPixelPositionOffset={(w: number, h: number) => ({ x: -((w || 20) / 2), y: -((h || 20) / 2) })}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'hsl(217 91% 60%)',
                border: '3px solid hsl(38 35% 92%)',
                boxShadow: '0 0 0 4px hsl(217 91% 60% / 0.3)',
              }}
            />
          </OverlayViewF>
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
      <div className="w-full h-full relative">
        <PlaceholderMapView {...rest} />
        <div className="absolute top-4 left-4 right-4 text-center px-3 py-2 bg-destructive/90 text-destructive-foreground rounded-lg border-2 border-border text-xs font-medium">
          Map failed to load — check API key & billing. Markers below are clickable.
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

// ─── Placeholder map (no API key or demo) ─────────────────────────────────────

function PlaceholderMapView({ markers, onMarkerClick, onCenterRef }: GameMapProps) {
  const [locationLabel, setLocationLabel] = useState<string>('Київ (заглушка)');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast.success(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => toast.error('Location access denied or unavailable'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    onCenterRef?.(requestLocation);
    return () => onCenterRef?.(() => {});
  }, [onCenterRef, requestLocation]);

  return (
    <div className="w-full h-full min-h-[300px] game-gradient-sky relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(217 50% 85% / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(217 50% 85% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      {/* You are here */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-primary/90 text-primary-foreground text-xs font-display font-bold z-10 shadow-lg">
        📍 {locationLabel}
      </div>
      {/* Markers at x% / y% */}
      {markers.map((marker) => {
        const meta = MARKER_META[marker.type] ?? { color: '#3b82f6', emoji: '❓' };
        const label = marker.label.length > 14 ? marker.label.slice(0, 13) + '…' : marker.label;
        return (
          <button
            key={marker.id}
            type="button"
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg z-20"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
            }}
            onClick={() => onMarkerClick(marker)}
          >
            <div
              className="flex flex-col items-center gap-0.5"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))',
              }}
            >
              <div
                className="flex items-center gap-1.5 border-2 border-[hsl(38_35%_88%)] rounded-lg px-2 py-1"
                style={{
                  background: meta.color,
                  borderBottomLeftRadius: 2,
                  borderBottomRightRadius: 2,
                  boxShadow: `0 3px 0 ${meta.color}99`,
                }}
              >
                <span className="text-sm">{meta.emoji}</span>
                <span className="text-[hsl(38_30%_96%)] text-[11px] font-bold font-[system-ui,sans-serif] whitespace-nowrap">
                  {label}
                </span>
              </div>
              <div
                className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-0.5"
                style={{ borderTopColor: meta.color }}
              />
            </div>
          </button>
        );
      })}
      {/* Hint banner */}
      <div className="absolute bottom-4 left-4 right-4 text-center px-3 py-2 bg-card/90 backdrop-blur rounded-lg border-2 border-border text-xs text-muted-foreground">
        Add VITE_GOOGLE_MAPS_API_KEY to .env for real map
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function GameMap(props: GameMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return <PlaceholderMapView {...props} />;
  }

  return <GoogleMapLoader apiKey={apiKey} {...props} />;
}
