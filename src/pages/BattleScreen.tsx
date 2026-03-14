import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { HPBar } from '@/components/game/HPBar';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { BattleArea } from '@/components/game/BattleArea';
import { useGame } from '@/context/GameContext';
import { monsters } from '@/data/monsters';
import { items } from '@/data/items';
// import { createDodgeGame, DAMAGE_PER_HIT } from '@/games'; // Game 1 — disabled
// import { createArrowGame, DAMAGE_PER_MISS } from '@/games'; // Game 2 — disabled
// import { createPairsGame } from '@/games'; // Game 3 — disabled
import { createTicTacToeGame } from '@/games'; // Game 4
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

  const battle = state.activeBattle;
  const monster = battle?.monster ?? monsters.find((m) => m.id === id);

  // Enemy auto-attack after player's turn
  useEffect(() => {
    if (!battle || battle.turn !== 'enemy') return;
    const dmg = Math.max(1, battle.monster.attack - state.player.defense / 2);
    const timer = setTimeout(() => {
      dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount: Math.floor(dmg) } });
    }, ENEMY_ATTACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [battle, dispatch, state.player.defense]);

  // Win / lose detection — battleEndedRef prevents re-firing before navigation completes
  useEffect(() => {
    if (!battle) { battleEndedRef.current = false; return; }
    if (battleEndedRef.current) return;
    if (battle.monster.hp <= 0) {
      battleEndedRef.current = true;
      dispatch({ type: 'GAIN_XP', payload: battle.monster.xpReward });
      dispatch({ type: 'GAIN_GOLD', payload: battle.monster.goldReward });
      dispatch({ type: 'SET_LOOT', payload: [{ item: items.health_potion, quantity: 1 }] });
      dispatch({ type: 'END_BATTLE', payload: { won: true } });
      navigate('/loot');
    } else if (battle.playerHp <= 0) {
      battleEndedRef.current = true;
      dispatch({ type: 'END_BATTLE', payload: { won: false } });
      navigate('/map');
    }
  }, [battle, dispatch, navigate]);

  const isPlayerTurn = battle?.turn === 'player';

  const handleItem = () => {
    if (!battle || !isPlayerTurn) return;
    dispatch({ type: 'HEAL_PLAYER', payload: 50 });
  };

  const handleEscape = () => {
    dispatch({ type: 'END_BATTLE', payload: { won: false } });
    navigate('/map');
  };

  const { t, tMonster } = useT();

  if (!monster) return null;

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
            <div className="w-14 h-14 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-4xl shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)]">
              {monster.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-bold text-lg">{tMonster(monster.id, monster.name)}</h2>
                <span className="text-xs text-muted-foreground bg-muted border-2 border-border px-2 py-0.5 rounded-md shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]">
                  {t('common_levelShort', { level: String(monster.level) })}
                </span>
              </div>
              <HPBar
                current={battle?.monster.hp ?? monster.hp}
                max={monster.maxHp}
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
              <div /><DPadBtn symbol="↑" dir="up"    color="#44ee88" onHit={() => miniGameRef.current?.hitDirection?.('up')}    /><div />
              <DPadBtn symbol="←" dir="left"  color="#44aaff" onHit={() => miniGameRef.current?.hitDirection?.('left')}  />
              <div />
              <DPadBtn symbol="→" dir="right" color="#ff8822" onHit={() => miniGameRef.current?.hitDirection?.('right')} />
              <div /><DPadBtn symbol="↓" dir="down"  color="#ff4466" onHit={() => miniGameRef.current?.hitDirection?.('down')}  /><div />
            </div>
          </div>
        )}

        {/* Battle arena — raised above overlay via z-30 when game is active */}
        <BattleArea
          isEnemyTurn={battle?.turn === 'enemy'}
          className={gameActive ? 'relative z-30' : undefined}
          onMiniGameReady={(app) => {
            miniGameRef.current?.destroy();
            miniGameRef.current = createTicTacToeGame(
              app,
              () => { setGameActive(false); },
              {
                onPlayerHit: (amount = 10) => {
                  dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount } });
                },
                onRoundComplete: () => {
                  // All pairs found → enemy loses 1/3 of max HP
                  const amount = Math.ceil(monster.maxHp / 3);
                  if (amount > 0) {
                    dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount } });
                  }
                },
              },
            );
            setGameActive(true);
          }}
        />

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
            {/* Chat bubble — cloud from the character image */}
            <div className="chat-bubble flex-1 min-h-0 pl-4 pr-3 pt-8 pb-2 flex flex-col relative ml-1">
              <div className="absolute top-1 right-1 game-panel px-1.5 py-0.5 leading-none shrink-0">
                <span className="text-xs font-display font-bold text-muted-foreground">{t('common_chat')}</span>
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
                <p className="text-sm text-muted-foreground font-display text-center max-w-full break-words line-clamp-3">
                  {t('battle_chooseAction')}
                </p>
              </div>
            </div>
            {/* Buttons: fixed at bottom */}
            <div className="game-panel h-12 p-1.5 flex items-stretch gap-2 shrink-0">
              <GameButton variant="danger" size="sm" onClick={handleEscape} className="shadow-lg flex-1 min-w-0 flex items-center justify-center gap-1">
                {t('battle_escape')}
              </GameButton>
              <GameButton
                variant="outline"
                size="sm"
                onClick={handleItem}
                disabled={!isPlayerTurn}
                className="flex-1 min-w-0 flex-col gap-0.5 flex items-center justify-center">
                {t('battle_item')}
              </GameButton>
            </div>
          </div>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
