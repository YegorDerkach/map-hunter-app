import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { HPBar } from '@/components/game/HPBar';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { monsters } from '@/data/monsters';
import { items } from '@/data/items';

export default function BattleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  // Start battle if not active
  useEffect(() => {
    if (!state.activeBattle && id) {
      dispatch({ type: 'START_BATTLE', payload: id });
    }
  }, [id, state.activeBattle, dispatch]);

  const battle = state.activeBattle;
  const monster = battle?.monster ?? monsters.find((m) => m.id === id);

  // Enemy auto-attack
  useEffect(() => {
    if (!battle || battle.turn !== 'enemy') return;
    const t = setTimeout(() => {
      const dmg = Math.max(1, (battle.monster.attack || 10) - (state.player.defense || 0) / 2);
      dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'player', amount: Math.floor(dmg) } });
    }, 700);
    return () => clearTimeout(t);
  }, [battle, dispatch, state.player.defense]);

  // Check win/lose
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

  const handleAttack = () => {
    if (!battle || battle.turn !== 'player') return;
    const dmg = Math.max(1, state.player.attack - (battle.monster.defense || 0) / 2);
    dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount: Math.floor(dmg * (0.85 + Math.random() * 0.3)) } });
  };

  const handleSkill = () => {
    if (!battle || battle.turn !== 'player') return;
    const dmg = Math.floor(state.player.attack * 1.5);
    dispatch({ type: 'DEAL_DAMAGE', payload: { target: 'enemy', amount: dmg } });
  };

  const handleItem = () => {
    if (!battle || battle.turn !== 'player') return;
    dispatch({ type: 'HEAL_PLAYER', payload: 50 });
  };

  if (!monster) return null;

  return (
    <GameShell>
      <ScreenTransition className="p-4 gap-4">
        {/* Enemy info */}
        <div className="bg-card rounded-lg border-2 border-b-4 border-border p-4 game-shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-lg border-2 border-border bg-muted flex items-center justify-center text-4xl game-shadow-card">
              {monster.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-bold text-lg">{monster.name}</h2>
                <span className="text-xs text-muted-foreground bg-muted border-2 border-border px-2 py-0.5 rounded-md">
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

        {/* Battle area */}
        <div className="flex-1 rounded-xl border-2 border-dashed border-border bg-[var(--gradient-battle)] flex flex-col items-center justify-center gap-4 min-h-[220px] py-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: 'var(--gradient-battle)' }}
          />
          <div className="text-7xl animate-float z-10">{monster.emoji}</div>
          {battle?.turn === 'enemy' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--game-red)/0.9)] text-white text-xs font-bold px-3 py-1 rounded-md animate-bounce-in border border-white/20">
              Enemy attacks!
            </div>
          )}
          <p className="text-xs text-muted-foreground font-display tracking-widest z-10">BATTLE AREA</p>
        </div>

        {/* Player HP */}
        <div className="bg-card rounded-lg border-2 border-b-4 border-border p-3">
          <HPBar
            current={battle?.playerHp ?? state.player.hp}
            max={state.player.maxHp}
            label="Your HP"
          />
        </div>

        {/* Battle log */}
        {battle && battle.log.length > 0 && (
          <div className="bg-muted/50 rounded-lg border-2 border-border px-3 py-2 max-h-16 overflow-hidden">
            <p className="text-xs text-muted-foreground text-center">
              {battle.log[battle.log.length - 1]}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <GameButton
            variant="outline"
            size="sm"
            onClick={handleItem}
            disabled={battle?.turn !== 'player'}
            className="flex-col gap-1 h-14"
          >
            <span>🧪</span>
            <span className="text-xs">Item</span>
          </GameButton>
          <GameButton
            variant="primary"
            size="sm"
            onClick={handleSkill}
            disabled={battle?.turn !== 'player'}
            className="flex-col gap-1 h-14"
          >
            <span>✨</span>
            <span className="text-xs">Skill</span>
          </GameButton>
          <GameButton
            variant="danger"
            size="sm"
            onClick={() => {
              dispatch({ type: 'END_BATTLE', payload: { won: false } });
              navigate('/map');
            }}
            className="flex-col gap-1 h-14"
          >
            <span>🏃</span>
            <span className="text-xs">Escape</span>
          </GameButton>
        </div>

        {/* Attack button */}
        <GameButton
          variant="danger"
          size="lg"
          fullWidth
          onClick={handleAttack}
          disabled={battle?.turn !== 'player'}
        >
          ⚔️ {battle?.turn === 'player' ? 'Attack!' : 'Enemy turn...'}
        </GameButton>
      </ScreenTransition>
    </GameShell>
  );
}
