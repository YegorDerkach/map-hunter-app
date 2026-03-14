import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { cn } from '@/lib/utils';

export interface MiniGameCanvasProps {
  /** Called once when the Pixi Application is ready; use it to add mini-game content to app.stage */
  onReady?: (app: Application) => void;
  className?: string;
}

/**
 * PixiJS canvas container for the battle area. Renders a canvas that fills the container
 * and calls onReady with the Application instance so mini-games can be mounted on app.stage.
 */
export function MiniGameCanvas({ onReady, className }: MiniGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    let initialized = false;
    const app = new Application();
    appRef.current = app;

    app
      .init({
        resizeTo: el,
        backgroundAlpha: 0,
        width: 1,
        height: 1,
      })
      .then(() => {
        initialized = true;
        if (!mounted) {
          app.destroy(true);
          return;
        }
        el.appendChild(app.canvas);
        onReadyRef.current?.(app);
      })
      .catch((err) => {
        console.error('MiniGameCanvas: Pixi init failed', err);
      });

    return () => {
      mounted = false;
      appRef.current = null;
      if (initialized) {
        app.destroy(true);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('w-full h-full min-h-0', className)}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
