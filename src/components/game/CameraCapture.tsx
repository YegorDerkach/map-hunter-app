import { useRef } from 'react';
import { GameButton } from './GameButton';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  label?: string;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, label = '📷 Take Photo', disabled = false }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      // Reset so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <GameButton variant="primary" size="lg" fullWidth onClick={handleClick} disabled={disabled}>
        {label}
      </GameButton>
    </>
  );
}
