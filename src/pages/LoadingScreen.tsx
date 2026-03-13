import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const tips = [
  'Rare chests appear in busy places.',
  'Level up to unlock stronger skills.',
  'Walk more to discover hidden monsters.',
  'Check quests daily for bonus rewards!',
];

export default function LoadingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [tipIndex] = useState(Math.floor(Math.random() * tips.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 48);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => navigate('/login'), 200);
      return () => clearTimeout(t);
    }
  }, [progress, navigate]);

  return (
    <div className="min-h-screen game-gradient-sky flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-[320px] flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 animate-bounce-in">
          <div className="w-28 h-28 rounded-2xl game-gradient-hero flex items-center justify-center game-shadow text-6xl animate-pulse-glow border-2 border-white/20">
            🗺️
          </div>
          <h1 className="font-display font-bold text-5xl text-foreground game-text-stroke tracking-wide">
            Map Hunter
          </h1>
          <p className="text-sm text-muted-foreground font-display tracking-widest uppercase">
            Explore • Hunt • Conquer
          </p>
        </div>

        {/* Progress */}
        <div className="w-full flex flex-col gap-2">
          <div className="h-4 w-full rounded-lg border-2 border-border bg-muted overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
            <div
              className="h-full rounded-md game-gradient-hero transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground font-display tracking-wide">
            {progress < 100 ? 'Loading...' : 'Ready!'}
          </p>
        </div>

        {/* Tip */}
        <div className="bg-card/90 backdrop-blur rounded-lg border-2 border-b-4 border-border px-4 py-3 text-center game-shadow-card">
          <p className="text-xs text-muted-foreground mb-1 font-display uppercase tracking-widest">💡 Tip</p>
          <p className="text-sm font-medium text-foreground">{tips[tipIndex]}</p>
        </div>
      </div>
    </div>
  );
}
