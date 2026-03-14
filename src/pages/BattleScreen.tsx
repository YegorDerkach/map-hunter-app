import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { HPBar } from '@/components/game/HPBar';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { BattleArea } from '@/components/game/BattleArea';
import { useGame } from '@/context/GameContext';
import { endBattle, killEnemy, getStreet } from '@/api';
import { monsters } from '@/data/monsters';
import { items } from '@/data/items';
import {
  createDodgeGame,
  createArrowGame,
  createPairsGame,
  createTicTacToeGame,
} from '@/games';
import type { MiniGame } from '@/games';
import { useT } from '@/i18n/useT';

const ENEMY_ATTACK_DELAY_MS = 700;

function DPadBtn({ symbol, color, onHit, dir }: { symbol: string; color: string; dir: string; onHit: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      aria-label={dir}
      onPointerDown={(e) => { e.preventDefault(); setPressed(true); onHit(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="w-full h-full rounded-lg flex items-center justify-center text-lg font-bold select-none cursor-pointer border-2 bg-card"
      style={{
        borderColor: color,
        color,
        WebkitTapHighlightColor: 'transparent',
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        boxShadow: pressed ? 'none' : '0 3px 0 rgba(0,0,0,0.4)',
      }}
    >
      {symbol}
    </button>
  );
}

export default function BattleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [phase, setPhase] = useState<'idle' | 'playing'>('idle');
  const [fact, setFact] = useState<string | null>(null);
  const [factLoading, setFactLoading] = useState(false);
  const [factKey, setFactKey] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [dpadRect, setDpadRect] = useState<{ top: number; left: number; size: number } | null>(null);
  const miniGameRef    = useRef<MiniGame | null>(null);
  const playerHpRef    = useRef<HTMLDivElement>(null);
  const dispatchRef    = useRef(dispatch);
  const battleEndedRef = useRef(false);
  dispatchRef.current = dispatch;

  // Destroy game on unmount to prevent ticker running after navigation
  useEffect(() => () => { miniGameRef.current?.destroy(); }, []);

  // D-pad: size from screen, then centered between bottom of player HP bar and bottom of screen
  useEffect(() => {
    if (!gameActive) { setDpadRect(null); return; }
    const hpEl = playerHpRef.current;
    if (!hpEl) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const hpRect = hpEl.getBoundingClientRect();
    const hpBarBottom = hpRect.bottom;
    const screenBottom = h;
    const availableHeight = screenBottom - hpBarBottom;
    // Scale size with screen (smaller dimension), +10%, then cap to fit zone
    const baseSize = Math.max(100, Math.min(200, Math.min(w, h) * 0.22)) * 1.1;
    const size = Math.min(baseSize, availableHeight * 0.9);
    const centerY = (hpBarBottom + screenBottom) / 2;
    setDpadRect({
      size,
      top: centerY - size / 2,
      left: w / 2 - size / 2,
    });
  }, [gameActive]);

  // Start battle on mount only (removing state.activeBattle from deps prevents re-start after END_BATTLE)
  useEffect(() => {
    if (!state.activeBattle && id) {
      dispatch({ type: 'START_BATTLE', payload: id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch a location fact from the server whenever we enter idle phase and coords are available
  useEffect(() => {
    if (phase !== 'idle') return;
    const lat = state.activeBattle?.lat;
    const lng = state.activeBattle?.lng;
    if (!lat || !lng) return;
    let cancelled = false;
    setFactLoading(true);
    getStreet(lat, lng, state.locale)
      .then((text) => { if (!cancelled) setFact(text); })
      .catch(() => { if (!cancelled) setFact(null); })
      .finally(() => { if (!cancelled) setFactLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state.activeBattle?.lat, state.activeBattle?.lng, state.locale]);

  const battle = state.activeBattle;
  const monster = battle?.monster ?? monsters.find((m) => m.id === id);
  // Keep a stable ref so the component doesn't flash null while the route transition is pending
  const monsterRef = useRef<typeof monster | null>(null);
  if (monster) monsterRef.current = monster;
  const resolvedMonster = monsterRef.current;

  // Enemy auto-attack after player's turn (disabled during mini-games — mini-games handle damage via callbacks)
  useEffect(() => {
    if (!battle || battle.turn !== 'enemy' || gameActive) return;
    const dmg = Math.max(1, battle.monster.attack - state.player.defense / 2);
    const timer = setTimeout(() => {
      dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount: Math.floor(dmg) } });
    }, ENEMY_ATTACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [battle, dispatch, state.player.defense, gameActive]);

  // Win / lose detection — battleEndedRef prevents re-firing before navigation completes
  useEffect(() => {
    if (!battle) { battleEndedRef.current = false; return; }
    if (battleEndedRef.current) return;
    if (battle.monster.hp <= 0) {
      battleEndedRef.current = true;
      const serverEnemyId = battle.serverEnemyId;
      if (serverEnemyId) {
        killEnemy(serverEnemyId)
          .catch(() => {})
          .finally(() => {
            endBattle()
              .then((user) => {
                if (user) dispatch({ type: 'SYNC_PLAYER_FROM_SERVER', payload: user });
              })
              .catch(() => {});
          });
      } else {
        dispatch({ type: 'GAIN_XP', payload: battle.monster.xpReward });
        dispatch({ type: 'GAIN_GOLD', payload: battle.monster.goldReward });
        dispatch({ type: 'SET_LOOT', payload: [{ item: items.health_potion, quantity: 1 }] });
      }
      navigate('/loot');
      dispatch({ type: 'END_BATTLE', payload: { won: true } });
    } else if (battle.playerHp <= 0) {
      battleEndedRef.current = true;
      if (battle.serverEnemyId) {
        endBattle()
          .then((user) => {
            if (user) dispatch({ type: 'SYNC_PLAYER_FROM_SERVER', payload: user });
          })
          .catch(() => {});
      }
      navigate('/map');
      dispatch({ type: 'END_BATTLE', payload: { won: false } });
    }
  }, [battle, dispatch, navigate]);

  const isPlayerTurn = battle?.turn === 'player';

  const handleItem = () => {
    if (!battle || !isPlayerTurn) return;
    dispatch({ type: 'HEAL_PLAYER', payload: 50 });
  };

  const handleEscape = () => {
    navigate('/map');
    dispatch({ type: 'END_BATTLE', payload: { won: false } });
  };

  const { t, tMonster } = useT();

  if (!resolvedMonster) return null;

  return (
    <GameShell pattern="battle">
      <ScreenTransition className={`p-0 gap-2 flex flex-col min-h-0 flex-1 relative${gameActive ? ' select-none' : ''}`}>
        {/* Overlay blocks taps/selection; Enemy and Your HP panels have z-30 so they stay visible above overlay */}
        {gameActive && (
          <div
            className="absolute inset-0 z-20 pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.55)', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
          />
        )}
        {/* Game content — stretches to fill rest of screen */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
        {/* Enemy info — above overlay (z-30) so HP is visible during minigame */}
        <div className="game-panel border-l-4 border-l-[hsl(var(--game-red))] bg-gradient-to-r from-[hsl(var(--game-red)/0.08)] to-card p-2 relative z-30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-14 h-14 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-4xl overflow-hidden shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)]">
              {battle?.enemyPhotoUrl ? (
                <img src={battle.enemyPhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                resolvedMonster.emoji
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-bold text-lg">{tMonster(resolvedMonster.id, resolvedMonster.name)}</h2>
                <span className="text-xs text-muted-foreground bg-muted border-2 border-border px-2 py-0.5 rounded-md shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]">
                  {t('common_levelShort', { level: String(resolvedMonster.level) })}
                </span>
              </div>
              <HPBar
                current={battle?.monster.hp ?? resolvedMonster.hp}
                max={resolvedMonster.maxHp}
                label={t('battle_enemyHp')}
              />
            </div>
          </div>
        </div>

        {/* D-pad — only shown for games that support hitDirection (e.g. arrow game) */}
        {dpadRect && miniGameRef.current?.hitDirection && (
          <div
            className="fixed z-30 pointer-events-none"
            style={{ top: dpadRect.top, left: dpadRect.left, width: dpadRect.size, height: dpadRect.size }}
          >
            <div className="grid gap-1 w-full h-full pointer-events-auto" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
              <div style={{ pointerEvents: 'none' }} /><DPadBtn symbol="↑" dir="up"    color="#44ee88" onHit={() => miniGameRef.current?.hitDirection?.('up')}    /><div style={{ pointerEvents: 'none' }} />
              <DPadBtn symbol="←" dir="left"  color="#44aaff" onHit={() => miniGameRef.current?.hitDirection?.('left')}  />
              <div style={{ pointerEvents: 'none' }} />
              <DPadBtn symbol="→" dir="right" color="#ff8822" onHit={() => miniGameRef.current?.hitDirection?.('right')} />
              <div style={{ pointerEvents: 'none' }} /><DPadBtn symbol="↓" dir="down"  color="#ff4466" onHit={() => miniGameRef.current?.hitDirection?.('down')}  /><div style={{ pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Battle arena — mini-game canvas when playing, decorative placeholder when idle */}
        {phase === 'playing' ? (
          <BattleArea
            isEnemyTurn={battle?.turn === 'enemy'}
            className={gameActive ? 'relative z-30' : undefined}
            onMiniGameReady={(app) => {
              miniGameRef.current?.destroy();
              const isBoss = !!battle?.isBoss;
              let used = state.usedNonBossGameIds;
              if (used.length >= 3) {
                dispatchRef.current({ type: 'RESET_NON_BOSS_GAMES' });
                used = [];
              }
              const nonBossIndices = [0, 1, 2];
              const available = nonBossIndices.filter((i) => !used.includes(i));
              const gameIndex = isBoss ? 3 : available[Math.floor(Math.random() * available.length)];
              if (!isBoss) {
                dispatchRef.current({ type: 'RECORD_NON_BOSS_GAME_USED', payload: gameIndex });
              }

              const commonOptions = {
                onPlayerHit: (amount?: number) => {
                  dispatchRef.current({
                    type: 'DEAL_DAMAGE',
                    payload: { target: 'player', amount: amount ?? 34 },
                  });
                },
                onRoundComplete: () => {
                  const amount = Math.ceil(resolvedMonster.maxHp / 3);
                  if (amount > 0) {
                    dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount } });
                  }
                },
              };

              const endGame = () => {
                setGameActive(false);
                setPhase('idle');
                setFactKey((k) => k + 1);
              };

              if (gameIndex === 3) {
                miniGameRef.current = createTicTacToeGame(
                  app,
                  endGame,
                  {
                    ...commonOptions,
                    onDraw: () => {
                      dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount: 15 } });
                      dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount: 15 } });
                    },
                  },
                );
              } else {
                const onEnd = (_result: unknown) => endGame();
                if (gameIndex === 0) {
                  miniGameRef.current = createDodgeGame(app, onEnd, commonOptions);
                } else if (gameIndex === 1) {
                  miniGameRef.current = createArrowGame(app, onEnd, commonOptions);
                } else {
                  miniGameRef.current = createPairsGame(app, onEnd, commonOptions);
                }
              }
              setGameActive(true);
            }}
          />
        ) : (
          <div className="game-panel flex-1 min-h-[140px] sm:min-h-[200px] rounded-xl border-2 border-dashed border-border bg-[var(--gradient-battle)] relative overflow-hidden shrink flex items-center justify-center">
            <span className="text-5xl opacity-20 select-none">⚔️</span>
          </div>
        )}

        {/* Player HP — above overlay (z-30) so it stays visible and updates in real time */}
        <div ref={playerHpRef} className="game-panel p-2 relative z-30">
          <HPBar
            current={battle?.playerHp ?? state.player.hp}
            max={state.player.maxHp}
            label={t('battle_yourHp')}
            variant="player"
          />
        </div>
        </div>

        {/* Bottom row: pressed to bottom; chat panel stretches down to buttons */}
        <div className="flex w-full gap-2 items-stretch mt-auto">
          {/* Helper image: aspect 3:5, small inset so image and border aren't clipped */}
          <div className="w-1/4 min-w-0 flex justify-center items-center self-stretch min-h-0 py-0.5">
            <div className="h-full max-w-full max-h-full aspect-[3/5] flex-shrink-0">
              <img src="/helper.png" alt="" className="w-full h-full object-cover object-center rounded-lg border-2 border-border shadow-[0_2px_0_hsl(var(--border))]" />
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
            {/* Chat bubble — fact text in idle, battle prompt in playing */}
            <div className="chat-bubble flex-1 min-h-0 pl-4 pr-3 pt-8 pb-2 flex flex-col relative ml-1">
              <div className="absolute top-1 right-1 game-panel px-1.5 py-0.5 leading-none shrink-0">
                <span className="text-xs font-display font-bold text-muted-foreground">
                  {phase === 'idle' ? t('battle_factLabel') : t('common_chat')}
                </span>
              </div>
              <div
                key={phase === 'idle' ? factKey : 'chat'}
                className="flex-1 min-w-0 min-h-0 overflow-y-auto animate-slide-up"
              >
                {phase === 'idle' ? (
                  factLoading ? (
                    <p className="text-xs text-muted-foreground font-display text-center animate-pulse py-1">
                      {t('battle_factLoading')}
                    </p>
                  ) : fact ? (
                    <p className="text-xs font-display text-center leading-relaxed w-full py-1">
                      {fact}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-display text-center py-1">
                      {t('battle_readyToFight')}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground font-display text-center w-full break-words py-1">
                    {t('battle_chooseAction')}
                  </p>
                )}
              </div>
            </div>
            {/* Buttons: Play (idle) or Escape+Item (playing) */}
            <div className="game-panel min-h-12 py-2 px-1.5 flex items-stretch gap-2 shrink-0">
              <GameButton variant="danger" size="sm" onClick={handleEscape} className="shadow-lg flex-1 min-w-0 flex items-center justify-center gap-1">
                {t('battle_escape')}
              </GameButton>
              {phase === 'idle' ? (
                <GameButton
                  variant="gold"
                  size="sm"
                  onClick={() => setPhase('playing')}
                  className="flex-1 min-w-0 flex items-center justify-center gap-1"
                >
                  ▶ {t('battle_play')}
                </GameButton>
              ) : (
                <GameButton
                  variant="outline"
                  size="sm"
                  onClick={handleItem}
                  disabled={!isPlayerTurn}
                  className="flex-1 min-w-0 flex-col gap-0.5 flex items-center justify-center"
                >
                  {t('battle_item')}
                </GameButton>
              )}
            </div>
          </div>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
