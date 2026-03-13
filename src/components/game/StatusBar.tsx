import { Coins, Gem, Star } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { XPBar } from './XPBar';

export function StatusBar() {
  const { state } = useGame();
  const { player } = state;

  return (
    <div className="sticky top-0 z-20 game-strip px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {/* Level medallion */}
        <div
          className="flex items-center justify-center gap-1 w-10 h-10 shrink-0 rounded-full bg-primary border-2 border-primary/80 shadow-[0_3px_0_hsl(173_58%_28%),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)]"
          title="Level"
        >
          <Star className="w-4 h-4 text-primary-foreground fill-primary-foreground shrink-0" />
          <span className="font-display font-bold text-sm text-primary-foreground leading-none">
            {player.level}
          </span>
        </div>

        {/* XP Bar */}
        <div className="flex-1 min-w-0">
          <XPBar current={player.xp} max={player.xpToNextLevel} />
        </div>

        {/* Gold – resource frame */}
        <div className="game-pill flex items-center gap-1.5 shrink-0 rounded-full bg-[hsl(var(--game-yellow)/0.15)] border-2 border-[hsl(var(--game-yellow)/0.6)] pl-1.5 pr-2 py-1 shadow-[0_2px_0_hsl(38_92%_35%/0.5),inset_0_1px_0_hsl(var(--bar-highlight)/0.85)]">
          <Coins className="w-4 h-4 text-[hsl(var(--game-yellow))]" />
          <span className="font-display font-bold text-xs text-[hsl(var(--game-yellow))] leading-none">
            {player.gold}
          </span>
        </div>

        {/* Gems – resource frame */}
        <div className="game-pill flex items-center gap-1.5 shrink-0 rounded-full bg-secondary/15 border-2 border-secondary/50 pl-1.5 pr-2 py-1 shadow-[0_2px_0_hsl(38_85%_35%/0.4),inset_0_1px_0_hsl(var(--bar-highlight)/0.85)]">
          <Gem className="w-4 h-4 text-secondary" />
          <span className="font-display font-bold text-xs text-secondary leading-none">
            {player.gems}
          </span>
        </div>

      </div>
    </div>
  );
}
