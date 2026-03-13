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
    // Juice: hover lift + glow, active press + scale
    'transition-[box-shadow,transform] duration-150 ease-out',
    'hover:scale-[1.02] active:scale-[0.98]',
    'active:translate-y-[5px] active:shadow-none',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:hover:scale-100 disabled:active:translate-y-0 disabled:active:scale-100 disabled:active:shadow-[inherit]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'border-2 border-primary-foreground/25',
          'shadow-[var(--shadow-btn-primary),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)]',
          'hover:shadow-[var(--shadow-btn-primary),inset_0_1px_0_hsl(var(--bar-highlight)/0.9),0_0_16px_hsl(var(--primary)/0.4)]',
        ].join(' '),
        danger: [
          'bg-[hsl(var(--game-red))] text-primary-foreground',
          'border-2 border-primary-foreground/25',
          'shadow-[var(--shadow-btn-danger),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)]',
          'hover:shadow-[var(--shadow-btn-danger),inset_0_1px_0_hsl(var(--bar-highlight)/0.9),0_0_12px_hsl(var(--game-red)/0.4)]',
        ].join(' '),
        gold: [
          'bg-[hsl(var(--game-amber))] text-secondary-foreground',
          'border-2 border-secondary-foreground/25',
          'shadow-[var(--shadow-btn-gold),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)]',
          'hover:shadow-[var(--shadow-btn-gold),inset_0_1px_0_hsl(var(--bar-highlight)/0.9),0_0_12px_hsl(var(--game-amber)/0.4)]',
        ].join(' '),
        outline: [
          'bg-card text-foreground',
          'border-2 border-border',
          'shadow-[var(--shadow-btn-outline),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]',
          'hover:bg-muted hover:shadow-[var(--shadow-btn-outline),inset_0_1px_0_hsl(var(--bar-highlight)/0.5),0_0_8px_hsl(var(--border))]',
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
