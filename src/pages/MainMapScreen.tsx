import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Backpack, ScrollText, ShoppingCart, MapPin, Settings } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { StatusBar } from '@/components/game/StatusBar';
import { GameMap } from '@/components/game/GameMap';
import { FloatingActionButton } from '@/components/game/FloatingActionButton';
import { GameButton } from '@/components/game/GameButton';
import { mapMarkers } from '@/data/monsters';
import { quests } from '@/data/quests';
import type { MapMarkerData } from '@/types/game';

export default function MainMapScreen() {
  const navigate = useNavigate();
  const activeQuests = quests.filter((q) => !q.completed).length;
  const centerFnRef = useRef<(() => void) | null>(null);
  const [, forceUpdate] = useState(0);

  const handleMarkerClick = (marker: MapMarkerData) => {
    navigate(`/location/${marker.id}`);
  };

  const handleCenterRef = useCallback((fn: () => void) => {
    centerFnRef.current = fn;
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <GameShell>
      {/* Map fills entire screen; UI is overlaid */}
      <div className="relative flex-1 min-h-0 w-full">
        <div className="absolute inset-0">
          <GameMap
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            onCenterRef={handleCenterRef}
          />
        </div>

        {/* Status bar overlay */}
        <div className="absolute left-0 right-0 top-0 z-10">
          <StatusBar />
        </div>

        {/* Right floating buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <FloatingActionButton
            icon={User}
            label="Character"
            onClick={() => navigate('/character')}
          />
          <FloatingActionButton
            icon={Backpack}
            label="Inventory"
            onClick={() => navigate('/inventory')}
          />
          <FloatingActionButton
            icon={ScrollText}
            label="Quests"
            onClick={() => navigate('/quests')}
            badge={activeQuests}
          />
          <FloatingActionButton
            icon={ShoppingCart}
            label="Shop"
            onClick={() => navigate('/shop')}
          />
          <FloatingActionButton
            icon={Settings}
            label="Settings"
            onClick={() => navigate('/settings')}
          />
        </div>

        {/* GPS Button */}
        <button
          className="absolute bottom-24 right-3 w-10 h-10 rounded-lg bg-background/95 border-2 border-b-[3px] border-border shadow-[var(--shadow-btn-outline)] flex items-center justify-center z-10 transition-[box-shadow,transform] duration-75 active:translate-y-[3px] active:shadow-none"
          aria-label="Center on player"
          onClick={() => centerFnRef.current?.()}
        >
          <MapPin className="w-4 h-4 text-primary" />
        </button>

        {/* Bottom bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 border-t-2 border-border bg-background/95 backdrop-blur">
          <GameButton variant="primary" size="lg" fullWidth className="text-lg">
            🔍 Scan Area
          </GameButton>
        </div>
      </div>
    </GameShell>
  );
}
