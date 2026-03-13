import { useState } from 'react';
import { Coins, Gem } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { CategoryTabs } from '@/components/game/CategoryTabs';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGame } from '@/context/GameContext';
import { shopItems } from '@/data/shop';
import { ShopCategory } from '@/types/game';
import { toast } from 'sonner';

const SHOP_CATEGORIES: ShopCategory[] = ['potions', 'keys', 'boosters', 'cosmetics'];

export default function ShopScreen() {
  const { state, dispatch } = useGame();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('potions');

  const filtered = shopItems.filter(
    (s) => s.item.category === activeCategory
  );

  const handleBuy = (shopItem: (typeof shopItems)[0]) => {
    const price = shopItem.item.price;
    const gemPrice = shopItem.item.gemPrice;

    if (gemPrice) {
      if (state.player.gems < gemPrice) {
        toast.error('Not enough gems!');
        return;
      }
      dispatch({ type: 'ADD_ITEM', payload: { item: shopItem.item, quantity: 1 } });
      toast.success(`Bought ${shopItem.item.name}!`);
    } else if (price) {
      if (state.player.gold < price) {
        toast.error('Not enough gold!');
        return;
      }
      dispatch({ type: 'SPEND_GOLD', payload: price });
      dispatch({ type: 'ADD_ITEM', payload: { item: shopItem.item, quantity: 1 } });
      toast.success(`Bought ${shopItem.item.name}!`);
    }
  };

  return (
    <GameShell>
      <BackHeader title="Shop" />
      <ScreenTransition>
        {/* Currency display */}
        <div className="flex gap-3 px-4 py-3 border-b-2 border-border">
          <div className="flex items-center gap-1.5 bg-[hsl(var(--game-yellow)/0.12)] border-2 border-[hsl(var(--game-yellow)/0.3)] rounded-md px-3 py-1.5">
            <Coins className="w-4 h-4 text-[hsl(var(--game-yellow))]" />
            <span className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">
              {state.player.gold}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 border-2 border-primary/30 rounded-md px-3 py-1.5">
            <Gem className="w-4 h-4 text-secondary" />
            <span className="font-display font-bold text-sm text-secondary">
              {state.player.gems}
            </span>
          </div>
        </div>

        <div className="px-4 pt-3">
          <CategoryTabs
            categories={SHOP_CATEGORIES}
            active={activeCategory}
            onChange={(c) => setActiveCategory(c as ShopCategory)}
          />
        </div>

        <ScrollArea className="flex-1 px-4 pt-4 pb-4">
          <div className="flex flex-col gap-3">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No items in this category
              </div>
            )}
            {filtered.map((shopItem) => (
              <div
                key={shopItem.item.id}
                className="flex items-center gap-3 bg-card rounded-lg border-2 border-b-4 border-border p-3 game-shadow-card"
              >
                <div className="w-14 h-14 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-3xl shrink-0">
                  {shopItem.item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-display font-bold text-sm text-foreground truncate">
                      {shopItem.item.name}
                    </p>
                    {shopItem.featured && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 shrink-0">Hot</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {shopItem.item.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {shopItem.item.price > 0 ? (
                      <span className="text-xs font-bold text-[hsl(var(--game-yellow))] flex items-center gap-0.5">
                        <Coins className="w-3 h-3" /> {shopItem.item.price}
                      </span>
                    ) : shopItem.item.gemPrice ? (
                      <span className="text-xs font-bold text-secondary flex items-center gap-0.5">
                        <Gem className="w-3 h-3" /> {shopItem.item.gemPrice}
                      </span>
                    ) : null}
                  </div>
                </div>
                <GameButton
                  variant={shopItem.item.gemPrice && !shopItem.item.price ? 'primary' : 'gold'}
                  size="sm"
                  onClick={() => handleBuy(shopItem)}
                  className="shrink-0"
                >
                  Buy
                </GameButton>
              </div>
            ))}
          </div>
        </ScrollArea>
      </ScreenTransition>
    </GameShell>
  );
}
