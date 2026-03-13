import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { items } from '@/data/items';

const fallbackLoot = [
  { item: items.health_potion, quantity: 2 },
  { item: items.wolf_fang, quantity: 3 },
];

export default function LootScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const loot = state.lastLoot.length > 0 ? state.lastLoot : fallbackLoot;

  const handleTakeAll = () => {
    loot.forEach((l) => dispatch({ type: 'ADD_ITEM', payload: l }));
    navigate('/map');
  };

  return (
    <GameShell>
      <ScreenTransition>
        <div className="flex flex-col items-center gap-6 p-6 flex-1">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display font-bold text-3xl text-foreground mb-1">
              🎉 Loot!
            </h1>
            <p className="text-sm text-muted-foreground">You got some great items!</p>
          </div>

          {/* Chest animation */}
          <div className="w-32 h-32 rounded-xl bg-[hsl(var(--game-yellow)/0.15)] border-2 border-b-[6px] border-[hsl(var(--game-yellow))] flex items-center justify-center text-7xl game-shadow animate-bounce-in">
            📦
          </div>

          {/* Rewards */}
          <div className="w-full flex flex-col gap-3">
            {/* XP & Gold */}
            <div className="flex gap-3">
              <div className="flex-1 bg-primary/10 border-2 border-primary/25 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Experience</p>
                <p className="font-display font-bold text-lg text-primary">+120 XP</p>
              </div>
              <div className="flex-1 bg-[hsl(var(--game-yellow)/0.12)] border-2 border-[hsl(var(--game-yellow)/0.3)] rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Gold</p>
                <p className="font-display font-bold text-lg text-[hsl(var(--game-yellow))]">+45 🪙</p>
              </div>
            </div>

            {/* Items */}
            {loot.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-card rounded-lg border-2 border-b-4 border-border p-3 game-shadow-card animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-3xl">
                  {l.item.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-foreground">
                    {l.item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{l.item.rarity}</p>
                </div>
                <span className="font-bold text-foreground text-sm">×{l.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="p-4 border-t-2 border-border">
          <GameButton variant="gold" size="lg" fullWidth onClick={handleTakeAll}>
            ✅ Take All
          </GameButton>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
