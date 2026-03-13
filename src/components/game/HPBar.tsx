import { cn } from '@/lib/utils';

interface HPBarProps {
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function HPBar({ current, max, className, showLabel = true, label = 'HP' }: HPBarProps) {
  const percent = Math.min(100, Math.round((current / max) * 100));
  const fillGradient =
    percent > 50
      ? 'linear-gradient(180deg, hsl(var(--game-green)) 0%, hsl(152 55% 32%) 100%)'
      : percent > 25
      ? 'linear-gradient(180deg, hsl(var(--game-yellow)) 0%, hsl(45 98% 40%) 100%)'
      : 'linear-gradient(180deg, hsl(var(--game-red)) 0%, hsl(0 72% 40%) 100%)';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-display font-bold mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground">
            {current} / {max}
          </span>
        </div>
      )}
      <div className="h-3.5 w-full rounded-full border-2 border-border bg-muted overflow-hidden shadow-[inset_0_2px_4px_hsl(200_25%_16%/0.12)]">
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width: `${percent}%`,
            background: fillGradient,
            boxShadow: 'inset 0 1px 0 hsl(var(--bar-highlight) / 0.9)',
          }}
        />
      </div>
    </div>
  );
}
