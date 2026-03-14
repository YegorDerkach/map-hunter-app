import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';
import { useT } from '@/i18n/useT';

export default function PatternsScreen() {
  const navigate = useNavigate();
  const { t } = useT();
  return (
    <GameShell pattern="paper">
      <BackHeader title={t('title_patterns')} />
      <div className="p-4 flex-1 flex items-center justify-center">
        <GameButton variant="outline" onClick={() => navigate('/map')}>
          ← {t('patterns_backToMap')}
        </GameButton>
      </div>
    </GameShell>
  );
}
