import { TutorialStep } from '@/types/game';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: 'Welcome to Map Hunter!',
    body: 'The world is full of monsters, treasures and adventures. Your mission — explore the map and become the greatest hunter!',
    icon: '🗺️',
  },
  {
    id: 1,
    title: 'Explore the Map',
    body: 'Move around in real life to explore the map. The further you walk, the more monsters and chests appear around you!',
    icon: '📍',
  },
  {
    id: 2,
    title: 'Hunt Monsters & Chests',
    body: 'Tap markers on the map to interact with them. Fight monsters to earn XP and gold. Open chests for rare loot!',
    icon: '⚔️',
  },
  {
    id: 3,
    title: 'Level Up & Equip',
    body: 'Defeat enemies to gain XP and level up. Visit your Character screen to equip better gear and become stronger!',
    icon: '🏆',
  },
];
