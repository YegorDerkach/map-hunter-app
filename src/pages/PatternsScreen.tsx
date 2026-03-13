import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';

export default function PatternsScreen() {
  const navigate = useNavigate();
  return (
    <GameShell pattern="paper">
      <BackHeader title="Patterns" />
      <div className="p-4 flex-1 flex items-center justify-center">
        <GameButton variant="outline" onClick={() => navigate('/map')}>
          ← Back to Map
        </GameButton>
      </div>
    </GameShell>
  );
}
