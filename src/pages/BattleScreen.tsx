import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { HPBar } from '@/components/game/HPBar';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { monsters } from '@/data/monsters';
import { items } from '@/data/items';

const ENEMY_ATTACK_DELAY_MS = 700;

export default function BattleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

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

  const handleAttack = () => {
    if (!battle || !isPlayerTurn) return;
    const baseDmg = Math.max(1, state.player.attack - battle.monster.defense / 2);
    const dmg = Math.floor(baseDmg * (0.85 + Math.random() * 0.3));
    dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount: dmg } });
  };

  const handleSkill = () => {
    if (!battle || !isPlayerTurn) return;
    const dmg = Math.floor(state.player.attack * 1.5);
    dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount: dmg } });
  };

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
      <ScreenTransition className="p-4 gap-4">
        {/* Enemy info */}
        <div className="game-panel border-l-4 border-l-[hsl(var(--game-red))] bg-gradient-to-r from-[hsl(var(--game-red)/0.08)] to-card p-4">
          <div className="flex items-center gap-3 mb-3">
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

        {/* Battle arena */}
        <div className="game-panel flex-1 rounded-xl border-2 border-dashed border-border bg-[var(--gradient-battle)] flex flex-col items-center justify-center gap-4 min-h-[220px] py-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: 'var(--gradient-battle)' }}
          />
          <div className="text-7xl animate-float z-10">{monster.emoji}</div>
          {battle?.turn === 'enemy' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--game-red)/0.9)] text-primary-foreground text-xs font-bold px-3 py-1 rounded-md animate-bounce-in border border-primary-foreground/25">
              Enemy attacks!
            </div>
          )}
          <p className="text-xs text-muted-foreground font-display tracking-widest z-10">BATTLE AREA</p>
        </div>

        {/* Player HP */}
        <div className="game-panel p-3">
          <HPBar
            current={battle?.playerHp ?? state.player.hp}
            max={state.player.maxHp}
            label="Your HP"
          />
        </div>

        {/* Last battle log entry */}
        {battle && battle.log.length > 0 && (
          <div className="game-panel bg-muted/30 px-3 py-2 max-h-16 overflow-hidden">
            <p className="text-xs text-muted-foreground text-center">
              {battle.log[battle.log.length - 1]}
            </p>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-2">
          <GameButton
            variant="outline"
            size="sm"
            onClick={handleItem}
            disabled={!isPlayerTurn}
            className="flex-col gap-1 h-14"
          >
            <span>🧪</span>
            <span className="text-xs">Item</span>
          </GameButton>
          <GameButton
            variant="primary"
            size="sm"
            onClick={handleSkill}
            disabled={!isPlayerTurn}
            className={`flex-col gap-1 h-14 ${isPlayerTurn ? 'animate-game-glow' : ''}`}
          >
            <span>✨</span>
            <span className="text-xs">Skill</span>
          </GameButton>
          <GameButton
            variant="danger"
            size="sm"
            onClick={handleEscape}
            className="flex-col gap-1 h-14"
          >
            <span>🏃</span>
            <span className="text-xs">Escape</span>
          </GameButton>
        </div>

        {/* Primary attack */}
        <GameButton
          variant="danger"
          size="lg"
          fullWidth
          onClick={handleAttack}
          disabled={!isPlayerTurn}
        >
          ⚔️ {isPlayerTurn ? 'Attack!' : 'Enemy turn...'}
        </GameButton>
      </ScreenTransition>
    </GameShell>
  );
}
