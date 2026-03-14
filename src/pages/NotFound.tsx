import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { GameButton } from '@/components/game/GameButton';
import { useT } from '@/i18n/useT';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <GameShell pattern="dots">
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="text-8xl mb-4 animate-float">🗺️</div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-2">404</h1>
        <p className="font-display text-xl text-muted-foreground mb-2">{t('notFound_lost')}</p>
        <p className="text-sm text-muted-foreground mb-8">
          {t('notFound_area')}
        </p>
        <GameButton variant="primary" onClick={() => navigate('/map')}>
          {t('notFound_return')}
        </GameButton>
      </div>
    </GameShell>
  );
}
