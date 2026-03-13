import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { QuestCard } from '@/components/game/QuestCard';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/context/GameContext';
import { quests } from '@/data/quests';
import type { Quest, QuestType } from '@/types/game';
import { toast } from 'sonner';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuestListProps {
  quests: Quest[];
  type: QuestType;
  onClaim: (questId: string) => void;
}

function QuestList({ quests, type, onClaim }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No {type} quests available
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 pb-4">
      {quests.map((q) => (
        <QuestCard key={q.id} quest={q} onClaim={onClaim} />
      ))}
    </div>
  );
}

const TAB_CLASS =
  'flex-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[var(--shadow-btn-primary),inset_0_1px_0_hsl(var(--bar-highlight)/0.9)] data-[state=inactive]:shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.5)] py-2 font-display font-bold text-sm transition-all duration-150 hover:data-[state=inactive]:border-primary/40';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestScreen() {
  const { dispatch } = useGame();

  const byType = (type: QuestType) => quests.filter((q) => q.type === type);

  const handleClaim = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;
    dispatch({ type: 'GAIN_GOLD', payload: quest.rewardGold });
    dispatch({ type: 'GAIN_XP', payload: quest.rewardXP });
    toast.success(`+${quest.rewardGold} Gold & +${quest.rewardXP} XP!`);
  };

  return (
    <GameShell pattern="quest">
      <BackHeader title="Quests" />
      <ScreenTransition>
        <div className="flex-1 px-4 pt-4 flex flex-col">
          <Tabs defaultValue="daily" className="flex flex-col flex-1">
            <TabsList className="game-strip w-full mb-4 p-1 h-auto gap-1 flex rounded-b-lg">
              <TabsTrigger value="daily" className={TAB_CLASS}>Daily</TabsTrigger>
              <TabsTrigger value="weekly" className={TAB_CLASS}>Weekly</TabsTrigger>
              <TabsTrigger value="story" className={TAB_CLASS}>Story</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <QuestList quests={byType('daily')} type="daily" onClaim={handleClaim} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="weekly" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <QuestList quests={byType('weekly')} type="weekly" onClaim={handleClaim} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="story" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <QuestList quests={byType('story')} type="story" onClaim={handleClaim} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
