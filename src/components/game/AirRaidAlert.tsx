import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GameButton } from './GameButton';

interface Props {
  open: boolean;
  onClose: () => void;
  regionName: string | null;
}

export function AirRaidAlert({ open, onClose, regionName }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] border-2 border-[hsl(var(--game-red))] bg-[hsl(var(--game-red)/0.06)]">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-center text-[hsl(var(--game-red))] font-display text-xl leading-tight">
            🚨 Повітряна тривога!
          </DialogTitle>
          {regionName && (
            <DialogDescription className="text-center font-bold text-foreground">
              {regionName}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-1">
          <p className="text-sm text-center text-foreground leading-relaxed">
            Негайно пройдіть у найближче укриття!
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Слідкуйте за офіційними джерелами інформації.
          </p>
        </div>
        <GameButton variant="danger" size="lg" fullWidth onClick={onClose}>
          Зрозумів
        </GameButton>
      </DialogContent>
    </Dialog>
  );
}
