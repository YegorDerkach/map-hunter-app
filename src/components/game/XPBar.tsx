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
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
