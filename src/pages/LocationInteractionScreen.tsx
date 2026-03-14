import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';
import { HPBar } from '@/components/game/HPBar';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import { generateBattle } from '@/api';
import { useLocationMarker } from '@/hooks/useLocationMarker';
import { items } from '@/data/items';
import type { MarkerType } from '@/types/game';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<MarkerType, string> = {
  monster: 'bg-[hsl(var(--game-red)/0.15)] border-[hsl(var(--game-red)/0.3)] text-[hsl(var(--game-red))]',
  chest:   'bg-[hsl(var(--game-yellow)/0.15)] border-[hsl(var(--game-yellow)/0.3)] text-[hsl(var(--game-yellow))]',
};

const LOCATION_TYPE_KEYS: Record<MarkerType, string> = {
  monster: 'location_type_monster',
  chest: 'location_type_chest',
};

export default function LocationInteractionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const { t, tMonster, tMarkerLabel } = useT();
  const { marker, monster, serverEnemy, loading } = useLocationMarker(id);

  if (loading && !marker) {
    return (
      <GameShell pattern="dots">
        <BackHeader title={t('title_location')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">{t('location_loading')}</p>
        </div>
      </GameShell>
    );
  }

  if (!marker) {
    return (
      <GameShell pattern="dots">
        <BackHeader title={t('title_location')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">{t('location_notFound')}</p>
        </div>
      </GameShell>
    );
  }

  const headerTitle = tMarkerLabel(marker.type, marker.label, marker.monsterId ?? marker.enemyId);

  const handleFight = () => {
    if (serverEnemy) {
      generateBattle()
        .then((user) => {
          if (user) dispatch({ type: 'SYNC_PLAYER_FROM_SERVER', payload: user });
          dispatch({ type: 'START_SERVER_BATTLE', payload: { enemy: serverEnemy } });
          navigate(`/battle/${serverEnemy.id}`);
        })
        .catch(() => {});
      return;
    }
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

  return (
    <GameShell pattern="dots">
      <BackHeader title={headerTitle} />
      <ScreenTransition>
        <div className="flex flex-col items-center gap-6 p-6 flex-1">
          {/* Type badge */}
          <div
            className={`px-3 py-1 rounded-md border-2 text-xs font-display font-bold uppercase tracking-wide ${TYPE_BADGE_STYLES[marker.type]}`}
          >
            {t(LOCATION_TYPE_KEYS[marker.type] as any)}
          </div>

          {/* Illustration */}
          <div className="w-40 h-40 rounded-xl border-2 border-b-[6px] border-border bg-muted flex items-center justify-center text-8xl game-shadow animate-float">
            {monster ? monster.emoji : serverEnemy ? '⚔️' : '📦'}
          </div>

          {/* Name & stats */}
          <div className="w-full text-center">
            <h2 className="font-display font-bold text-2xl text-foreground mb-1">
              {monster ? tMonster(monster.id, monster.name) : serverEnemy ? serverEnemy.name : tMarkerLabel(marker.type, marker.label, undefined)}
            </h2>

            {monster && (
              <>
                <div className="inline-flex items-center gap-1.5 bg-muted border-2 border-border rounded-md px-3 py-1 mb-4">
                  <span className="text-xs text-muted-foreground font-display">{t('location_level', { level: monster.level })}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-red))] font-display font-bold">{t('location_atk')} {monster.attack}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-green))] font-display font-bold">{t('location_def')} {monster.defense}</span>
                </div>
                <HPBar current={monster.hp} max={monster.maxHp} label={t('location_monsterHp')} className="mb-4" />
              </>
            )}

            {serverEnemy && (
              <>
                <div className="inline-flex items-center gap-1.5 bg-muted border-2 border-border rounded-md px-3 py-1 mb-4">
                  {serverEnemy.isBoss && <span className="text-xs font-display font-bold text-[hsl(var(--game-purple))]">Boss</span>}
                  <span className="text-xs text-[hsl(var(--game-red))] font-display font-bold">{t('location_atk')} {serverEnemy.damageToEnemy}</span>
                </div>
                <HPBar current={serverEnemy.hp} max={serverEnemy.hp} label={t('location_monsterHp')} className="mb-4" />
              </>
            )}

            {isChest && (
              <p className="text-sm text-muted-foreground">
                {t('location_chestDesc')}
              </p>
            )}
          </div>

          {/* Rewards preview */}
          {monster && (
            <div className="w-full bg-muted/50 border-2 border-border rounded-lg p-3 flex gap-4 justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('common_reward')}</p>
                <p className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">+{monster.goldReward} 🪙</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('location_xp')}</p>
                <p className="font-display font-bold text-sm text-primary">+{monster.xpReward} ⭐</p>
              </div>
            </div>
          )}
          {serverEnemy && (
            <div className="w-full bg-muted/50 border-2 border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">{t('location_chestDesc')}</p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex flex-col gap-3 border-t-2 border-border">
          {(monster || serverEnemy) && (
            <GameButton variant="danger" size="lg" fullWidth onClick={handleFight}>
              ⚔️ {t('common_fight')}!
            </GameButton>
          )}
          {isChest && (
            <GameButton variant="gold" size="lg" fullWidth onClick={handleOpenChest}>
              🔓 {t('location_openChest')}
            </GameButton>
          )}
          <GameButton variant="outline" size="md" fullWidth onClick={() => navigate(-1)}>
            {t('location_leave')}
          </GameButton>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
