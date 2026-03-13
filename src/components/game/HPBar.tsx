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
  const color =
    percent > 50
      ? 'bg-[hsl(var(--game-green))]'
      : percent > 25
      ? 'bg-[hsl(var(--game-yellow))]'
      : 'bg-[hsl(var(--game-red))]';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground">
            {current} / {max}
          </span>
        </div>
      )}
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
