import { Heart, Sword, Shield, Zap, Clover, Star } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { HPBar } from '@/components/game/HPBar';
import { XPBar } from '@/components/game/XPBar';
import { StatRow } from '@/components/game/StatRow';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGame } from '@/context/GameContext';

const skills = [
  { emoji: '⚔️', name: 'Power Strike', desc: 'Deal 150% ATK damage', cooldown: '2 turns' },
  { emoji: '🛡️', name: 'Iron Guard', desc: 'Reduce next damage by 50%', cooldown: '3 turns' },
  { emoji: '💨', name: 'Swift Dash', desc: 'Skip enemy turn', cooldown: '4 turns' },
  { emoji: '🔥', name: 'Fire Blast', desc: 'Burns for 3 turns', cooldown: '5 turns' },
];

const equipSlots = [
  { emoji: '⛑️', label: 'Head' },
  { emoji: '🦺', label: 'Chest' },
  { emoji: '👖', label: 'Legs' },
  { emoji: '⚔️', label: 'Weapon' },
  { emoji: '🛡️', label: 'Shield' },
  { emoji: '💍', label: 'Accessory' },
];

export default function CharacterScreen() {
  const { state } = useGame();
  const { player } = state;

  return (
    <GameShell
      pattern="paper"
      outerClassName="bg-gradient-to-b from-primary/25 via-[hsl(var(--game-amber)/0.12)] to-muted/50"
      innerClassName="bg-gradient-to-b from-primary/8 via-card to-background"
    >
      <BackHeader title="Character" />
      <ScreenTransition>
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-2 p-6 pb-4 bg-gradient-to-b from-primary/10 via-transparent to-transparent">
          <div className="w-24 h-24 rounded-full game-gradient-hero flex items-center justify-center text-5xl game-shadow animate-float border-4 border-background">
            {player.avatarEmoji}
          </div>
          <h2 className="font-display font-bold text-xl text-foreground">{player.name}</h2>
          <div className="flex items-center gap-1.5 bg-primary/10 border-2 border-primary/30 rounded-md px-3 py-1">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="font-display font-bold text-sm text-primary">
              Level {player.level}
            </span>
          </div>
          <div className="w-full max-w-[240px]">
            <XPBar current={player.xp} max={player.xpToNextLevel} showLabel />
          </div>
          <HPBar
            current={player.hp}
            max={player.maxHp}
            className="w-full max-w-[240px]"
          />
        </div>

        {/* Tabs */}
        <div className="flex-1 px-4 pb-4">
          <Tabs defaultValue="stats">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
              <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
              <TabsTrigger value="equipment" className="flex-1">Equipment</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <div className="bg-card rounded-lg border-2 border-b-4 border-border px-4 py-1 game-shadow-card">
                <StatRow icon={Heart} label="HP" value={`${player.hp} / ${player.maxHp}`} iconColor="text-[hsl(var(--game-red))]" />
                <StatRow icon={Sword} label="Attack" value={player.attack} iconColor="text-[hsl(var(--game-orange))]" />
                <StatRow icon={Shield} label="Defense" value={player.defense} iconColor="text-primary" />
                <StatRow icon={Zap} label="Agility" value={player.agility} iconColor="text-[hsl(var(--game-green))]" />
                <StatRow icon={Clover} label="Luck" value={player.luck} iconColor="text-[hsl(var(--game-purple))]" />
              </div>
              <div className="mt-3">
                <GameButton variant="primary" size="sm" fullWidth>
                  ⬆️ Upgrade Stats
                </GameButton>
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="bg-card rounded-lg border-2 border-b-4 border-border p-3 game-shadow-card flex flex-col gap-1.5"
                  >
                    <div className="text-3xl">{skill.emoji}</div>
                    <p className="font-display font-bold text-sm text-foreground">
                      {skill.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{skill.desc}</p>
                    <div className="text-[10px] bg-muted border border-border rounded-md px-2 py-0.5 w-fit text-muted-foreground">
                      CD: {skill.cooldown}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="equipment">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {equipSlots.map((slot) => (
                  <div
                    key={slot.label}
                    className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 game-shadow-card hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="text-2xl">{slot.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{slot.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <GameButton variant="outline" size="sm" fullWidth>
                  👝 Open Inventory
                </GameButton>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
