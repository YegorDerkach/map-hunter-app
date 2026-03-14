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
import { useT } from '@/i18n/useT';
import { shopItems } from '@/data/shop';
import type { ShopCategory, ShopItem } from '@/types/game';
import { toast } from 'sonner';

const SHOP_CATEGORIES: ShopCategory[] = ['potions', 'keys', 'boosters', 'cosmetics'];

const SHOP_CATEGORY_KEYS: Record<ShopCategory, string> = {
  potions: 'shop_category_potions',
  keys: 'shop_category_keys',
  boosters: 'shop_category_boosters',
  cosmetics: 'shop_category_cosmetics',
};

export default function ShopScreen() {
  const { state, dispatch } = useGame();
  const { t, tItemName, tItemDesc } = useT();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('potions');

  const filtered = shopItems.filter((s) => s.item.category === activeCategory);
  const categoryLabels = Object.fromEntries(SHOP_CATEGORIES.map((c) => [c, t(SHOP_CATEGORY_KEYS[c])])) as Record<ShopCategory, string>;

  const handleBuy = (shopItem: ShopItem) => {
    const { price, gemPrice } = shopItem.item;
    const itemName = tItemName(shopItem.item.id, shopItem.item.name);

    if (gemPrice) {
      if (state.player.gems < gemPrice) {
        toast.error(t('shop_notEnoughGems'));
        return;
      }
      dispatch({ type: 'ADD_ITEM', payload: { item: shopItem.item, quantity: 1 } });
      toast.success(t('shop_bought', { name: itemName }));
    } else if (price) {
      if (state.player.gold < price) {
        toast.error(t('shop_notEnoughGold'));
        return;
      }
      dispatch({ type: 'SPEND_GOLD', payload: price });
      dispatch({ type: 'ADD_ITEM', payload: { item: shopItem.item, quantity: 1 } });
      toast.success(t('shop_bought', { name: itemName }));
    }
  };

  return (
    <GameShell pattern="shop">
      <BackHeader title={t('title_shop')} />
      <ScreenTransition>
        {/* Currency HUD */}
        <div className="game-strip mx-4 mt-3 flex gap-3 px-4 py-2.5 rounded-b-lg">
          <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--game-yellow)/0.15)] border-2 border-[hsl(var(--game-yellow)/0.6)] pl-2 pr-3 py-1.5 shadow-[0_2px_0_hsl(38_92%_35%/0.5),inset_0_1px_0_hsl(var(--bar-highlight)/0.85)]">
            <Coins className="w-5 h-5 text-[hsl(var(--game-yellow))]" />
            <span className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">
              {state.player.gold}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary/15 border-2 border-secondary/50 pl-2 pr-3 py-1.5 shadow-[0_2px_0_hsl(38_85%_35%/0.4),inset_0_1px_0_hsl(var(--bar-highlight)/0.85)]">
            <Gem className="w-5 h-5 text-secondary" />
            <span className="font-display font-bold text-sm text-secondary">
              {state.player.gems}
            </span>
          </div>
        </div>

        <div className="px-4 pt-3">
          <CategoryTabs
            categories={SHOP_CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
            labels={categoryLabels}
          />
        </div>

        <ScrollArea className="flex-1 px-4 pt-4 pb-4">
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {t('shop_noItemsInCategory')}
              </div>
            )}
            {filtered.map((shopItem) => (
              <div
                key={shopItem.item.id}
                className="game-panel flex items-center gap-3 p-3 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card),0_6px_20px_hsl(0_0%_0%/0.12)] active:translate-y-0 active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-3xl shrink-0 shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)]">
                  {shopItem.item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-display font-bold text-sm text-foreground truncate">
                      {tItemName(shopItem.item.id, shopItem.item.name)}
                    </p>
                    {shopItem.featured && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 shrink-0">{t('shop_hot')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tItemDesc(shopItem.item.id, shopItem.item.description)}
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
                  {t('shop_buy')}
                </GameButton>
              </div>
            ))}
          </div>
        </ScrollArea>
      </ScreenTransition>
    </GameShell>
  );
}
