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
    <GameShell pattern="shop">
      <ScreenTransition>
        <div className="flex flex-col items-center gap-6 p-6 flex-1">
          <div className="text-center">
            <h1 className="font-display font-bold text-3xl text-foreground mb-1">🎉 Loot!</h1>
            <p className="text-sm text-muted-foreground">You got some great items!</p>
          </div>

          <div className="game-panel w-32 h-32 rounded-xl bg-[hsl(var(--game-yellow)/0.15)] border-2 border-b-[4px] border-[hsl(var(--game-yellow))] flex items-center justify-center text-7xl animate-bounce-in">
            📦
          </div>

          <div className="w-full flex flex-col gap-3">
            {/* XP & Gold summary */}
            <div className="flex gap-3">
              <div className="game-panel flex-1 p-3 text-center bg-primary/10 border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">Experience</p>
                <p className="font-display font-bold text-lg text-primary">+120 XP</p>
              </div>
              <div className="game-panel flex-1 p-3 text-center bg-[hsl(var(--game-yellow)/0.12)] border-[hsl(var(--game-yellow)/0.4)]">
                <p className="text-xs text-muted-foreground mb-1">Gold</p>
                <p className="font-display font-bold text-lg text-[hsl(var(--game-yellow))]">+45 🪙</p>
              </div>
            </div>

            {/* Loot items */}
            {loot.map((l, i) => (
              <div
                key={l.item.id}
                className="game-panel flex items-center gap-3 p-3 animate-game-appear"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-3xl shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]">
                  {l.item.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-foreground">{l.item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.item.rarity}</p>
                </div>
                <span className="font-bold text-foreground text-sm">×{l.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 game-strip-bottom">
          <GameButton variant="gold" size="lg" fullWidth onClick={handleTakeAll} className="animate-game-glow">
            ✅ Take All
          </GameButton>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
