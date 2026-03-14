import { useState } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { ItemCard } from '@/components/game/ItemCard';
import { CategoryTabs } from '@/components/game/CategoryTabs';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import type { ItemCategory, InventoryItem } from '@/types/game';

const INVENTORY_TAB_CATEGORIES = ['weapons', 'armor', 'consumables', 'materials', 'keys'] as const;
type InventoryTabCategory = (typeof INVENTORY_TAB_CATEGORIES)[number];
const CATEGORIES: ItemCategory[] = [...INVENTORY_TAB_CATEGORIES];
const MIN_GRID_CELLS = 10;

const CATEGORY_KEYS: Record<InventoryTabCategory, string> = {
  weapons: 'inventory_category_weapons',
  armor: 'inventory_category_armor',
  consumables: 'inventory_category_consumables',
  materials: 'inventory_category_materials',
  keys: 'inventory_category_keys',
};

export default function InventoryScreen() {
  const { state } = useGame();
  const { t, tItemName, tItemDesc } = useT();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('weapons');
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const filtered = state.inventory.filter((inv) => inv.item.category === activeCategory);
  const emptySlots = Math.max(0, MIN_GRID_CELLS - filtered.length);
  const totalItems = state.inventory.reduce((sum, inv) => sum + inv.quantity, 0);

  const categoryLabels = Object.fromEntries(INVENTORY_TAB_CATEGORIES.map((c) => [c, t(CATEGORY_KEYS[c])])) as Partial<Record<ItemCategory, string>>;

  return (
    <GameShell pattern="grid">
      <BackHeader
        title={t('title_inventory')}
        right={
          <span className="text-xs font-display font-bold text-muted-foreground rounded-full border-2 border-border bg-muted px-3 py-1.5 shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]">
            {t('inventory_itemsCount', { count: totalItems })}
          </span>
        }
      />
      <ScreenTransition>
        <div className="px-4 pt-4">
          <CategoryTabs
            categories={CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
            labels={categoryLabels}
          />
        </div>

        <ScrollArea className="flex-1 px-4 pt-4 pb-4">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filtered.map((inv) => (
              <ItemCard
                key={inv.item.id}
                inventoryItem={inv}
                selected={selected?.item.id === inv.item.id}
                onClick={() => setSelected(inv)}
              />
            ))}
            {Array.from({ length: emptySlots }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-xl border-2 border-dashed border-border/50 bg-muted/20"
              />
            ))}
          </div>
        </ScrollArea>
      </ScreenTransition>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                    {selected.item.emoji}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg">{tItemName(selected.item.id, selected.item.name)}</DialogTitle>
                    <p className="text-xs text-muted-foreground capitalize">{t(`rarity_${selected.item.rarity}` as any)}</p>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{tItemDesc(selected.item.id, selected.item.description)}</p>
              <p className="text-xs text-muted-foreground">
                {t('inventory_quantity')}: <strong className="text-foreground">{selected.quantity}</strong>
              </p>
              <div className="flex gap-2 mt-2">
                {selected.item.category === 'consumables' && (
                  <GameButton variant="primary" size="sm" fullWidth>{t('common_use')}</GameButton>
                )}
                {(selected.item.category === 'weapons' || selected.item.category === 'armor') && (
                  <GameButton variant="primary" size="sm" fullWidth>
                    {selected.equipped ? t('common_unequip') : t('common_equip')}
                  </GameButton>
                )}
                <GameButton variant="outline" size="sm" fullWidth>{t('common_drop')}</GameButton>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </GameShell>
  );
}
