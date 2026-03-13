import { cn } from '@/lib/utils';
import { InventoryItem, Rarity } from '@/types/game';

interface ItemCardProps {
  inventoryItem: InventoryItem;
  onClick?: () => void;
  selected?: boolean;
}

const rarityBorder: Record<Rarity, string> = {
  common: 'border-border',
  uncommon: 'border-[hsl(var(--game-green))]',
  rare: 'border-primary',
  epic: 'border-[hsl(var(--game-purple))]',
  legendary: 'border-[hsl(var(--game-yellow))]',
};

const rarityBg: Record<Rarity, string> = {
  common: '',
  uncommon: 'bg-[hsl(var(--game-green)/0.05)]',
  rare: 'bg-primary/5',
  epic: 'bg-[hsl(var(--game-purple)/0.08)]',
  legendary: 'bg-[hsl(var(--game-yellow)/0.08)]',
};

export function ItemCard({ inventoryItem, onClick, selected }: ItemCardProps) {
  const { item, quantity, equipped } = inventoryItem;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'game-panel relative aspect-square p-1.5 flex flex-col items-center justify-center gap-0.5',
        'shadow-[var(--shadow-card),var(--game-frame-inner-shadow)]',
        'transition-[transform,box-shadow] duration-150 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[var(--shadow-card),var(--game-frame-inner-shadow),0_6px_16px_hsl(0_0%_0%/0.1)]',
        'active:scale-[0.98] active:translate-y-0 active:shadow-[var(--shadow-card),var(--game-frame-inner-shadow)]',
        rarityBorder[item.rarity],
        rarityBg[item.rarity],
        selected && 'ring-2 ring-primary ring-offset-2',
        !onClick && 'cursor-default hover:translate-y-0'
      )}
    >
      <span className="text-2xl leading-none">{item.emoji}</span>
      <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center line-clamp-2 w-full">
        {item.name}
      </span>
      {quantity > 1 && (
        <span className="absolute top-0.5 right-1 text-[9px] font-bold text-foreground">
          ×{quantity}
        </span>
      )}
      {equipped && (
        <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-[hsl(var(--game-green))] text-primary-foreground rounded px-0.5 font-bold leading-tight">
          E
        </span>
      )}
    </button>
  );
}
