import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swords, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { GameButton } from '@/components/game/GameButton';
import { CameraCapture } from '@/components/game/CameraCapture';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { useGame } from '@/context/GameContext';
import { startDungeon } from '@/api/dungeon';
import type { DungeonSession } from '@/types/game';

type Step =
  | 'idle'
  | 'getting-location'
  | 'camera'
  | 'starting'
  | 'error';

export default function DungeonEntranceScreen() {
  const { id: entranceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dispatch } = useGame();

  const [step, setStep] = useState<Step>('idle');
  const [message, setMessage] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleBegin = () => {
    setStep('getting-location');
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStep('camera');
      },
      () => {
        setMessage('Could not get your GPS position. Please enable location and try again.');
        setStep('error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handlePhoto = async (photo: File) => {
    if (!userCoords || !entranceId) return;
    setStep('starting');
    setMessage('');
    try {
      const result = await startDungeon(photo, userCoords.lat, userCoords.lng, entranceId);

      if (result.canStart === false) {
        setMessage(result.message ?? 'Could not start dungeon. Please try again.');
        setStep('error');
        return;
      }

      const session: DungeonSession = {
        backgroundUrl: result.backgroundUrl,
        enemies: result.enemies,
        enemyIds: result.enemies.map((e) => e.id),
        centerLat: result.centerLat,
        centerLng: result.centerLng,
      };
      dispatch({ type: 'DUNGEON_START', payload: session });
      navigate('/map');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to start dungeon.');
      setStep('error');
    }
  };

  return (
    <GameShell
      pattern="dots"
      outerClassName="bg-gradient-to-b from-[hsl(var(--game-red)/0.25)] via-[hsl(var(--game-orange)/0.1)] to-muted/50"
      innerClassName="bg-gradient-to-b from-[hsl(var(--game-red)/0.08)] via-card to-background"
    >
      <BackHeader title="Dungeon Entrance" />
      <ScreenTransition>
        <div className="flex flex-col items-center gap-6 p-6 pt-8">
          {/* Icon */}
          <div className="w-24 h-24 rounded-2xl border-4 border-[hsl(var(--game-red)/0.5)] bg-[hsl(var(--game-red)/0.15)] flex items-center justify-center shadow-[0_4px_0_hsl(var(--game-red)/0.3)] animate-float">
            <Swords className="w-12 h-12 text-[hsl(var(--game-red))]" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-display font-bold text-2xl text-foreground">Arena Entrance</h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Scan this location to activate the dungeon. 5 enemies will appear on a circle around you.
            </p>
          </div>

          {/* Info cards */}
          <div className="w-full max-w-sm grid grid-cols-3 gap-2 text-center">
            {[
              { icon: '⚔️', label: '4 Enemies', sub: 'on circle' },
              { icon: '💀', label: '1 Boss',    sub: 'last stop' },
              { icon: '🎨', label: 'AI Style',  sub: 'live bg' },
            ].map((c) => (
              <div key={c.label} className="bg-card border-2 border-b-4 border-border rounded-xl p-3 game-shadow-card">
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="font-display font-bold text-xs text-foreground">{c.label}</div>
                <div className="text-[10px] text-muted-foreground">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* State machine */}
          {step === 'idle' && (
            <div className="w-full max-w-sm space-y-3">
              <GameButton variant="primary" size="lg" fullWidth onClick={handleBegin}>
                <MapPin className="w-4 h-4 mr-2" /> Enter Dungeon
              </GameButton>
            </div>
          )}

          {step === 'getting-location' && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Getting your GPS position…</p>
            </div>
          )}

          {step === 'camera' && (
            <div className="w-full max-w-sm space-y-3">
              <div className="bg-[hsl(var(--game-amber)/0.15)] border-2 border-[hsl(var(--game-amber)/0.4)] rounded-xl p-4 text-center">
                <p className="text-sm text-foreground font-display">
                  📷 Take a photo of your surroundings. AI will verify your location <strong>and</strong> style it as your battle background.
                </p>
              </div>
              <CameraCapture onCapture={handlePhoto} label="📷 Scan Location" />
            </div>
          )}

          {step === 'starting' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-10 h-10 border-4 border-[hsl(var(--game-red))] border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="font-display font-bold text-foreground">Summoning dungeon…</p>
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  AI is styling your battle background. This may take 15–30 s.
                </p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="w-full max-w-sm space-y-3">
              <div className="bg-[hsl(var(--game-red)/0.1)] border-2 border-[hsl(var(--game-red)/0.4)] rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-[hsl(var(--game-red))] shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{message}</p>
              </div>
              <GameButton variant="outline" size="lg" fullWidth onClick={handleBegin}>
                Try Again
              </GameButton>
            </div>
          )}
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
