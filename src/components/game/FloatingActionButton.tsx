import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  badge?: number;
  className?: string;
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  badge,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-12 h-12 rounded-lg bg-card border-2 border-border',
        'flex items-center justify-center',
        'shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)]',
        'transition-[box-shadow,transform] duration-150 ease-out',
        'hover:scale-105 active:scale-95 active:translate-y-[2px] active:shadow-none',
        'group',
        className
      )}
      aria-label={label}
    >
      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-md bg-[hsl(var(--game-red))] border-2 border-card text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none px-1 shadow-[0_2px_0_rgba(0,0,0,0.3)]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
