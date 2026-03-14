import { Coins, Star, CheckCircle2 } from 'lucide-react';
import { Quest } from '@/types/game';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/useT';
import { GameButton } from './GameButton';

interface QuestCardProps {
  quest: Quest;
  onClaim?: (questId: string) => void;
}

const typeAccent: Record<string, { border: string; progress: string; bg: string }> = {
  daily:  { border: 'border-l-[hsl(var(--game-orange))]',  progress: 'hsl(var(--game-orange))',  bg: 'from-[hsl(var(--game-orange)/0.06)]' },
  weekly: { border: 'border-l-[hsl(var(--game-purple))]',  progress: 'hsl(var(--game-purple))',  bg: 'from-[hsl(var(--game-purple)/0.06)]' },
  story:  { border: 'border-l-[hsl(var(--game-cyan))]',    progress: 'hsl(var(--game-cyan))',    bg: 'from-[hsl(var(--game-cyan)/0.06)]' },
};

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const { t } = useT();
  const progress = Math.round((quest.current / quest.target) * 100);
  const canClaim = quest.current >= quest.target && !quest.completed;
  const accent = typeAccent[quest.type] ?? typeAccent.daily;

  return (
    <div
      className={cn(
        'game-panel rounded-lg border-l-4 p-4 bg-gradient-to-r to-card shadow-[var(--shadow-card),var(--game-frame-inner-shadow)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card),var(--game-frame-inner-shadow),0_6px_18px_hsl(0_0%_0%/0.08)] active:scale-[0.99]',
        accent.border,
        accent.bg,
        quest.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {quest.completed && (
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--game-green))] shrink-0" />
            )}
            <h3 className="font-display font-bold text-sm text-foreground truncate">
              {quest.title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{quest.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{t('quests_progress')}</span>
          <span>
            {quest.current} / {quest.target}
          </span>
        </div>
        <div className="h-2 w-full rounded-full border border-border bg-muted overflow-hidden shadow-[inset_0_1px_2px_hsl(200_25%_16%/0.08)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%`, background: accent.progress, boxShadow: 'inset 0 1px 0 hsl(var(--bar-highlight) / 0.8)' }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Coins className="w-3.5 h-3.5 text-[hsl(var(--game-yellow))]" />
            <span className="font-bold text-[hsl(var(--game-yellow))]">
              +{quest.rewardGold}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 text-primary fill-primary/50" />
            <span className="font-bold text-primary">+{quest.rewardXP} XP</span>
          </div>
        </div>
        {canClaim && onClaim && (
          <GameButton
            size="sm"
            variant="gold"
            onClick={() => onClaim(quest.id)}
            className="text-xs px-3 py-1.5"
          >
            {t('quests_claim')}
          </GameButton>
        )}
      </div>
    </div>
  );
}
