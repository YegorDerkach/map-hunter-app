import { cn } from '@/lib/utils';
import { MapMarkerData } from '@/types/game';

interface MapMarkerProps {
  marker: MapMarkerData;
  onClick: (marker: MapMarkerData) => void;
}

const markerConfig = {
  monster: {
    bg: 'bg-[hsl(var(--game-red))]',
    ring: 'ring-[hsl(var(--game-red)/0.4)]',
    emoji: '⚔️',
    animation: 'animate-float',
    label: 'text-[hsl(var(--game-red))]',
  },
  chest: {
    bg: 'bg-[hsl(var(--game-yellow))]',
    ring: 'ring-[hsl(var(--game-yellow)/0.4)]',
    emoji: '📦',
    animation: 'animate-pulse-glow',
    label: 'text-[hsl(var(--game-yellow))]',
  },
};

export function MapMarker({ marker, onClick }: MapMarkerProps) {
  const config = markerConfig[marker.type];

  return (
    <button
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer z-10"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      onClick={() => onClick(marker)}
    >
      <div
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center text-xl',
          'ring-4',
          config.bg,
          config.ring,
          config.animation,
          'shadow-lg transition-transform group-hover:scale-110'
        )}
      >
        {marker.type === 'monster' ? '⚔️' : '📦'}
      </div>
      <span
        className={cn(
          'text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur whitespace-nowrap',
          config.label
        )}
      >
        {marker.label}
      </span>
    </button>
  );
}
