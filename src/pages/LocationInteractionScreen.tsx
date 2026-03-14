import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';
import { HPBar } from '@/components/game/HPBar';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { CameraCapture } from '@/components/game/CameraCapture';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import { generateBattle, getEnemyPhotoUrl } from '@/api';
import { verifyLocation } from '@/api/enemy';
import { useLocationMarker } from '@/hooks/useLocationMarker';
import { items } from '@/data/items';
import type { MarkerType } from '@/types/game';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<MarkerType, string> = {
  monster: 'bg-[hsl(var(--game-red)/0.15)] border-[hsl(var(--game-red)/0.3)] text-[hsl(var(--game-red))]',
  chest:   'bg-[hsl(var(--game-yellow)/0.15)] border-[hsl(var(--game-yellow)/0.3)] text-[hsl(var(--game-yellow))]',
};

const LOCATION_TYPE_KEYS: Record<MarkerType, string> = {
  monster: 'location_type_monster',
  chest: 'location_type_chest',
};

type VerifyStep = 'idle' | 'getting-location' | 'camera' | 'verifying' | 'verified' | 'too-far' | 'error';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationInteractionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const { t, tMonster, tMarkerLabel } = useT();
  const { marker, monster, serverEnemy, loading } = useLocationMarker(id);

  const [verifyStep, setVerifyStep] = useState<VerifyStep>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [enemyPhotoUrl, setEnemyPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!serverEnemy?.pathToPhoto) return;
    getEnemyPhotoUrl(serverEnemy.id)
      .then((url) => setEnemyPhotoUrl(url || null))
      .catch(() => setEnemyPhotoUrl(null));
  }, [serverEnemy?.id, serverEnemy?.pathToPhoto]);

  if (loading && !marker) {
    return (
      <GameShell pattern="dots">
        <BackHeader title={t('title_location')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">{t('location_loading')}</p>
        </div>
      </GameShell>
    );
  }

  if (!marker) {
    return (
      <GameShell pattern="dots">
        <BackHeader title={t('title_location')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">{t('location_notFound')}</p>
        </div>
      </GameShell>
    );
  }

  const headerTitle = tMarkerLabel(marker.type, marker.label, marker.monsterId ?? marker.enemyId);

  // ─── Fight flow for local (non-server) monsters ────────────────────────────
  const startLocalFight = () => {
    if (!monster) return;
    dispatch({ type: 'START_BATTLE', payload: monster.id });
    navigate(`/battle/${monster.id}`);
  };

  // ─── Fight flow for server enemies (requires proximity + photo) ─────────────
  const startServerFight = () => {
    if (!serverEnemy) return;
    generateBattle(serverEnemy.id)
      .then(() => {
        dispatch({ type: 'START_SERVER_BATTLE', payload: { enemy: serverEnemy } });
        navigate(`/battle/${serverEnemy.id}`);
      })
      .catch(() => {
        setVerifyStep('error');
        setVerifyMessage('Failed to start battle. Try again.');
      });
  };

  // Step 1: get geolocation
  const handleVerify = () => {
    setVerifyStep('getting-location');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        if (serverEnemy) {
          const dist = haversineMeters(coords.lat, coords.lng, serverEnemy.latitude, serverEnemy.longitude);
          setDistanceMeters(dist);
        }
        setVerifyStep('camera');
      },
      () => {
        setVerifyStep('error');
        setVerifyMessage('Could not get your location. Enable GPS and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Step 2: handle photo capture → call API
  const handlePhotoCapture = async (photo: File) => {
    if (!serverEnemy || !userCoords) return;
    setVerifyStep('verifying');
    try {
      const result = await verifyLocation(serverEnemy.id, photo, userCoords.lat, userCoords.lng);
      if (result.canInteract) {
        setVerifyStep('verified');
        startServerFight();
      } else {
        setVerifyStep('too-far');
        setVerifyMessage(result.message);
      }
    } catch {
      setVerifyStep('error');
      setVerifyMessage('Verification failed. Check your connection and try again.');
    }
  };

  const handleFight = () => {
    if (serverEnemy) {
      handleVerify();
    } else {
      startLocalFight();
    }
  };

  const handleRetry = () => {
    setVerifyStep('idle');
    setVerifyMessage('');
    setDistanceMeters(null);
    setUserCoords(null);
  };

  const handleOpenChest = () => {
    dispatch({
      type: 'SET_LOOT',
      payload: [
        { item: items.health_potion, quantity: 2 },
        { item: items.dungeon_key, quantity: 1 },
      ],
    });
    navigate('/loot');
  };

  const isChest = marker.type === 'chest';

  // ─── Distance badge ─────────────────────────────────────────────────────────
  const distanceBadge = serverEnemy && distanceMeters !== null && (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${
      distanceMeters <= 50
        ? 'bg-[hsl(var(--game-green)/0.15)] border-[hsl(var(--game-green)/0.4)] text-[hsl(var(--game-green))]'
        : 'bg-[hsl(var(--game-red)/0.15)] border-[hsl(var(--game-red)/0.4)] text-[hsl(var(--game-red))]'
    }`}>
      📍 ~{Math.round(distanceMeters)}m away {distanceMeters <= 50 ? '✓' : '(need ≤50m)'}
    </div>
  );

  return (
    <GameShell pattern="dots">
      <BackHeader title={headerTitle} />
      <ScreenTransition>
        <div className="flex flex-col items-center gap-4 p-4 flex-1">
          {/* Type badge */}
          <div className={`px-3 py-1 rounded-md border-2 text-xs font-display font-bold uppercase tracking-wide ${TYPE_BADGE_STYLES[marker.type]}`}>
            {t(LOCATION_TYPE_KEYS[marker.type] as any)}
          </div>

          {/* Distance indicator */}
          {distanceBadge}

          {/* Illustration */}
          <div className="w-36 h-36 rounded-xl border-2 border-b-[6px] border-border bg-muted flex items-center justify-center text-7xl game-shadow animate-float overflow-hidden">
            {enemyPhotoUrl ? (
              <img src={enemyPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : monster ? monster.emoji : serverEnemy ? '⚔️' : '📦'}
          </div>

          {/* Name & stats */}
          <div className="w-full text-center">
            <h2 className="font-display font-bold text-xl text-foreground mb-1">
              {monster ? tMonster(monster.id, monster.name) : serverEnemy ? serverEnemy.name : tMarkerLabel(marker.type, marker.label, undefined)}
            </h2>

            {monster && (
              <>
                <div className="inline-flex items-center gap-1.5 bg-muted border-2 border-border rounded-md px-3 py-1 mb-3">
                  <span className="text-xs text-muted-foreground font-display">{t('location_level', { level: monster.level })}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-red))] font-display font-bold">{t('location_atk')} {monster.attack}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-[hsl(var(--game-green))] font-display font-bold">{t('location_def')} {monster.defense}</span>
                </div>
                <HPBar current={monster.hp} max={monster.maxHp} label={t('location_monsterHp')} className="mb-3" />
              </>
            )}

            {serverEnemy && (
              <>
                <div className="inline-flex items-center gap-1.5 bg-muted border-2 border-border rounded-md px-3 py-1 mb-3">
                  {serverEnemy.isBoss && <span className="text-xs font-display font-bold text-[hsl(var(--game-purple))]">Boss</span>}
                  <span className="text-xs text-[hsl(var(--game-red))] font-display font-bold">{t('location_atk')} {serverEnemy.damageToEnemy}</span>
                </div>
                <HPBar current={serverEnemy.hp} max={serverEnemy.hp} label={t('location_monsterHp')} className="mb-3" />
              </>
            )}

            {isChest && (
              <p className="text-sm text-muted-foreground">{t('location_chestDesc')}</p>
            )}
          </div>

          {/* Rewards preview */}
          {monster && (
            <div className="w-full bg-muted/50 border-2 border-border rounded-lg p-3 flex gap-4 justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('common_reward')}</p>
                <p className="font-display font-bold text-sm text-[hsl(var(--game-yellow))]">+{monster.goldReward} 🪙</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('location_xp')}</p>
                <p className="font-display font-bold text-sm text-primary">+{monster.xpReward} ⭐</p>
              </div>
            </div>
          )}

          {/* Verification status messages */}
          {verifyStep === 'getting-location' && (
            <div className="w-full text-center py-2 px-4 bg-muted/50 border-2 border-border rounded-lg">
              <p className="text-sm text-muted-foreground animate-pulse">📡 Getting your location…</p>
            </div>
          )}
          {verifyStep === 'camera' && (
            <div className="w-full flex items-end gap-3">
              {/* Character */}
              <div className="w-20 shrink-0">
                <img
                  src="/helper.png"
                  alt=""
                  className="w-full aspect-[3/5] object-cover object-center rounded-lg border-2 border-border shadow-[0_2px_0_hsl(var(--border))]"
                />
              </div>
              {/* Speech bubble */}
              <div className="flex-1 chat-bubble px-4 py-3 ml-1 relative">
                <p className="text-sm font-bold text-foreground mb-0.5">📸 Take a photo!</p>
                <p className="text-xs text-muted-foreground">AI will verify you are at this location</p>
              </div>
            </div>
          )}
          {verifyStep === 'verifying' && (
            <div className="w-full text-center py-2 px-4 bg-muted/50 border-2 border-border rounded-lg">
              <p className="text-sm text-muted-foreground animate-pulse">🤖 Verifying location with AI…</p>
            </div>
          )}
          {(verifyStep === 'too-far' || verifyStep === 'error') && verifyMessage && (
            <div className="w-full text-center py-2 px-4 bg-[hsl(var(--game-red)/0.1)] border-2 border-[hsl(var(--game-red)/0.3)] rounded-lg">
              <p className="text-sm text-[hsl(var(--game-red))] font-bold">{verifyMessage}</p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex flex-col gap-3 border-t-2 border-border">
          {/* Camera capture step */}
          {verifyStep === 'camera' && (
            <CameraCapture onCapture={handlePhotoCapture} label="📷 Take Photo to Verify" />
          )}

          {/* Retry after failure */}
          {(verifyStep === 'too-far' || verifyStep === 'error') && (
            <GameButton variant="primary" size="lg" fullWidth onClick={handleRetry}>
              🔄 Try Again
            </GameButton>
          )}

          {/* Main fight / open chest button */}
          {verifyStep === 'idle' && (monster || serverEnemy) && (
            <GameButton
              variant="danger"
              size="lg"
              fullWidth
              onClick={handleFight}
            >
              ⚔️ {t('common_fight')}!
            </GameButton>
          )}
          {verifyStep === 'idle' && isChest && (
            <GameButton variant="gold" size="lg" fullWidth onClick={handleOpenChest}>
              🔓 {t('location_openChest')}
            </GameButton>
          )}
          {verifyStep === 'getting-location' && (
            <GameButton variant="danger" size="lg" fullWidth disabled>
              ⚔️ {t('common_fight')}!
            </GameButton>
          )}
          {verifyStep === 'verifying' && (
            <GameButton variant="danger" size="lg" fullWidth disabled>
              🤖 Verifying…
            </GameButton>
          )}

          <GameButton variant="outline" size="md" fullWidth onClick={() => navigate(-1)}>
            {t('location_leave')}
          </GameButton>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
