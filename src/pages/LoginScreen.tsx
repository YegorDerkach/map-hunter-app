import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { GameButton } from '@/components/game/GameButton';

const mapDecorations = ['🌲', '⛰️', '🏰', '🌊', '🌋', '🏕️', '🌿', '🗻', '🏔️', '🌾'];

export default function LoginScreen() {
  const navigate = useNavigate();
  const { dispatch, state } = useGame();

  const handleGuest = () => {
    dispatch({ type: 'LOGIN', payload: { name: 'Hunter' } });
    navigate(state.tutorialComplete ? '/map' : '/tutorial');
  };

  return (
    <div className="min-h-screen relative overflow-hidden game-gradient-hero flex flex-col items-center justify-end pb-12 px-6">
      <div className="absolute inset-0 screen-texture-dots pointer-events-none opacity-80" />
      {/* Map background decorations */}
      <div className="absolute inset-0 grid grid-cols-5 gap-4 p-4 opacity-20 pointer-events-none select-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-2xl flex items-center justify-center">
            {mapDecorations[i % mapDecorations.length]}
          </span>
        ))}
      </div>

      {/* Overlay – warm gradient instead of black */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(200_40%_12%/0.85)] via-[hsl(173_50%_20%/0.2)] to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-4">
        {/* Title */}
        <div className="text-center mb-2">
          <div className="w-24 h-24 mx-auto mb-3 rounded-2xl border-2 border-[hsl(173_60%_55%/0.5)] bg-[hsl(173_50%_35%/0.25)] backdrop-blur flex items-center justify-center text-6xl animate-float shadow-[0_4px_0_hsl(200_30%_15%/0.5)]">
            🗺️
          </div>
          <h1 className="font-display font-bold text-5xl text-[hsl(40_60%_96%)] game-text-stroke tracking-wide drop-shadow-md">
            Map Hunter
          </h1>
          <p className="text-[hsl(38_70%_80%)] text-xs font-display tracking-widest uppercase mt-1">
            Explore • Hunt • Conquer
          </p>
        </div>

        {/* Buttons panel – tinted glass */}
        <div className="w-full flex flex-col gap-3 bg-[hsl(200_35%_18%/0.6)] backdrop-blur border-[3px] border-[hsl(173_50%_45%/0.4)] rounded-xl p-5 shadow-[0_4px_0_hsl(200_30%_12%/0.5),inset_0_1px_0_hsl(173_50%_70%/0.15)]">
          <GameButton
            variant="gold"
            size="lg"
            fullWidth
            onClick={handleGuest}
          >
            🎮 Play as Guest
          </GameButton>

          <GameButton
            variant="outline"
            size="lg"
            fullWidth
            className="bg-[hsl(173_40%_35%/0.3)] border-[hsl(173_50%_50%/0.5)] text-[hsl(40_50%_95%)] hover:bg-[hsl(173_40%_40%/0.4)] shadow-[0_4px_0_hsl(173_50%_25%/0.4)]"
            onClick={handleGuest}
          >
            <span className="font-bold text-lg leading-none">G</span> Sign in with Google
          </GameButton>

          <GameButton
            variant="outline"
            size="lg"
            fullWidth
            className="bg-[hsl(173_40%_35%/0.3)] border-[hsl(173_50%_50%/0.5)] text-[hsl(40_50%_95%)] hover:bg-[hsl(173_40%_40%/0.4)] shadow-[0_4px_0_hsl(173_50%_25%/0.4)]"
            onClick={handleGuest}
          >
            🍎 Sign in with Apple
          </GameButton>
        </div>

        <p className="text-[hsl(38_40%_70%)] text-xs text-center">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
