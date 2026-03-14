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
import { createDodgeGame, DAMAGE_PER_HIT } from '@/games';

import type { MiniGame } from '@/games';

const ENEMY_ATTACK_DELAY_MS = 700;

export default function BattleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [gameActive, setGameActive] = useState(false);
  const miniGameRef = useRef<MiniGame | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Destroy game on unmount to prevent ticker running after navigation
  useEffect(() => () => { miniGameRef.current?.destroy(); }, []);

  // Start battle on mount if not already active
  useEffect(() => {
    if (!state.activeBattle && id) {
      dispatch({ type: 'START_BATTLE', payload: id });
    }
  }, [id, state.activeBattle, dispatch]);

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

  // Win / lose detection
  useEffect(() => {
    if (!battle) return;
    if (battle.monster.hp <= 0) {
      dispatch({ type: 'GAIN_XP', payload: battle.monster.xpReward });
      dispatch({ type: 'GAIN_GOLD', payload: battle.monster.goldReward });
      dispatch({ type: 'SET_LOOT', payload: [{ item: items.health_potion, quantity: 1 }] });
      dispatch({ type: 'END_BATTLE', payload: { won: true } });
      navigate('/loot');
    } else if (battle.playerHp <= 0) {
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
                <h2 className="font-display font-bold text-lg">{monster.name}</h2>
                <span className="text-xs text-muted-foreground bg-muted border-2 border-border px-2 py-0.5 rounded-md shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)]">
                  Lv.{monster.level}
                </span>
              </div>
              <HPBar
                current={battle?.monster.hp ?? monster.hp}
                max={monster.maxHp}
                label="Enemy HP"
              />
            </div>
          </div>
        </div>

        {/* Battle arena — raised above overlay via z-30 when game is active */}
        <BattleArea
          isEnemyTurn={battle?.turn === 'enemy'}
          className={gameActive ? 'relative z-30' : undefined}
          onMiniGameReady={(app) => {
            miniGameRef.current?.destroy();
            miniGameRef.current = createDodgeGame(
              app,
              () => {
                setGameActive(false);
              },
              {
                onPlayerHit: () => {
                  dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount: DAMAGE_PER_HIT } });
                },
                onRoundComplete: () => {
                  // 5 swords = round won → enemy loses 1/3 of max HP
                  const amount = Math.floor(monster.maxHp / 3);
                  if (amount > 0) {
                    dispatchRef.current({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount } });
                  }
                },
              }
            );
            setGameActive(true);
          }}
        />

        {/* Player HP — above overlay (z-30) so it stays visible and updates in real time */}
        <div className="game-panel p-2 relative z-30">
          <HPBar
            current={battle?.playerHp ?? state.player.hp}
            max={state.player.maxHp}
            label="Your HP"
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
                <span className="text-xs font-display font-bold text-muted-foreground">Чат</span>
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
                <p className="text-sm text-muted-foreground font-display text-center max-w-full break-words line-clamp-3">
                  Бій • Обери дію або використай предмет
                </p>
              </div>
            </div>
            {/* Buttons: fixed at bottom */}
            <div className="game-panel h-12 p-1.5 flex items-stretch gap-2 shrink-0">
              <GameButton variant="danger" size="sm" onClick={handleEscape} className="shadow-lg flex-1 min-w-0 flex items-center justify-center gap-1">
                Втекти
              </GameButton>
              <GameButton
                variant="outline"
                size="sm"
                onClick={handleItem}
                disabled={!isPlayerTurn}
                className="flex-1 min-w-0 flex-col gap-0.5 flex items-center justify-center">
                Предмет
              </GameButton>
            </div>
          </div>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
