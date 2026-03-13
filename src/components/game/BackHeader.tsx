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
        'flex items-center gap-3 px-4 py-3 sticky top-0 z-20',
        'bg-card/95 backdrop-blur border-b-2 border-border',
        className
      )}
    >
      <button
        onClick={onBack ?? (() => navigate(-1))}
        className={cn(
          'w-9 h-9 rounded-lg shrink-0',
          'bg-muted border-2 border-border border-b-[3px]',
          'flex items-center justify-center',
          'shadow-[0_3px_0_hsl(var(--border))]',
          'transition-[box-shadow,transform] duration-75',
          'active:translate-y-[3px] active:shadow-none',
          'hover:border-primary/40'
        )}
      >
        <ArrowLeft className="w-4 h-4 text-foreground" />
      </button>
      <h1 className="font-display font-bold text-lg text-foreground flex-1 tracking-wide">
        {title}
      </h1>
      {right}
    </div>
  );
}
