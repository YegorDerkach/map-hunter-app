import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';
import { HPBar } from '@/components/game/HPBar';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { mapMarkers, monsters } from '@/data/monsters';
import { items } from '@/data/items';
import type { MarkerType } from '@/types/game';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<MarkerType, string> = {
  monster: 'bg-[hsl(var(--game-red)/0.15)] border-[hsl(var(--game-red)/0.3)] text-[hsl(var(--game-red))]',
  chest:   'bg-[hsl(var(--game-yellow)/0.15)] border-[hsl(var(--game-yellow)/0.3)] text-[hsl(var(--game-yellow))]',
  event:   'bg-[hsl(var(--game-purple)/0.15)] border-[hsl(var(--game-purple)/0.3)] text-[hsl(var(--game-purple))]',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocationInteractionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useGame();

  const marker = mapMarkers.find((m) => m.id === id);
  const monster = marker?.monsterId
    ? monsters.find((m) => m.id === marker.monsterId)
    : null;

  if (!marker) {
    return (
      <GameShell pattern="dots">
        <BackHeader title="Location" />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">Location not found.</p>
        </div>
      </GameShell>
    );
  }

  const handleFight = () => {
    if (!monster) return;
    dispatch({ type: 'START_BATTLE', payload: monster.id });
    navigate(`/battle/${monster.id}`);
  };

  const handleOpenChest = () => {
    dispatch({
      type: 'SET_LOOT',
      payload: [
        { item: items.health_potion, quantity: 2 },
        { item: items.dungeon_key, quantity: 1 },
      ],
    });
    navigate('/loot');
  };

  const isChest = marker.type === 'chest';
  const isEvent = marker.type === 'event';

  return (
    <GameShell pattern="dots">
      <BackHeader title={marker.label} />
      <ScreenTransition>
        <div className="flex flex-col items-center gap-6 p-6 flex-1">
          {/* Type badge */}
          <div
            className={`px-3 py-1 rounded-md border-2 text-xs font-display font-bold uppercase tracking-wide ${TYPE_BADGE_STYLES[marker.type]}`}
          >
            {marker.type}
          </div>

          {/* Illustration */}
          <div className="w-40 h-40 rounded-xl border-2 border-b-[6px] border-border bg-muted flex items-center justify-center text-8xl game-shadow animate-float">
            {monster ? monster.emoji : isChest ? '📦' : '🌟'}
          </div>

          {/* Name & stats */}
          <div className="w-full text-center">
            <h2 className="font-display font-bold text-2xl text-foreground mb-1">
              {monster?.name ?? marker.label}
            </h2>

            {monster && (
              <>
                <div className="inline-flex items-center gap-1.5 bg-muted border-2 border-border rounded-md px-3 py-1 mb-4">
                  <span className="text-xs text-muted-foreground font-display">Level {monster.level}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-red))] font-display font-bold">ATK {monster.attack}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-green))] font-display font-bold">DEF {monster.defense}</span>
                </div>
                <HPBar current={monster.hp} max={monster.maxHp} label="Monster HP" className="mb-4" />
              </>
            )}

            {isChest && (
              <p className="text-sm text-muted-foreground">
                This chest may contain valuable loot. Open it to find out!
              </p>
            )}
            {isEvent && (
              <p className="text-sm text-muted-foreground">
                A special event is happening here. Participate for bonus rewards!
              </p>
            )}
          </div>

          {/* Rewards preview */}
          {monster && (
            <div className="w-full bg-muted/50 border-2 border-border rounded-lg p-3 flex gap-4 justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Reward</p>
                <p className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">+{monster.goldReward} 🪙</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">XP</p>
                <p className="font-display font-bold text-sm text-primary">+{monster.xpReward} ⭐</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex flex-col gap-3 border-t-2 border-border">
          {monster && (
            <GameButton variant="danger" size="lg" fullWidth onClick={handleFight}>
              ⚔️ Fight!
            </GameButton>
          )}
          {isChest && (
            <GameButton variant="gold" size="lg" fullWidth onClick={handleOpenChest}>
              🔓 Open Chest
            </GameButton>
          )}
          {isEvent && (
            <GameButton variant="primary" size="lg" fullWidth>
              🌟 Participate
            </GameButton>
          )}
          <GameButton variant="outline" size="md" fullWidth onClick={() => navigate(-1)}>
            Leave
          </GameButton>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
