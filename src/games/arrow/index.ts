import { Application, Container, Graphics, Text, Ticker } from 'pixi.js';
import type { MiniGame, MiniGameEndCallback, MiniGameOptions } from '../types';

// ── Config ────────────────────────────────────────────────────────────────────
const LANE_COUNT         = 4;
const HITS_PER_ROUND     = 5;
const TOTAL_GAME_SECS    = 60;
const BETWEEN_SECS       = 2.5;
const LOW_TIME_THRESHOLD = 10;
const REFERENCE_DURATION = 20;

const ROUNDS = [
  { spawnEvery: 1.8, speedMult: 0.7,  hitWindow: 0.6  },
  { spawnEvery: 1.3, speedMult: 1.2,  hitWindow: 0.45 },
  { spawnEvery: 0.9, speedMult: 1.8,  hitWindow: 0.32 },
] as const;

export const DAMAGE_PER_MISS = 10;

// ── Types ─────────────────────────────────────────────────────────────────────
const DIRECTIONS = ['left', 'right', 'up', 'down'] as const;
type Direction = typeof DIRECTIONS[number];
type Phase = 'playing' | 'between' | 'done';

const DIR_SYMBOL: Record<Direction, string> = { left: '←', right: '→', up: '↑', down: '↓' };
const DIR_COLOR:  Record<Direction, number> = {
  left:  0x44aaff,
  right: 0xff8822,
  up:    0x44ee88,
  down:  0xff4466,
};
const DIR_KEYS: Record<Direction, string[]> = {
  left:  ['ArrowLeft',  'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  up:    ['ArrowUp',    'w', 'W'],
  down:  ['ArrowDown',  's', 'S'],
};

type ArrowObj  = { gfx: Container; label: Text; dir: Direction; active: boolean; hitTimer: number; consumed: boolean };
type Particle  = { gfx: Graphics; vx: number; vy: number; life: number; maxLife: number };
type FloatText = { gfx: Text; vy: number; life: number; maxLife: number };

// ── Factory ───────────────────────────────────────────────────────────────────
export function createArrowGame(app: Application, onEnd: MiniGameEndCallback, options?: MiniGameOptions): MiniGame {
  const onPlayerHit     = options?.onPlayerHit;
  const onRoundComplete = options?.onRoundComplete;
  const onFalseHit      = options?.onFalseHit;

  const W    = app.screen.width;
  const H    = app.screen.height;
  const colW = W / LANE_COUNT;

  const ARROW_FONT = Math.max(18, H * 0.11);
  const HIT_ZONE_H = Math.max(34, H * 0.16);
  const HIT_ZONE_Y = H - HIT_ZONE_H - Math.max(6, H * 0.03);
  const HUD_SIZE   = Math.max(10, H * 0.06);

  // ── Layers ─────────────────────────────────────────────────────────────────
  const bgLayer      = new Container();
  const arrowLayer   = new Container();
  const vfxLayer     = new Container();
  const hudLayer     = new Container();
  const overlayLayer = new Container();
  app.stage.addChild(bgLayer, arrowLayer, vfxLayer, hudLayer, overlayLayer);

  // ── Background: lanes + hit zones ──────────────────────────────────────────
  for (let i = 0; i < LANE_COUNT; i++) {
    const dir = DIRECTIONS[i];
    const col = DIR_COLOR[dir];

    bgLayer.addChild(new Graphics().rect(i * colW, 0, colW, H).fill({ color: col, alpha: 0.04 }));

    if (i > 0) {
      bgLayer.addChild(
        new Graphics().moveTo(i * colW, 0).lineTo(i * colW, H).stroke({ color: 0xffffff, alpha: 0.08, width: 1 }),
      );
    }

    bgLayer.addChild(
      new Graphics()
        .rect(i * colW + 3, HIT_ZONE_Y - 2, colW - 6, HIT_ZONE_H + 4)
        .fill({ color: col, alpha: 0.1 })
        .stroke({ color: col, alpha: 0.4, width: 2 }),
    );

    // Ghost icon — alpha must be set on the object, not inside TextStyle (Pixi v8)
    const ghost = new Text({ text: DIR_SYMBOL[dir], style: { fontSize: ARROW_FONT * 0.85, fill: col } });
    ghost.alpha = 0.18;
    ghost.anchor.set(0.5, 0.5);
    ghost.x = i * colW + colW / 2;
    ghost.y = HIT_ZONE_Y + HIT_ZONE_H / 2;
    bgLayer.addChild(ghost);
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let destroyed      = false;
  let phase: Phase   = 'playing';
  let currentRound   = 0;
  let roundElapsed   = 0;
  let totalElapsed   = 0;
  let betweenElapsed = 0;
  let totalMisses    = 0;
  let roundHits      = 0;
  let roundMisses    = 0;
  let spawnCD        = 0.3;

  // Flash state: track duration + peak alpha together so fade is always correct
  let hitFlashTimer    = 0;
  let hitFlashDuration = 0;
  let hitFlashPeak     = 0;

  const arrows:     ArrowObj[]  = [];
  const particles:  Particle[]  = [];
  const floatTexts: FloatText[] = [];

  // ── VFX helpers ────────────────────────────────────────────────────────────
  const addParticle = (x: number, y: number, color: number, r: number, vx: number, vy: number, life: number) => {
    const p: Particle = { gfx: new Graphics().circle(0, 0, r).fill({ color }), vx, vy, life, maxLife: life };
    p.gfx.x = x; p.gfx.y = y;
    vfxLayer.addChild(p.gfx);
    particles.push(p);
  };

  const hitBurst = (x: number, y: number, color: number) => {
    for (let i = 0; i < 12; i++) {
      const a   = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const spd = 55 + Math.random() * 90;
      addParticle(x, y, color, 2 + Math.random() * 3.5, Math.cos(a) * spd, Math.sin(a) * spd, 0.4 + Math.random() * 0.25);
    }
    addParticle(x, y, 0xffffff, ARROW_FONT * 0.35, 0, 0, 0.12);
  };

  const showFloat = (text: string, x: number, y: number, color: number) => {
    const t = new Text({ text, style: { fontSize: HUD_SIZE * 1.1, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '800' } });
    t.anchor.set(0.5, 0.5);
    t.x = x; t.y = y;
    vfxLayer.addChild(t);
    floatTexts.push({ gfx: t, vy: -55, life: 0.65, maxLife: 0.65 });
  };

  const triggerFlash = (peak: number, duration: number) => {
    hitFlashPeak     = peak;
    hitFlashDuration = duration;
    hitFlashTimer    = duration;
    hitFlashGfx.visible = true;
    hitFlashGfx.alpha   = peak;
  };

  // ── HUD ────────────────────────────────────────────────────────────────────
  const makeHud = (text: string, color: number) =>
    new Text({ text, style: { fontSize: HUD_SIZE, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '600' } });

  const timerTxt = makeHud(`${TOTAL_GAME_SECS}s`, 0xffffff);
  timerTxt.x = 6; timerTxt.y = 4; hudLayer.addChild(timerTxt);

  const hitsTxt = makeHud(`✓ 0/${HITS_PER_ROUND}`, 0x44ee88);
  hitsTxt.anchor.set(1, 0); hitsTxt.x = W - 6; hitsTxt.y = 4; hudLayer.addChild(hitsTxt);

  const missTxt = makeHud('💥 0', 0xff5555);
  missTxt.anchor.set(0.5, 0); missTxt.x = W / 2; missTxt.y = 4; hudLayer.addChild(missTxt);

  const roundTxt = makeHud(`Round 1/${ROUNDS.length}`, 0xaaddff);
  roundTxt.anchor.set(0.5, 0); roundTxt.x = W / 2; roundTxt.y = HUD_SIZE + 8; hudLayer.addChild(roundTxt);

  // ── Overlays ───────────────────────────────────────────────────────────────
  const hitFlashGfx = new Graphics().rect(0, 0, W, H).fill({ color: 0xff2200, alpha: 0 });
  hitFlashGfx.visible = false;
  overlayLayer.addChild(hitFlashGfx);

  const overlayBg    = new Graphics().rect(0, 0, W, H).fill({ color: 0x000022, alpha: 0.65 });
  const overlayTitle = makeHud('', 0xffffff);
  const overlayStats = makeHud('', 0xffdd44);
  overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
  overlayTitle.anchor.set(0.5, 0.5); overlayTitle.x = W / 2; overlayTitle.y = H / 2 - HUD_SIZE * 1.2;
  overlayStats.anchor.set(0.5, 0.5); overlayStats.x = W / 2; overlayStats.y = H / 2 + HUD_SIZE * 0.5;
  overlayLayer.addChild(overlayBg, overlayTitle, overlayStats);

  // ── Arrow factory ──────────────────────────────────────────────────────────
  const spawnArrow = () => {
    const lane  = Math.floor(Math.random() * LANE_COUNT);
    const dir   = DIRECTIONS[lane];
    const col   = DIR_COLOR[dir];
    const c     = new Container();
    const label = new Text({ text: DIR_SYMBOL[dir], style: { fontSize: ARROW_FONT, fill: col, fontWeight: '800' } });
    label.anchor.set(0.5, 0.5);
    c.addChild(label);
    c.x = lane * colW + colW / 2;
    c.y = -ARROW_FONT;
    arrowLayer.addChild(c);
    arrows.push({ gfx: c, label, dir, active: false, hitTimer: 0, consumed: false });
  };

  const clearArrows = () => {
    for (const a of arrows) a.gfx.destroy();
    arrows.length = 0;
  };

  // ── Round transitions ──────────────────────────────────────────────────────
  const startBetween = () => {
    phase = 'between'; betweenElapsed = 0;
    clearArrows();
    const isLast = currentRound >= ROUNDS.length - 1;
    overlayTitle.text = isLast ? '🏆 Фініш!' : `Round ${currentRound + 1} done!`;
    overlayStats.text = `✓ ${roundHits}  💥 ${roundMisses}`;
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = true;
    onRoundComplete?.();
  };

  const startRound = (idx: number) => {
    currentRound = idx;
    roundElapsed = roundHits = roundMisses = 0;
    spawnCD = 0.3;
    phase = 'playing';
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
    roundTxt.text = `Round ${idx + 1}/${ROUNDS.length}`;
    hitsTxt.text  = `✓ 0/${HITS_PER_ROUND}`;
  };

  // ── Miss / hit logic ───────────────────────────────────────────────────────
  const triggerMiss = (a: ArrowObj) => {
    if (a.consumed) return;
    a.consumed = true;
    roundMisses++; totalMisses++;
    missTxt.text = `💥 ${totalMisses}`;
    triggerFlash(0.42, 0.28);
    a.label.style.fill = 0xff2200;
    showFloat('MISS!', a.gfx.x, a.gfx.y, 0xff3333);
    onPlayerHit?.();
  };

  const tryHit = (dir: Direction): boolean => {
    if (phase !== 'playing') return false;
    for (let i = 0; i < arrows.length; i++) {
      const a = arrows[i];
      if (!a.consumed && a.active && a.dir === dir) {
        const { x, y } = a.gfx;
        a.consumed = true;
        hitBurst(x, y, DIR_COLOR[dir]);
        showFloat('HIT!', x, y - ARROW_FONT * 0.5, DIR_COLOR[dir]);
        a.gfx.destroy();
        arrows.splice(i, 1);
        roundHits++;
        hitsTxt.text = `✓ ${roundHits}/${HITS_PER_ROUND}`;
        if (roundHits >= HITS_PER_ROUND) startBetween();
        return true;
      }
    }
    // False press
    const cx = DIRECTIONS.indexOf(dir) * colW + colW / 2;
    showFloat('✗', cx, HIT_ZONE_Y + HIT_ZONE_H / 2, 0xff2200);
    triggerFlash(0.3, 0.18);
    onFalseHit?.();
    return false;
  };

  // ── Main loop ─────────────────────────────────────────────────────────────
  const tick = (ticker: Ticker) => {
    if (destroyed) return;
    const dt = ticker.deltaMS / 1000;

    // Tick particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; p.gfx.x += p.vx * dt; p.gfx.y += p.vy * dt;
      p.gfx.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) { p.gfx.destroy(); particles.splice(i, 1); }
    }

    // Tick floating texts
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.life -= dt; ft.gfx.y += ft.vy * dt;
      ft.gfx.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) { ft.gfx.destroy(); floatTexts.splice(i, 1); }
    }

    // Hit flash fade
    if (hitFlashTimer > 0) {
      hitFlashTimer -= dt;
      hitFlashGfx.alpha = Math.max(0, (hitFlashTimer / hitFlashDuration) * hitFlashPeak);
      if (hitFlashTimer <= 0) hitFlashGfx.visible = false;
    }

    // Between-round pause
    if (phase === 'between') {
      betweenElapsed += dt;
      if (betweenElapsed >= BETWEEN_SECS) {
        const next = currentRound + 1;
        if (next >= ROUNDS.length || totalElapsed >= TOTAL_GAME_SECS) {
          phase = 'done';
          destroy();
          onEnd({ playerHits: totalMisses, swordsCollected: roundHits });
        } else {
          startRound(next);
        }
      }
      return;
    }
    if (phase === 'done') return;

    // Playing
    const cfg = ROUNDS[currentRound];
    roundElapsed += dt;
    totalElapsed += dt;

    const timeLeft = Math.max(0, TOTAL_GAME_SECS - totalElapsed);
    timerTxt.text = `${Math.ceil(timeLeft)}s`;
    timerTxt.style.fill = timeLeft <= LOW_TIME_THRESHOLD
      ? (Math.floor(totalElapsed * 4) % 2 === 0 ? 0xff3333 : 0xffffff)
      : 0xffffff;

    if (totalElapsed >= TOTAL_GAME_SECS) {
      phase = 'done';
      destroy();
      onEnd({ playerHits: totalMisses, swordsCollected: roundHits });
      return;
    }

    // Spawn
    spawnCD -= dt;
    if (spawnCD <= 0) { spawnArrow(); spawnCD = cfg.spawnEvery; }

    const speed = (H / 3.2) * (1 + (roundElapsed / REFERENCE_DURATION) * cfg.speedMult);

    // Update arrows
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];

      if (a.consumed) {
        a.gfx.alpha = Math.max(0, a.gfx.alpha - dt * 4);
        a.gfx.y += speed * dt * 0.5;
        if (a.gfx.alpha <= 0) { a.gfx.destroy(); arrows.splice(i, 1); }
        continue;
      }

      a.gfx.y += speed * dt;

      if (!a.active && a.gfx.y >= HIT_ZONE_Y) {
        a.active   = true;
        a.hitTimer = cfg.hitWindow;
        a.label.scale.set(1.18);
      }

      if (a.active) {
        a.hitTimer -= dt;
        a.label.scale.set(1.12 + Math.sin(a.hitTimer * 28) * 0.08);
        if (a.hitTimer <= 0) triggerMiss(a);
      }

      if (a.gfx.y > H + ARROW_FONT * 2) { a.gfx.destroy(); arrows.splice(i, 1); }
    }
  };

  app.ticker.add(tick);

  // ── Input ──────────────────────────────────────────────────────────────────
  const onKey = (e: KeyboardEvent) => {
    for (const dir of DIRECTIONS) {
      // tryHit already calls onFalseHit internally — don't call it again here
      if (DIR_KEYS[dir].includes(e.key)) { e.preventDefault(); tryHit(dir); return; }
    }
  };

  window.addEventListener('keydown', onKey);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    app.ticker.remove(tick);
    window.removeEventListener('keydown', onKey);
  };

  return { destroy, hitDirection: tryHit };
}
