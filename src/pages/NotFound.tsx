import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { GameButton } from '@/components/game/GameButton';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <GameShell>
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="text-8xl mb-4 animate-float">🗺️</div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-2">404</h1>
        <p className="font-display text-xl text-muted-foreground mb-2">Lost on the Map</p>
        <p className="text-sm text-muted-foreground mb-8">
          This area hasn't been discovered yet. Venture back to safety!
        </p>
        <GameButton variant="primary" onClick={() => navigate('/map')}>
          Return to Map
        </GameButton>
      </div>
    </GameShell>
  );
}
