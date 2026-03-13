import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { GameButton } from '@/components/game/GameButton';
import { tutorialSteps } from '@/data/tutorial';

export default function TutorialScreen() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const current = tutorialSteps[step];
  const isLast = step === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      dispatch({ type: 'COMPLETE_TUTORIAL' });
      navigate('/map');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen game-gradient-sky flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 screen-texture-paper pointer-events-none" />
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-6">
        {/* Guide character */}
        <div
          key={step}
          className="w-28 h-28 rounded-full game-gradient-hero flex items-center justify-center text-6xl game-shadow animate-bounce-in"
        >
          {current.icon}
        </div>

        {/* Speech bubble */}
        <div className="game-panel relative w-full rounded-3xl p-6">
          {/* Bubble tail */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-[hsl(var(--card))]" />

          <h2 className="font-display font-bold text-xl text-foreground text-center mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {current.body}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-primary'
                  : i < step
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <GameButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
        >
          {isLast ? '🚀 Start Playing!' : 'Next →'}
        </GameButton>

        {!isLast && (
          <button
            className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => {
              dispatch({ type: 'COMPLETE_TUTORIAL' });
              navigate('/map');
            }}
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
