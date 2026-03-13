import { cn } from '@/lib/utils';

export type ScreenPattern =
  | 'paper'
  | 'dots'
  | 'grid'
  | 'map'
  | 'battle'
  | 'shop'
  | 'quest'
  | 'settings'
  | 'default';

interface GameShellProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  /** Texture/pattern overlay for this screen */
  pattern?: ScreenPattern;
  /** Optional: override outer wrapper background (e.g. gradient) */
  outerClassName?: string;
  /** Optional: override inner content area background */
  innerClassName?: string;
}

export function GameShell({
  children,
  className,
  noPadding,
  pattern = 'paper',
  outerClassName,
  innerClassName,
}: GameShellProps) {
  const textureClass =
    pattern !== 'default' ? `screen-texture-${pattern}` : undefined;

  return (
    <div
      className={cn(
        'min-h-screen flex items-start justify-center',
        outerClassName ?? 'bg-muted/30'
      )}
    >
      <div
        className={cn(
          'relative w-full max-w-[430px] sm:max-w-[540px] md:max-w-[768px] min-h-screen overflow-hidden flex flex-col',
          textureClass,
          'shadow-[0_0_40px_hsl(var(--shadow-game))]',
          !noPadding && '',
          innerClassName ?? 'bg-background',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
