import { cn } from '@/lib/utils';

interface CategoryTabsProps<T extends string> {
  categories: T[];
  active: T;
  onChange: (cat: T) => void;
  /** Optional translated labels; key is category value */
  labels?: Partial<Record<T, string>>;
  className?: string;
}

export function CategoryTabs<T extends string>({
  categories,
  active,
  onChange,
  labels,
  className,
}: CategoryTabsProps<T>) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1 no-scrollbar', className)}>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'shrink-0 px-4 py-2 rounded-lg text-sm font-display font-bold tracking-wide transition-[transform,box-shadow,border-color,color] duration-150',
            'border-2',
            active === cat
              ? 'bg-primary text-primary-foreground border-primary/80 shadow-[var(--shadow-btn-primary),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)] hover:scale-105 active:translate-y-[2px] active:scale-95 active:shadow-none'
              : 'bg-card text-muted-foreground border-border shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)] hover:border-primary/50 hover:text-foreground hover:scale-[1.02] active:translate-y-[1px] active:shadow-none',
          )}
        >
          {labels?.[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  );
}
