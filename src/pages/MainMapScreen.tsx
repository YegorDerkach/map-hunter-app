import { useNavigate } from 'react-router-dom';
import { User, Backpack, ScrollText, ShoppingCart, MapPin, Settings } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { StatusBar } from '@/components/game/StatusBar';
import { MapMarker } from '@/components/game/MapMarker';
import { FloatingActionButton } from '@/components/game/FloatingActionButton';
import { GameButton } from '@/components/game/GameButton';
import { mapMarkers } from '@/data/monsters';
import { quests } from '@/data/quests';
import type { MapMarkerData } from '@/types/game';

export default function MainMapScreen() {
  const navigate = useNavigate();
  const activeQuests = quests.filter((q) => !q.completed).length;

  const handleMarkerClick = (marker: MapMarkerData) => {
    navigate(`/location/${marker.id}`);
  };

  return (
    <GameShell>
      <StatusBar />

      {/* Map Area */}
      <div className="relative flex-1 overflow-hidden game-gradient-sky min-h-[480px]">
        {/* Grid overlay for map feel */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Map decorations */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute text-3xl opacity-40" style={{ left: '10%', top: '15%' }}>🌲</span>
          <span className="absolute text-2xl opacity-30" style={{ left: '55%', top: '10%' }}>⛰️</span>
          <span className="absolute text-3xl opacity-35" style={{ left: '80%', top: '55%' }}>🌊</span>
          <span className="absolute text-2xl opacity-40" style={{ left: '30%', top: '80%' }}>🌲</span>
          <span className="absolute text-2xl opacity-30" style={{ left: '88%', top: '18%' }}>🏔️</span>
          <span className="absolute text-3xl opacity-35" style={{ left: '5%', top: '55%' }}>🌿</span>
          <span className="absolute text-2xl opacity-30" style={{ left: '60%', top: '78%' }}>🌾</span>
        </div>

        {/* Player marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: '50%', top: '52%' }}
        >
          <div className="w-8 h-8 rounded-full bg-primary border-4 border-white dark:border-background animate-pulse-glow shadow-lg flex items-center justify-center text-sm">
            🧙
          </div>
        </div>

        {/* Map Markers */}
        {mapMarkers.map((marker) => (
          <MapMarker key={marker.id} marker={marker} onClick={handleMarkerClick} />
        ))}

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
          className="absolute bottom-20 right-3 w-10 h-10 rounded-lg bg-background/95 border-2 border-b-[3px] border-border shadow-[var(--shadow-btn-outline)] flex items-center justify-center z-10 transition-[box-shadow,transform] duration-75 active:translate-y-[3px] active:shadow-none"
          aria-label="Center on player"
        >
          <MapPin className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="p-4 border-t-2 border-border bg-background/95 backdrop-blur">
        <GameButton
          variant="primary"
          size="lg"
          fullWidth
          className="text-lg"
        >
          🔍 Scan Area
        </GameButton>
      </div>
    </GameShell>
  );
}
