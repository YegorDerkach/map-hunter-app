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
import { ItemCategory, InventoryItem } from '@/types/game';

const CATEGORIES: ItemCategory[] = ['weapons', 'armor', 'consumables', 'materials', 'keys'];

export default function InventoryScreen() {
  const { state } = useGame();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('weapons');
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const filtered = state.inventory.filter(
    (inv) => inv.item.category === activeCategory
  );

  // Fill grid to at least 10 cells
  const gridItems = [...filtered, ...Array(Math.max(0, 10 - filtered.length)).fill(null)];

  return (
    <GameShell>
      <BackHeader
        title="Inventory"
        right={
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
            {state.inventory.reduce((a, b) => a + b.quantity, 0)} items
          </span>
        }
      />
      <ScreenTransition>
        <div className="px-4 pt-4">
          <CategoryTabs
            categories={CATEGORIES}
            active={activeCategory}
            onChange={(c) => setActiveCategory(c as ItemCategory)}
          />
        </div>

        <ScrollArea className="flex-1 px-4 pt-4 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {gridItems.map((inv, i) =>
              inv ? (
                <ItemCard
                  key={`${inv.item.id}-${i}`}
                  inventoryItem={inv}
                  selected={selected?.item.id === inv.item.id}
                  onClick={() => setSelected(inv)}
                />
              ) : (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl border-2 border-dashed border-border/50 bg-muted/20"
                />
              )
            )}
          </div>
        </ScrollArea>
      </ScreenTransition>

      {/* Item detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                    {selected.item.emoji}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg">{selected.item.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground capitalize">{selected.item.rarity}</p>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.item.description}</p>
              <div className="text-xs text-muted-foreground">
                Quantity: <strong className="text-foreground">{selected.quantity}</strong>
              </div>
              <div className="flex gap-2 mt-2">
                {selected.item.category === 'consumables' && (
                  <GameButton variant="primary" size="sm" fullWidth>
                    Use
                  </GameButton>
                )}
                {(selected.item.category === 'weapons' || selected.item.category === 'armor') && (
                  <GameButton variant="primary" size="sm" fullWidth>
                    {selected.equipped ? 'Unequip' : 'Equip'}
                  </GameButton>
                )}
                <GameButton variant="outline" size="sm" fullWidth>
                  Drop
                </GameButton>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </GameShell>
  );
}
