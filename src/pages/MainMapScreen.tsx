import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Backpack, ShoppingCart, MapPin, Settings } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { StatusBar } from '@/components/game/StatusBar';
import { GameMap } from '@/components/game/GameMap';
import { FloatingActionButton } from '@/components/game/FloatingActionButton';
import { GameButton } from '@/components/game/GameButton';
import { useT } from '@/i18n/useT';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import type { MapMarkerData } from '@/types/game';

export default function MainMapScreen() {
  const navigate = useNavigate();
  const { t } = useT();
  const { markers, error: markersError } = useMapMarkers('Kyiv');
  const centerFnRef = useRef<(() => void) | null>(null);
  const [, forceUpdate] = useState(0);

  const handleMarkerClick = (marker: MapMarkerData) => {
    if (marker.type === 'dungeon') {
      navigate(`/dungeon/${marker.id}`);
    } else {
      navigate(`/location/${marker.id}`);
    }
  };

  const handleCenterRef = useCallback((fn: () => void) => {
    centerFnRef.current = fn;
    forceUpdate((n) => n + 1);
  }, []);




  return (
    <GameShell pattern="map">
      {/* Map fills entire screen; UI is overlaid */}
      <div className="relative flex-1 min-h-0 w-full">
        <div className="absolute inset-0">
          {markersError && (
            <div className="absolute top-14 left-2 right-2 z-20 rounded-lg border-2 border-amber-500/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {markersError}
            </div>
          )}
          <GameMap
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onCenterRef={handleCenterRef}
          />
        </div>

        {/* Status bar overlay */}
        <div className="absolute left-0 right-0 top-0 z-10">
          <StatusBar />
        </div>

        {/* Right floating buttons — phones only */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10 md:hidden">
          <FloatingActionButton
            icon={User}
            label={t('nav_character')}
            onClick={() => navigate('/character')}
          />
          <FloatingActionButton
            icon={Backpack}
            label={t('nav_inventory')}
            onClick={() => navigate('/inventory')}
          />
          <FloatingActionButton
            icon={ShoppingCart}
            label={t('nav_shop')}
            onClick={() => navigate('/shop')}
          />
          <FloatingActionButton
            icon={Settings}
            label={t('nav_settings')}
            onClick={() => navigate('/settings')}
          />
        </div>

        {/* GPS / Location button — center map on player */}
        <button
          type="button"
          className="absolute bottom-24 right-3 md:bottom-20 md:right-4 w-10 h-10 rounded-lg bg-card border-2 border-border shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)] flex items-center justify-center z-10 cursor-pointer transition-[box-shadow,transform] duration-150 active:translate-y-[2px] active:shadow-none hover:border-primary/50"
          aria-label={t('common_centerOnPlayer')}
          onClick={() => centerFnRef.current?.()}
        >
          <MapPin className="w-4 h-4 text-primary" />
        </button>

        {/* Bottom bar — phone: strip like StatusBar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 game-strip-bottom md:hidden">
          <GameButton
            variant="primary"
            size="lg"
            fullWidth
            className="text-lg"
            onClick={() => centerFnRef.current?.()}
          >
            🔍 {t('nav_scanArea')}
          </GameButton>
        </div>

        {/* Bottom nav bar — tablet+ */}
        <div className="absolute bottom-0 left-0 right-0 z-10 hidden md:flex items-center gap-3 px-4 py-2.5 game-strip-bottom">
          <FloatingActionButton icon={User} label={t('nav_character')} onClick={() => navigate('/character')} />
          <FloatingActionButton icon={Backpack} label={t('nav_inventory')} onClick={() => navigate('/inventory')} />
          <GameButton
            variant="primary"
            size="md"
            fullWidth
            className="flex-1"
            onClick={() => centerFnRef.current?.()}
          >
            🔍 {t('nav_scanArea')}
          </GameButton>
          <FloatingActionButton icon={ShoppingCart} label={t('nav_shop')} onClick={() => navigate('/shop')} />
          <FloatingActionButton icon={Settings} label={t('nav_settings')} onClick={() => navigate('/settings')} />
        </div>
      </div>
    </GameShell>
  );
}
