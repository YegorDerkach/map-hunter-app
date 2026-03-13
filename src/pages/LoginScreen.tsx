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
      {/* Map background decorations */}
      <div className="absolute inset-0 grid grid-cols-5 gap-4 p-4 opacity-20 pointer-events-none select-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-2xl flex items-center justify-center">
            {mapDecorations[i % mapDecorations.length]}
          </span>
        ))}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-4">
        {/* Title */}
        <div className="text-center mb-2">
          <div className="w-24 h-24 mx-auto mb-3 rounded-2xl border-2 border-white/25 bg-white/10 backdrop-blur flex items-center justify-center text-6xl animate-float shadow-[0_4px_0_rgba(0,0,0,0.3)]">
            🗺️
          </div>
          <h1 className="font-display font-bold text-5xl text-white game-text-stroke tracking-wide">
            Map Hunter
          </h1>
          <p className="text-white/60 text-xs font-display tracking-widest uppercase mt-1">
            Explore • Hunt • Conquer
          </p>
        </div>

        {/* Buttons panel */}
        <div className="w-full flex flex-col gap-3 bg-black/30 backdrop-blur border-2 border-b-4 border-white/15 rounded-lg p-5">
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
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 shadow-[0_4px_0_rgba(0,0,0,0.35)]"
            onClick={handleGuest}
          >
            <span className="font-bold text-lg leading-none">G</span> Sign in with Google
          </GameButton>

          <GameButton
            variant="outline"
            size="lg"
            fullWidth
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 shadow-[0_4px_0_rgba(0,0,0,0.35)]"
            onClick={handleGuest}
          >
            🍎 Sign in with Apple
          </GameButton>
        </div>

        <p className="text-white/35 text-xs text-center">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
