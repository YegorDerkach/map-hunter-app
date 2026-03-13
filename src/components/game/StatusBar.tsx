import { Coins, Gem, Star } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { XPBar } from './XPBar';
import { ThemeToggle } from './ThemeToggle';

export function StatusBar() {
  const { state } = useGame();
  const { player } = state;

  return (
    <div className="sticky top-0 z-20 bg-card/98 backdrop-blur border-b-2 border-border px-3 py-2">
      <div className="flex items-center gap-2">
        {/* Level badge */}
        <div className="flex items-center gap-1 bg-primary border-2 border-primary/60 rounded-md px-2 py-0.5 shrink-0 shadow-[0_2px_0_hsl(217_91%_38%)]">
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="font-display font-bold text-sm text-white leading-none">
            {player.level}
          </span>
        </div>

        {/* XP Bar */}
        <div className="flex-1 min-w-0">
          <XPBar current={player.xp} max={player.xpToNextLevel} />
        </div>

        {/* Gold */}
        <div className="flex items-center gap-1 bg-[hsl(var(--game-yellow)/0.12)] border-2 border-[hsl(var(--game-yellow)/0.5)] rounded-md px-2 py-0.5 shrink-0">
          <Coins className="w-3.5 h-3.5 text-[hsl(var(--game-yellow))]" />
          <span className="font-display font-bold text-xs text-[hsl(var(--game-yellow))] leading-none">
            {player.gold}
          </span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-1 bg-secondary/10 border-2 border-secondary/40 rounded-md px-2 py-0.5 shrink-0">
          <Gem className="w-3.5 h-3.5 text-secondary" />
          <span className="font-display font-bold text-xs text-secondary leading-none">
            {player.gems}
          </span>
        </div>

        <ThemeToggle className="w-7 h-7 shrink-0 rounded-md border-2 border-border" />
      </div>
    </div>
  );
}
