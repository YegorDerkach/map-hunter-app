import { cn } from '@/lib/utils';

interface GameShellProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function GameShell({ children, className, noPadding }: GameShellProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center">
      <div
        className={cn(
          'relative w-full max-w-[430px] min-h-screen bg-background overflow-hidden flex flex-col',
          'shadow-[0_0_40px_hsl(var(--shadow-game))]',
          !noPadding && '',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
