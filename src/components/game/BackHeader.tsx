import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackHeaderProps {
  title: string;
  className?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function BackHeader({ title, className, onBack, right }: BackHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 sticky top-0 z-20 game-strip',
        className
      )}
    >
      <button
        type="button"
        onClick={onBack ?? (() => navigate(-1))}
        className={cn(
          'w-10 h-10 rounded-lg shrink-0 flex items-center justify-center',
          'bg-card border-2 border-border',
          'shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)]',
          'transition-[box-shadow,transform] duration-150 ease-out',
          'hover:scale-105 hover:border-primary/50 active:translate-y-[2px] active:scale-95 active:shadow-none'
        )}
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>
      <h1 className="font-display font-bold text-lg text-foreground flex-1 tracking-wide">
        {title}
      </h1>
      {right}
    </div>
  );
}
