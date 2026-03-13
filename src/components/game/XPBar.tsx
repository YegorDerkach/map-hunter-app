import { cn } from '@/lib/utils';

interface XPBarProps {
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function XPBar({ current, max, className, showLabel }: XPBarProps) {
  const percent = Math.min(100, Math.round((current / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>XP</span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full border-2 border-border bg-muted overflow-hidden shadow-[inset_0_2px_4px_hsl(200_25%_16%/0.1)]">
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(180deg, hsl(var(--game-cyan) / 0.9) 0%, hsl(var(--primary)) 50%, hsl(var(--game-indigo)) 100%)',
            boxShadow: 'inset 0 1px 0 hsl(var(--bar-highlight) / 0.85)',
          }}
        />
      </div>
    </div>
  );
}
