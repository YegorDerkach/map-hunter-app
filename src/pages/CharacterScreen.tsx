import { useRef, useState } from 'react';
import { Camera, Heart, Sword, Shield, Zap, Clover, Star, Coins, Gem, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { HPBar } from '@/components/game/HPBar';
import { XPBar } from '@/components/game/XPBar';
import { StatRow } from '@/components/game/StatRow';
import { GameButton } from '@/components/game/GameButton';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import { generateProfilePhoto } from '@/api';
import type { AvatarStyle } from '@/api';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

const AVATAR_STYLES: { id: AvatarStyle; emoji: string; label: string; desc: string }[] = [
  { id: 'anime',     emoji: '🎌', label: 'Anime',     desc: 'Яскравий аніме-арт' },
  { id: 'pixi',      emoji: '🕹️', label: 'Pixel',     desc: 'Ретро піксель-арт' },
  { id: 'realistic', emoji: '📷', label: 'Realistic', desc: 'Гіперреалістичний портрет' },
];

const skillKeys = [
  { emoji: '⚔️', nameKey: 'skill_powerStrike' as const, descKey: 'skill_powerStrikeDesc' as const, cooldown: '2 turns' },
  { emoji: '🛡️', nameKey: 'skill_ironGuard' as const, descKey: 'skill_ironGuardDesc' as const, cooldown: '3 turns' },
  { emoji: '💨', nameKey: 'skill_swiftDash' as const, descKey: 'skill_swiftDashDesc' as const, cooldown: '4 turns' },
  { emoji: '🔥', nameKey: 'skill_fireBlast' as const, descKey: 'skill_fireBlastDesc' as const, cooldown: '5 turns' },
];

const equipSlotKeys = [
  { emoji: '⛑️', labelKey: 'slot_head' as const },
  { emoji: '🦺', labelKey: 'slot_chest' as const },
  { emoji: '👖', labelKey: 'slot_legs' as const },
  { emoji: '⚔️', labelKey: 'slot_weapon' as const },
  { emoji: '🛡️', labelKey: 'slot_shield' as const },
  { emoji: '💍', labelKey: 'slot_accessory' as const },
];

export default function CharacterScreen() {
  const { state } = useGame();
  const { player } = state;
  const { t } = useT();
  const { avatarUrl: profilePhotoUrl, setAvatarUrl: setProfilePhotoUrl } = useAvatarUrl(
    state.authUser?.id,
    state.token ?? null,
  );
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<AvatarStyle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => setStyleDialogOpen(true);

  const handleStyleSelect = (style: AvatarStyle) => {
    setPendingStyle(style);
    setStyleDialogOpen(false);
    // Small delay so dialog fully closes before native file picker opens
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    if (!state.token) return;
    const style = pendingStyle ?? 'anime';
    setAvatarLoading(true);
    generateProfilePhoto(file, style)
      .then((url: string) => setProfilePhotoUrl(url || null))
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to generate photo'))
      .finally(() => { setAvatarLoading(false); setPendingStyle(null); });
    e.target.value = '';
  };

  return (
    <GameShell
      pattern="paper"
      outerClassName="bg-gradient-to-b from-primary/25 via-[hsl(var(--game-amber)/0.12)] to-muted/50"
      innerClassName="bg-gradient-to-b from-primary/8 via-card to-background"
    >
      <BackHeader title={t('title_character')} />
      {/* Style picker dialog */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-lg">
              🎨 Оберіть стиль аватара
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              AI перетворить твоє фото у вибраному стилі
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStyleSelect(s.id)}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-4 shadow-[0_3px_0_hsl(var(--border))] transition-all hover:border-primary hover:bg-primary/10 active:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-4xl">{s.emoji}</span>
                <span className="font-display font-bold text-sm text-foreground">{s.label}</span>
                <span className="text-[11px] text-muted-foreground text-center leading-tight">{s.desc}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ScreenTransition>
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-2 p-6 pb-4 bg-gradient-to-b from-primary/10 via-transparent to-transparent">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label={t('character_selectPhoto')}
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarLoading}
            className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
            aria-label={t('character_changeAvatar')}
          >
            <Avatar className="w-24 h-24 rounded-full game-shadow animate-float border-4 border-background overflow-hidden bg-primary/20">
              <AvatarImage src={profilePhotoUrl ?? undefined} alt="" className="object-cover w-full h-full" />
              <AvatarFallback className="game-gradient-hero text-5xl text-foreground">
                {player.avatarEmoji}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </span>
          </button>
          <p className="text-xs text-muted-foreground">{t('character_clickToChangeAvatar')}</p>
          <h2 className="font-display font-bold text-xl text-foreground">{player.name}</h2>
          {state.authUser?.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{state.authUser.email}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-primary/10 border-2 border-primary/30 rounded-md px-3 py-1">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="font-display font-bold text-sm text-primary">
              {t('character_level', { level: String(player.level) })}
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
          <div className="flex items-center gap-4 w-full max-w-[240px] justify-center">
            <div className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--game-yellow)/0.15)] border-2 border-[hsl(var(--game-yellow)/0.5)] px-3 py-1.5">
              <Coins className="w-4 h-4 text-[hsl(var(--game-yellow))]" />
              <span className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">{player.gold}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/15 border-2 border-secondary/50 px-3 py-1.5">
              <Gem className="w-4 h-4 text-secondary" />
              <span className="font-display font-bold text-sm text-secondary">{player.gems}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 px-4 pb-4">
          <Tabs defaultValue="stats">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="stats" className="flex-1">{t('character_stats')}</TabsTrigger>
              <TabsTrigger value="skills" className="flex-1">{t('character_skills')}</TabsTrigger>
              <TabsTrigger value="equipment" className="flex-1">{t('character_equipment')}</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <div className="bg-card rounded-lg border-2 border-b-4 border-border px-4 py-1 game-shadow-card">
                <StatRow icon={Heart} label={t('character_hp')} value={`${player.hp} / ${player.maxHp}`} iconColor="text-[hsl(var(--game-red))]" />
                <StatRow icon={Sword} label={t('character_attack')} value={player.attack} iconColor="text-[hsl(var(--game-orange))]" />
                <StatRow icon={Shield} label={t('character_defense')} value={player.defense} iconColor="text-primary" />
                <StatRow icon={Zap} label={t('character_agility')} value={player.agility} iconColor="text-[hsl(var(--game-green))]" />
                <StatRow icon={Clover} label={t('character_luck')} value={player.luck} iconColor="text-[hsl(var(--game-purple))]" />
              </div>
              <div className="mt-3">
                <GameButton variant="primary" size="sm" fullWidth>
                  ⬆️ {t('character_upgradeStats')}
                </GameButton>
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skillKeys.map((skill) => (
                  <div
                    key={skill.nameKey}
                    className="bg-card rounded-lg border-2 border-b-4 border-border p-3 game-shadow-card flex flex-col gap-1.5"
                  >
                    <div className="text-3xl">{skill.emoji}</div>
                    <p className="font-display font-bold text-sm text-foreground">
                      {t(skill.nameKey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(skill.descKey)}</p>
                    <div className="text-[10px] bg-muted border border-border rounded-md px-2 py-0.5 w-fit text-muted-foreground">
                      {t('skill_cooldown')}: {skill.cooldown}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="equipment">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {equipSlotKeys.map((slot) => (
                  <div
                    key={slot.labelKey}
                    className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 game-shadow-card hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="text-2xl">{slot.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{t(slot.labelKey)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <GameButton variant="outline" size="sm" fullWidth>
                  👝 {t('character_openInventory')}
                </GameButton>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
