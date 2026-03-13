import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * RPG-style button with 3-D bottom-shadow press effect.
 * Active state shifts down by the shadow depth and removes the shadow
 * to simulate a physical key press.
 */
const gameButtonVariants = cva(
  [
    // Base
    'inline-flex items-center justify-center gap-2 select-none',
    'font-display font-bold tracking-wide rounded-lg',
    // Press animation
    'transition-[box-shadow,transform] duration-75',
    'active:translate-y-[5px] active:shadow-none',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:active:translate-y-0 disabled:active:shadow-[inherit]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'game-gradient-hero text-white',
          'border-2 border-white/20',
          'shadow-[var(--shadow-btn-primary)]',
        ].join(' '),
        danger: [
          'bg-[hsl(var(--game-red))] text-white',
          'border-2 border-white/20',
          'shadow-[var(--shadow-btn-danger)]',
        ].join(' '),
        gold: [
          'game-gradient-gold text-white',
          'border-2 border-white/20',
          'shadow-[var(--shadow-btn-gold)]',
        ].join(' '),
        outline: [
          'bg-card text-foreground',
          'border-2 border-border',
          'shadow-[var(--shadow-btn-outline)]',
          'hover:bg-muted',
        ].join(' '),
        ghost: [
          'bg-transparent text-foreground',
          'border-2 border-transparent',
          'hover:bg-muted hover:border-border',
          'shadow-none active:translate-y-0',
        ].join(' '),
      },
      size: {
        sm: 'text-sm px-4 py-1.5',
        md: 'text-base px-6 py-2.5',
        lg: 'text-lg px-8 py-3.5',
        xl: 'text-xl px-10 py-4',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof gameButtonVariants>;

export function GameButton({ variant, size, fullWidth, className, ...props }: GameButtonProps) {
  return (
    <button
      className={cn(gameButtonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
