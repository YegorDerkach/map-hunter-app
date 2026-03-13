import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
  className?: string;
}

export function CategoryTabs({ categories, active, onChange, className }: CategoryTabsProps) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1 no-scrollbar', className)}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'shrink-0 px-4 py-1.5 rounded-md text-sm font-display font-bold tracking-wide transition-all',
            'border-2',
            active === cat
              ? 'bg-primary text-primary-foreground border-primary shadow-[0_3px_0_hsl(217_91%_38%)] active:translate-y-[3px] active:shadow-none'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground shadow-[0_2px_0_hsl(var(--border))]'
          )}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  );
}
