import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatRowProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  className?: string;
}

export function StatRow({ icon: Icon, label, value, iconColor = 'text-primary', className }: StatRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2.5 border-b border-border last:border-0', className)}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted border-2 border-border flex items-center justify-center shrink-0">
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="font-display font-bold text-foreground">{value}</span>
    </div>
  );
}
