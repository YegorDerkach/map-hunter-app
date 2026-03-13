import { useState } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { QuestCard } from '@/components/game/QuestCard';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/context/GameContext';
import { quests as defaultQuests } from '@/data/quests';
import { QuestType } from '@/types/game';
import { toast } from 'sonner';

export default function QuestScreen() {
  const { dispatch } = useGame();
  const [questList] = useState(defaultQuests);

  const byType = (type: QuestType) => questList.filter((q) => q.type === type);

  const handleClaim = (questId: string) => {
    const quest = questList.find((q) => q.id === questId);
    if (!quest) return;
    dispatch({ type: 'GAIN_GOLD', payload: quest.rewardGold });
    dispatch({ type: 'GAIN_XP', payload: quest.rewardXP });
    toast.success(`+${quest.rewardGold} Gold & +${quest.rewardXP} XP!`);
  };

  const QuestList = ({ type }: { type: QuestType }) => {
    const list = byType(type);
    return (
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 pb-4">
          {list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No {type} quests available
            </div>
          ) : (
            list.map((q) => (
              <QuestCard key={q.id} quest={q} onClaim={handleClaim} />
            ))
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <GameShell>
      <BackHeader title="Quests" />
      <ScreenTransition>
        <div className="flex-1 px-4 pt-4 flex flex-col">
          <Tabs defaultValue="daily" className="flex flex-col flex-1">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
              <TabsTrigger value="story" className="flex-1">Story</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="flex-1 flex flex-col">
              <QuestList type="daily" />
            </TabsContent>
            <TabsContent value="weekly" className="flex-1 flex flex-col">
              <QuestList type="weekly" />
            </TabsContent>
            <TabsContent value="story" className="flex-1 flex flex-col">
              <QuestList type="story" />
            </TabsContent>
          </Tabs>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
