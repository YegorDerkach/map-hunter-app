import { Application, Container, Graphics, Text, Ticker } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { MiniGame, MiniGameEndCallback, MiniGameOptions } from '../types';

// ── Config ────────────────────────────────────────────────────────────────────
const ROUNDS = [
  { cols: 2, rows: 2, pairCount: 2, trapCount: 0, timeLimit: 30, damage: 10 },
  { cols: 3, rows: 3, pairCount: 4, trapCount: 1, timeLimit: 45, damage: 5  },
  { cols: 4, rows: 4, pairCount: 8, trapCount: 0, timeLimit: 60, damage: 2  },
] as const;

const BETWEEN_SECS    = 2.5;
const FLIP_HALF       = 0.15;   // seconds per flip half
const WRONG_SHOW_SECS = 0.8;    // how long wrong-match cards stay face-up
const LOW_TIME        = 6;

const CARD_SYMBOLS = ['🔥', '💧', '⚡', '🌿', '🌙', '⭐', '💎', '🗡️'];
const TRAP_SYMBOL  = '💀';

// Face colors — project game tokens (HSL → hex)
// orange, green, purple, red, yellow, pink, cyan, teal
const SYMBOL_COLORS = [
  0xF26A1A, // --game-orange  hsl(24  95% 55%)
  0x2E9A65, // --game-green   hsl(152 55% 40%)
  0x8B4FCC, // --game-purple  hsl(268 55% 55%)
  0xD63535, // --game-red     hsl(0   72% 52%)
  0xF5CB10, // --game-yellow  hsl(45  98% 52%)
  0xDD5599, // --game-pink    hsl(330 65% 60%)
  0x2FAAB8, // --game-cyan    hsl(188 55% 42%)
  0x2A9E8A, // --game-teal    hsl(172 55% 38%)
];

// Damage is now per-round (see ROUNDS[n].damage); no single constant needed

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase     = 'playing' | 'between' | 'done';
type FlipPhase = 'idle' | 'closing' | 'opening';

type Card = {
  col: number; row: number;
  symbol: string; isTrap: boolean;
  isFlipped: boolean; isMatched: boolean;
  gfx: Container;
  back: Graphics;
  face: Container;
  matchFadeTimer: number;   // -1 = not started, > 0 = fading, 0 = done
  flipPhase: FlipPhase;
  flipTimer: number;
  flipTarget: boolean;      // true = opening to face, false = closing to back
  wrongTimer: number;       // > 0 = waiting to flip back
  cx: number; cy: number;   // center position for hit-test
  halfW: number; halfH: number;
};

type Particle  = { gfx: Graphics; vx: number; vy: number; life: number; maxLife: number };
type FloatText = { gfx: Text; vy: number; life: number; maxLife: number };

