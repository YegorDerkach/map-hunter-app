import { cn } from '@/lib/utils';

interface ScreenTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenTransition({ children, className }: ScreenTransitionProps) {
  return (
    <div className={cn('animate-slide-up flex flex-col flex-1', className)}>
      {children}
    </div>
  );
}
