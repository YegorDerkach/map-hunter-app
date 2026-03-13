import { Coins, Star, CheckCircle2 } from 'lucide-react';
import { Quest } from '@/types/game';
import { cn } from '@/lib/utils';
import { GameButton } from './GameButton';

interface QuestCardProps {
  quest: Quest;
  onClaim?: (questId: string) => void;
}

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const progress = Math.round((quest.current / quest.target) * 100);
  const canClaim = quest.current >= quest.target && !quest.completed;

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-b-4 border-border bg-card p-4 game-shadow-card',
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
          <span>Progress</span>
          <span>
            {quest.current} / {quest.target}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
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
            Claim
          </GameButton>
        )}
      </div>
    </div>
  );
}
