import { Application } from 'pixi.js';
import { cn } from '@/lib/utils';
import { MiniGameCanvas } from './MiniGameCanvas';

export interface BattleAreaProps {
  isEnemyTurn: boolean;
  onMiniGameReady?: (app: Application) => void;
  className?: string;
  backgroundUrl?: string | null;
}

/**
 * Battle arena panel that embeds a PixiJS canvas for mini-games.
 * Pass onMiniGameReady to receive the Application instance and mount game content on app.stage.
 */
export function BattleArea({ isEnemyTurn, onMiniGameReady, className, backgroundUrl }: BattleAreaProps) {
  return (
    <div
      className={cn(
        'game-panel flex-1 min-h-[140px] sm:min-h-[200px] rounded-xl border-2 border-dashed border-border relative overflow-hidden shrink',
        !backgroundUrl && 'bg-[var(--gradient-battle)]',
        className,
      )}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: 'var(--gradient-battle)' }} />
      <MiniGameCanvas onReady={onMiniGameReady} />
      {isEnemyTurn && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--game-red)/0.9)] text-primary-foreground text-xs font-bold px-3 py-1 rounded-md animate-bounce-in border border-primary-foreground/25 z-10">
          Enemy attacks!
        </div>
      )}
    </div>
  );
}