// ── Factory ───────────────────────────────────────────────────────────────────
export function createPairsGame(
  app: Application,
  onEnd: MiniGameEndCallback,
  options?: MiniGameOptions,
): MiniGame {
  const onPlayerHit     = options?.onPlayerHit;
  const onRoundComplete = options?.onRoundComplete;

  const W = app.screen.width;
  const H = app.screen.height;

  const HUD_SIZE = Math.max(10, H * 0.06);

  // ── Layers ─────────────────────────────────────────────────────────────────
  const bgLayer      = new Container();
  const cardLayer    = new Container();
  const vfxLayer     = new Container();
  const hudLayer     = new Container();
  const overlayLayer = new Container();
  app.stage.addChild(bgLayer, cardLayer, vfxLayer, hudLayer, overlayLayer);

  // No global background — set by the app shell behind the canvas

  // ── State ──────────────────────────────────────────────────────────────────
  let destroyed      = false;
  let phase: Phase   = 'playing';
  let currentRound   = 0;
  let betweenElapsed = 0;
  let roundTimer     = 0;
  let pairsFound     = 0;

  let hitFlashTimer    = 0;
  let hitFlashDuration = 0;
  let hitFlashPeak     = 0;

  const cards:      Card[]       = [];
  const selected:   Card[]       = [];
  const particles:  Particle[]   = [];
  const floatTexts: FloatText[]  = [];

  // ── VFX helpers ────────────────────────────────────────────────────────────
  const addParticle = (x: number, y: number, color: number, r: number, vx: number, vy: number, life: number) => {
    const p: Particle = { gfx: new Graphics().circle(0, 0, r).fill({ color }), vx, vy, life, maxLife: life };
    p.gfx.x = x; p.gfx.y = y;
    vfxLayer.addChild(p.gfx);
    particles.push(p);
  };

  const hitBurst = (cx: number, cy: number, color: number) => {
    for (let i = 0; i < 14; i++) {
      const a   = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const spd = 60 + Math.random() * 100;
      addParticle(cx, cy, color, 2 + Math.random() * 4, Math.cos(a) * spd, Math.sin(a) * spd, 0.45 + Math.random() * 0.25);
    }
    addParticle(cx, cy, 0xffffff, HUD_SIZE * 0.4, 0, 0, 0.15);
  };

  const showFloat = (text: string, x: number, y: number, color: number) => {
    const t = new Text({ text, style: { fontSize: HUD_SIZE * 1.2, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '800' } });
    t.anchor.set(0.5, 0.5);
    t.x = x; t.y = y;
    vfxLayer.addChild(t);
    floatTexts.push({ gfx: t, vy: -60, life: 0.7, maxLife: 0.7 });
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

  const pairsTxt = makeHud('🃏 0/2', 0x2DA99A);   // teal = --primary
  pairsTxt.x = 6; pairsTxt.y = 4;

  const timerTxt = makeHud('⏱ 30s', 0x1E3A44);   // dark foreground
  timerTxt.anchor.set(1, 0); timerTxt.x = W - 6; timerTxt.y = 4;

  const roundTxt = makeHud('Round 1/3', 0x1E3A44);
  roundTxt.anchor.set(0.5, 0); roundTxt.x = W / 2; roundTxt.y = 4;

  hudLayer.addChild(pairsTxt, timerTxt, roundTxt);

  // ── Overlays ───────────────────────────────────────────────────────────────
  // alpha: 0 in fill() would multiply with object alpha → always 0; use fill alpha:1 + object alpha for control
  const hitFlashGfx = new Graphics().rect(0, 0, W, H).fill({ color: 0xff2200 });
  hitFlashGfx.alpha = 0;
  hitFlashGfx.visible = false;
  overlayLayer.addChild(hitFlashGfx);

  const overlayBg    = new Graphics().rect(0, 0, W, H).fill({ color: 0x000022 });
  const overlayTitle = makeHud('', 0xffffff);
  const overlayStats = makeHud('', 0xffdd44);
  overlayBg.alpha = 0.65;
  overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
  overlayTitle.anchor.set(0.5, 0.5); overlayTitle.x = W / 2; overlayTitle.y = H / 2 - HUD_SIZE * 1.2;
  overlayStats.anchor.set(0.5, 0.5); overlayStats.x = W / 2; overlayStats.y = H / 2 + HUD_SIZE * 0.5;
  overlayLayer.addChild(overlayBg, overlayTitle, overlayStats);

  // ── Card builder ───────────────────────────────────────────────────────────
  const CARD_PADDING = Math.max(4, W * 0.025);
  const HUD_H = HUD_SIZE * 2.4;

  const buildCard = (col: number, row: number, symbol: string, isTrap: boolean, cardW: number, cardH: number, offsetX: number, offsetY: number): Card => {
    const cx = offsetX + col * cardW + cardW / 2;
    const cy = offsetY + row * cardH + cardH / 2;
    const hw = cardW / 2 - CARD_PADDING;
    const hh = cardH / 2 - CARD_PADDING;
    const r  = Math.max(4, Math.min(hw, hh) * 0.12);

    const gfx  = new Container();
    gfx.x = cx; gfx.y = cy;

    // Back face — cream card matching project palette
    const TEAL    = 0x2DA99A; // --primary hsl(173 58% 42%)
    const CREAM   = 0xE8E0D0; // --card    hsl(40  28% 88%)
    const CREAM_D = 0xC7BCA8; // --border  hsl(38  22% 72%)

    const back = new Graphics()
      .roundRect(-hw, -hh, hw * 2, hh * 2, r)
      .fill({ color: CREAM })
      .stroke({ color: CREAM_D, width: 2 });
    // Teal dot grid pattern on back (matches project's --pattern-dots style)
    const dotStep = Math.max(6, Math.min(hw, hh) * 0.22);
    for (let px = -hw + dotStep; px < hw; px += dotStep) {
      for (let py = -hh + dotStep; py < hh; py += dotStep) {
        back.circle(px, py, dotStep * 0.12).fill({ color: TEAL, alpha: 0.18 });
      }
    }
    // Inner frame line
    back.roundRect(-hw + 4, -hh + 4, hw * 2 - 8, hh * 2 - 8, Math.max(2, r - 2))
      .stroke({ color: TEAL, alpha: 0.35, width: 1 });

    // Front face — bright game-token color + white border
    const face = new Container();
    const symIdx   = CARD_SYMBOLS.indexOf(symbol);
    const faceColor = isTrap
      ? 0xD63535  // --game-red for trap
      : SYMBOL_COLORS[symIdx % SYMBOL_COLORS.length] ?? 0x2DA99A;
    const faceBg = new Graphics()
      .roundRect(-hw, -hh, hw * 2, hh * 2, r)
      .fill({ color: faceColor })
      .stroke({ color: 0xffffff, alpha: 0.55, width: 2 });
    // Subtle inner highlight (light top edge)
    faceBg.roundRect(-hw + 3, -hh + 3, hw * 2 - 6, hh * 0.5)
      .fill({ color: 0xffffff, alpha: 0.12 });
    const emojiSize = Math.min(hw, hh) * 1.4;
    const label = new Text({ text: symbol, style: { fontSize: emojiSize, fontFamily: 'sans-serif' } });
    label.anchor.set(0.5, 0.5);
    face.addChild(faceBg, label);
    face.visible = false;

    gfx.addChild(back, face);
    cardLayer.addChild(gfx);

    return {
      col, row, symbol, isTrap,
      isFlipped: false, isMatched: false,
      gfx, back, face,
      matchFadeTimer: -1,
      flipPhase: 'idle', flipTimer: 0, flipTarget: false,
      wrongTimer: 0,
      cx, cy, halfW: hw, halfH: hh,
    };
  };

  // ── Shuffle util ───────────────────────────────────────────────────────────
  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ── Build round grid ───────────────────────────────────────────────────────
  const buildGrid = (roundIdx: number) => {
    // Destroy existing cards
    for (const c of cards) c.gfx.destroy();
    cards.length = 0;
    selected.length = 0;

    const cfg = ROUNDS[roundIdx];
    const { cols, rows, pairCount, trapCount } = cfg;

    // Build symbol list
    const syms = shuffle([
      ...CARD_SYMBOLS.slice(0, pairCount).flatMap(s => [s, s]),
      ...Array(trapCount).fill(TRAP_SYMBOL),
    ]);

    // Card cell size
    const gridW = W;
    const gridH = H - HUD_H;
    const cardW = gridW / cols;
    const cardH = gridH / rows;
    const offsetX = 0;
    const offsetY = HUD_H;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx    = row * cols + col;
        const symbol = syms[idx];
        const isTrap = symbol === TRAP_SYMBOL;
        cards.push(buildCard(col, row, symbol, isTrap, cardW, cardH, offsetX, offsetY));
      }
    }
  };

  // ── Flip helpers ───────────────────────────────────────────────────────────
  const startFlip = (card: Card, toFace: boolean) => {
    card.flipPhase  = 'closing';
    card.flipTimer  = FLIP_HALF;
    card.flipTarget = toFace;
    card.isFlipped  = toFace;
  };

  const flipCard = (card: Card) => startFlip(card, true);
  const unflipCard = (card: Card) => startFlip(card, false);

  // ── Hit-test ───────────────────────────────────────────────────────────────
  const hitTestCard = (x: number, y: number): Card | null => {
    for (const c of cards) {
      if (c.isMatched || c.matchFadeTimer > 0) continue;
      if (Math.abs(x - c.cx) <= c.halfW && Math.abs(y - c.cy) <= c.halfH) return c;
    }
    return null;
  };

  // ── Match evaluation ───────────────────────────────────────────────────────
  const evaluateSelected = () => {
    const [a, b] = selected;
    selected.length = 0;
    if (a.symbol === b.symbol) {
      a.isMatched = b.isMatched = true;
      hitBurst(a.cx, a.cy, SYMBOL_COLORS[CARD_SYMBOLS.indexOf(a.symbol) % SYMBOL_COLORS.length] ?? 0xffffff);
      hitBurst(b.cx, b.cy, SYMBOL_COLORS[CARD_SYMBOLS.indexOf(b.symbol) % SYMBOL_COLORS.length] ?? 0xffffff);
      showFloat('MATCH!', (a.cx + b.cx) / 2, (a.cy + b.cy) / 2, 0x44ee88);
      pairsFound++;
      pairsTxt.text = `🃏 ${pairsFound}/${ROUNDS[currentRound].pairCount}`;
      if (pairsFound >= ROUNDS[currentRound].pairCount) {
        // Slight delay so player sees the last match
        setTimeout(() => { if (!destroyed) startBetween(); }, 600);
      }
    } else {
      triggerFlash(0.42, 0.28);
      showFloat('✗', (a.cx + b.cx) / 2, (a.cy + b.cy) / 2, 0xff2200);
      a.wrongTimer = b.wrongTimer = WRONG_SHOW_SECS;
      onPlayerHit?.(ROUNDS[currentRound].damage);
    }
  };

  const handleTrap = (card: Card) => {
    triggerFlash(0.6, 0.4);
    showFloat('💀', card.cx, card.cy - 30, 0xff2200);
    card.wrongTimer = 0.4;
    // Also flip back any card that was pending selection, so player isn't stuck
    for (const s of selected) { s.wrongTimer = 0.4; }
    selected.length = 0;
    onPlayerHit?.(ROUNDS[currentRound].damage);
  };

  // ── Tap input ──────────────────────────────────────────────────────────────
  app.stage.eventMode = 'static';

  const onTap = (e: FederatedPointerEvent) => {
    if (phase !== 'playing') return;
    // Block taps while 2 cards are selected (waiting for evaluation)
    if (selected.length >= 2) return;
    const local = app.stage.toLocal(e.global);
    const card  = hitTestCard(local.x, local.y);
    if (!card || card.isFlipped || card.isMatched || card.flipPhase !== 'idle') return;

    flipCard(card);

    if (card.isTrap) { handleTrap(card); return; }

    selected.push(card);
    if (selected.length === 2) evaluateSelected();
  };

  app.stage.on('pointerdown', onTap);

  // ── Round transitions ──────────────────────────────────────────────────────
  const startBetween = () => {
    if (phase === 'between' || phase === 'done') return;
    phase = 'between'; betweenElapsed = 0;
    const isLast = currentRound >= ROUNDS.length - 1;
    overlayTitle.text = isLast ? '🏆 Фініш!' : `Round ${currentRound + 1} done!`;
    overlayStats.text = `🃏 ${pairsFound}/${ROUNDS[currentRound].pairCount}`;
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = true;
    onRoundComplete?.();
  };

  const startRound = (idx: number) => {
    currentRound = idx;
    pairsFound   = 0;
    roundTimer   = ROUNDS[idx].timeLimit;
    phase        = 'playing';
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
    roundTxt.text  = `Round ${idx + 1}/${ROUNDS.length}`;
    pairsTxt.text  = `🃏 0/${ROUNDS[idx].pairCount}`;
    timerTxt.text  = `⏱ ${Math.ceil(roundTimer)}s`;
    buildGrid(idx);
  };

  // ── Main loop ─────────────────────────────────────────────────────────────
  const tick = (ticker: Ticker) => {
    if (destroyed) return;
    const dt = ticker.deltaMS / 1000;

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; p.gfx.x += p.vx * dt; p.gfx.y += p.vy * dt;
      p.gfx.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) { p.gfx.destroy(); particles.splice(i, 1); }
    }

    // Float texts
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

    // Card animations
    for (const card of cards) {
      // Start match fade once isMatched (-1 = not yet started)
      if (card.isMatched && card.matchFadeTimer < 0) {
        card.matchFadeTimer = 0.4;
      }
      // Match fade-out
      if (card.matchFadeTimer > 0) {
        card.matchFadeTimer -= dt;
        card.gfx.alpha = Math.max(0, card.matchFadeTimer / 0.4);
        if (card.matchFadeTimer <= 0) { card.matchFadeTimer = 0; card.gfx.visible = false; }
        continue;
      }
      if (card.matchFadeTimer === 0) continue; // already faded

      // Wrong-match flip-back timer
      if (card.wrongTimer > 0 && card.flipPhase === 'idle') {
        card.wrongTimer -= dt;
        if (card.wrongTimer <= 0) {
          card.wrongTimer = 0;
          unflipCard(card);
        }
      }

      // Flip animation
      if (card.flipPhase !== 'idle') {
        card.flipTimer -= dt;
        const progress = Math.max(0, card.flipTimer / FLIP_HALF);

        if (card.flipPhase === 'closing') {
          card.gfx.scale.x = progress;
          if (card.flipTimer <= 0) {
            // Swap face/back at X=0
            card.back.visible = !card.flipTarget;
            card.face.visible =  card.flipTarget;
            card.gfx.scale.x  = 0;
            card.flipPhase    = 'opening';
            card.flipTimer    = FLIP_HALF;
          }
        } else if (card.flipPhase === 'opening') {
          card.gfx.scale.x = 1 - progress;
          if (card.flipTimer <= 0) {
            card.gfx.scale.x = 1;
            card.flipPhase   = 'idle';
          }
        }
      }
    }

    // Between-round pause
    if (phase === 'between') {
      betweenElapsed += dt;
      if (betweenElapsed >= BETWEEN_SECS) {
        const next = currentRound + 1;
        if (next >= ROUNDS.length) {
          phase = 'done';
          destroy();
          onEnd({ playerHits: 0, swordsCollected: pairsFound });
        } else {
          startRound(next);
        }
      }
      return;
    }
    if (phase === 'done') return;

    // Playing: countdown timer
    roundTimer -= dt;
    const timeLeft = Math.max(0, roundTimer);
    timerTxt.text  = `⏱ ${Math.ceil(timeLeft)}s`;
    timerTxt.style.fill = timeLeft <= LOW_TIME
      ? (Math.floor(timeLeft * 4) % 2 === 0 ? 0xD63535 : 0x1E3A44)
      : 0x1E3A44;

    if (roundTimer <= 0) {
      // Time up: penalize + advance
      showFloat('⏱ TIME!', W / 2, H / 2, 0xff8800);
      triggerFlash(0.35, 0.4);
      onPlayerHit?.(ROUNDS[currentRound].damage);
      startBetween();
    }
  };

  app.ticker.add(tick);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    app.ticker.remove(tick);
    app.stage.off('pointerdown', onTap);
    app.stage.eventMode = 'auto';
  };

  // ── Kick off ───────────────────────────────────────────────────────────────
  startRound(0);

  return { destroy };
}
