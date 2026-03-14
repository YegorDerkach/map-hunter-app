import { Application, Container, Graphics, Text, Ticker } from 'pixi.js';
import type { MiniGame, MiniGameEndCallback, MiniGameOptions } from '../types';

// ── Difficulty configs ────────────────────────────────────────────────────────
const LANE_COUNT   = 6;
const BETWEEN_SECS = 2.5;

const SWORDS_PER_ROUND   = 5;
const TOTAL_GAME_SECONDS = 70; // 1 min 10 sec
const LOW_TIME_THRESHOLD = 10; // blink timer red when this many seconds left
const REFERENCE_DURATION = 20; // used for speed/extra fireball scaling (round has no fixed time)

const ROUNDS = [
  { spawnEvery: 1.5,  extraThreshold: 99,   extraChance: 0.0,  speedMult: 0.7,  swordEvery: 2.5 },
  { spawnEvery: 1.0,  extraThreshold: 0.6,  extraChance: 0.35, speedMult: 1.5,  swordEvery: 3.0 },
  { spawnEvery: 0.75, extraThreshold: 0.45, extraChance: 0.5,  speedMult: 2.8,  swordEvery: 3.5 },
] as const;

export const DAMAGE_PER_HIT   = 10;
export const DAMAGE_PER_SWORD = 20;

// ── Types ─────────────────────────────────────────────────────────────────────
type Fireball   = { c: Container; lane: number; rotSpeed: number };
type Sword      = { gfx: Text; lane: number };
type VFX        = { gfx: Graphics; vx: number; vy: number; life: number; maxLife: number };
type Phase      = 'playing' | 'between' | 'done';

export function createDodgeGame(app: Application, onEnd: MiniGameEndCallback, options?: MiniGameOptions): MiniGame {
  const onPlayerHit = options?.onPlayerHit;
  const onRoundComplete = options?.onRoundComplete;
  const W = app.screen.width;
  const H = app.screen.height;
  const laneW = W / LANE_COUNT;
  const canvas = app.canvas as HTMLCanvasElement;

  // Sizes relative to canvas
  const FB_R     = Math.max(7,  H * 0.05);
  const SW_SIZE  = Math.max(12, H * 0.11);
  const PL_SIZE  = Math.max(14, H * 0.13);
  const PL_Y     = H - Math.max(8, H * 0.07);
  const HUD_SIZE = Math.max(10, H * 0.06);

  // ── Layered rendering ─────────────────────────────────────────────────────
  const bgLayer      = new Container(); // embers / atmosphere
  const trailLayer   = new Container(); // fire trails + sword sparks
  const gameLayer    = new Container(); // lane lines, player, fireballs, swords
  const hudLayer     = new Container(); // HUD text
  const overlayLayer = new Container(); // between-round screen
  app.stage.addChild(bgLayer, trailLayer, gameLayer, hudLayer, overlayLayer);

  // ── State ─────────────────────────────────────────────────────────────────
  let destroyed      = false;
  let phase: Phase   = 'playing';
  let currentRound   = 0;
  let roundElapsed   = 0;
  let totalElapsed   = 0;
  let betweenElapsed = 0;
  let totalHits      = 0;
  let totalSwords    = 0;
  let roundHits      = 0;
  let roundSwords    = 0;
  let flashTimer     = 0;
  let goldTimer      = 0;
  let hitShakeTimer  = 0;
  let hitFlashAlpha  = 0;
  let fbCooldown     = 0;
  let swCooldown     = ROUNDS[0].swordEvery * 0.4;
  let emberCD        = 0;
  let sparkCD        = 0;
  let playerLane     = Math.floor(LANE_COUNT / 2);
  let playerTargetX  = laneW * playerLane + laneW / 2;

  const fireballs:  Fireball[] = [];
  const swords:     Sword[]    = [];
  const vfx:        VFX[]      = [];  // explosion / catch particles
  const embers:     VFX[]      = [];  // background embers

  // ── Lane dividers ─────────────────────────────────────────────────────────
  const laneGfx = new Graphics();
  for (let i = 1; i < LANE_COUNT; i++) laneGfx.moveTo(i * laneW, 0).lineTo(i * laneW, H);
  laneGfx.stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
  gameLayer.addChild(laneGfx);

  // Active lane highlight
  const laneHL = new Graphics();
  gameLayer.addChild(laneHL);
  const redrawHL = () => {
    laneHL.clear();
    laneHL.rect(playerLane * laneW + 1, 0, laneW - 2, H).fill({ color: 0x44aaff, alpha: 0.07 });
  };
  redrawHL();

  // ── Player ────────────────────────────────────────────────────────────────
  const player = new Text({ text: '🧙', style: { fontSize: PL_SIZE } });
  player.anchor.set(0.5, 1);
  player.x = playerTargetX;
  player.y = PL_Y;
  gameLayer.addChild(player);

  // ── Fireball factory ──────────────────────────────────────────────────────
  const makeFireball = (lane: number): Fireball => {
    const c = new Container();
    // layered circles: glow → body → mid → core → hotspot
    c.addChild(
      new Graphics().circle(0, 0, FB_R * 2.0).fill({ color: 0xff2200, alpha: 0.15 }),
      new Graphics().circle(0, 0, FB_R       ).fill({ color: 0xff5500 }),
      new Graphics().circle(0, 0, FB_R * 0.62).fill({ color: 0xff9900 }),
      new Graphics().circle(0, 0, FB_R * 0.38).fill({ color: 0xffee00 }),
      new Graphics().circle(-FB_R * 0.2, -FB_R * 0.25, FB_R * 0.17).fill({ color: 0xffffff, alpha: 0.8 }),
    );
    c.x = laneW * lane + laneW / 2;
    c.y = -FB_R * 2;
    gameLayer.addChild(c);
    return { c, lane, rotSpeed: (Math.random() - 0.5) * 8 };
  };

  // ── Sword factory ─────────────────────────────────────────────────────────
  const makeSword = (lane: number): Sword => {
    const gfx = new Text({ text: '⚔️', style: { fontSize: SW_SIZE } });
    gfx.anchor.set(0.5, 0.5);
    gfx.x = laneW * lane + laneW / 2;
    gfx.y = -SW_SIZE;
    gameLayer.addChild(gfx);
    return { gfx, lane };
  };

  // ── VFX helpers ───────────────────────────────────────────────────────────
  const addVFX = (layer: Container, arr: VFX[], x: number, y: number, color: number, r: number, vx: number, vy: number, life: number) => {
    const p: VFX = { gfx: new Graphics().circle(0, 0, r).fill({ color }), vx, vy, life, maxLife: life };
    p.gfx.x = x; p.gfx.y = y;
    layer.addChild(p.gfx);
    arr.push(p);
  };

  const fireColors  = [0xff4400, 0xff7700, 0xffaa00, 0xff2200, 0xff9900];
  const swordColors = [0xffffaa, 0xffdd44, 0xffffff, 0xffcc00];
  const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];

  // Fire trail behind a fireball
  const trail = (x: number, y: number) => {
    const r = FB_R * (0.12 + Math.random() * 0.28);
    addVFX(trailLayer, vfx, x + (Math.random() - 0.5) * FB_R * 0.5, y - FB_R * 0.2,
      pick(fireColors), r, (Math.random() - 0.5) * 28, -(18 + Math.random() * 28), 0.18 + Math.random() * 0.18);
  };

  // Big explosion when fireball hits player
  const explosion = (x: number, y: number) => {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.5;
      const spd = 90 + Math.random() * 120;
      addVFX(trailLayer, vfx, x, y, pick(fireColors), 2 + Math.random() * 5,
        Math.cos(a) * spd, Math.sin(a) * spd - 25, 0.4 + Math.random() * 0.35);
    }
    // Central flash
    addVFX(trailLayer, vfx, x, y, 0xffffff, FB_R * 1.2, 0, 0, 0.12);
  };

  // Small continuous sparks around each sword
  const swordSpark = (x: number, y: number) => {
    addVFX(trailLayer, vfx,
      x + (Math.random() - 0.5) * SW_SIZE * 0.7,
      y + (Math.random() - 0.5) * SW_SIZE * 0.7,
      pick(swordColors), 1.2 + Math.random() * 2.5,
      (Math.random() - 0.5) * 55, (Math.random() - 0.5) * 55,
      0.3 + Math.random() * 0.25);
  };

  // Golden burst when sword is caught
  const swordCatch = (x: number, y: number) => {
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const spd = 70 + Math.random() * 110;
      addVFX(trailLayer, vfx, x, y, pick(swordColors), 2 + Math.random() * 4.5,
        Math.cos(a) * spd, Math.sin(a) * spd, 0.5 + Math.random() * 0.3);
    }
    addVFX(trailLayer, vfx, x, y, 0xffffff, SW_SIZE * 0.4, 0, 0, 0.1);
  };

  // Background floating embers
  const spawnEmber = () => {
    addVFX(bgLayer, embers,
      Math.random() * W, H + 4,
      pick(fireColors), 1 + Math.random() * 2.2,
      (Math.random() - 0.5) * 14, -(14 + Math.random() * 22),
      2.5 + Math.random() * 2);
  };

  // ── HUD ───────────────────────────────────────────────────────────────────
  const makeHud = (t: string, color: number) =>
    new Text({ text: t, style: { fontSize: HUD_SIZE, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '600' } });

  const timerTxt = makeHud(`${TOTAL_GAME_SECONDS}s`, 0xffffff);
  timerTxt.x = 6; timerTxt.y = 4; hudLayer.addChild(timerTxt);

  const hitsTxt = makeHud('💥 0', 0xff5555);
  hitsTxt.anchor.set(1, 0); hitsTxt.x = W - 6; hitsTxt.y = 4; hudLayer.addChild(hitsTxt);

  const swordTxt = makeHud(`⚔️ 0/${SWORDS_PER_ROUND}`, 0xffdd44);
  swordTxt.anchor.set(0.5, 0); swordTxt.x = W / 2; swordTxt.y = 4; hudLayer.addChild(swordTxt);

  const roundTxt = makeHud('Round 1 / 3', 0xaaddff);
  roundTxt.anchor.set(0.5, 0); roundTxt.x = W / 2; roundTxt.y = HUD_SIZE + 8; hudLayer.addChild(roundTxt);

  // ── Hit effect: red flash overlay (shown on each fireball hit) ───────────
  const HIT_SHAKE_DURATION  = 0.28;
  const HIT_SHAKE_INTENSITY = 14;
  const hitFlashGfx = new Graphics().rect(0, 0, W, H).fill({ color: 0xff2200, alpha: 0 });
  hitFlashGfx.visible = false;
  overlayLayer.addChild(hitFlashGfx);

  // ── Between-round overlay ─────────────────────────────────────────────────
  const overlayBg    = new Graphics().rect(0, 0, W, H).fill({ color: 0x000022, alpha: 0.6 });
  const overlayTitle = makeHud('', 0xffffff);
  const overlayStats = makeHud('', 0xffdd44);
  overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
  overlayTitle.anchor.set(0.5, 0.5); overlayTitle.x = W / 2; overlayTitle.y = H / 2 - HUD_SIZE * 1.2;
  overlayStats.anchor.set(0.5, 0.5); overlayStats.x = W / 2; overlayStats.y = H / 2 + HUD_SIZE * 0.5;
  overlayLayer.addChild(overlayBg, overlayTitle, overlayStats);

  // ── Round transitions ─────────────────────────────────────────────────────
  const clearProjectiles = () => {
    for (const fb of fireballs) fb.c.destroy({ children: true });
    fireballs.length = 0;
    for (const sw of swords) sw.gfx.destroy();
    swords.length = 0;
  };

  const startBetween = () => {
    phase = 'between'; betweenElapsed = 0;
    gameLayer.x = 0; gameLayer.y = 0;
    hitShakeTimer = 0; hitFlashAlpha = 0; hitFlashGfx.visible = false;
    clearProjectiles();
    const isLast = currentRound >= ROUNDS.length - 1;
    overlayTitle.text = isLast ? '🏆 Фініш!' : `Round ${currentRound + 1} done!`;
    overlayStats.text = `⚔️ ${roundSwords}  💥 ${roundHits}`;
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = true;
  };

  const startRound = (idx: number) => {
    currentRound = idx;
    roundElapsed = roundHits = roundSwords = 0;
    fbCooldown = 0; swCooldown = ROUNDS[idx].swordEvery * 0.4;
    phase = 'playing';
    gameLayer.x = 0; gameLayer.y = 0;
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
    roundTxt.text = `Round ${idx + 1} / ${ROUNDS.length}`;
  };

  // ── Tick VFX arrays ───────────────────────────────────────────────────────
  const tickVFX = (arr: VFX[], dt: number, gravity: number) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;
      p.vy += gravity * dt;
      p.gfx.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) { p.gfx.destroy(); arr.splice(i, 1); }
    }
  };

  // ── Main game loop ────────────────────────────────────────────────────────
  const tick = (ticker: Ticker) => {
    if (destroyed) return;
    const dt = ticker.deltaMS / 1000;

    tickVFX(vfx,    dt, 180); // explosion/trail particles fall with gravity
    tickVFX(embers, dt,   0); // embers float upward (no gravity)

    // Background embers
    emberCD -= dt;
    if (emberCD <= 0) { spawnEmber(); emberCD = 0.1 + Math.random() * 0.08; }

    // ── Between-round pause ───────────────────────────────────────────────
    if (phase === 'between') {
      betweenElapsed += dt;
      if (betweenElapsed >= BETWEEN_SECS) {
        const next = currentRound + 1;
        const timeUp = totalElapsed >= TOTAL_GAME_SECONDS;
        if (next >= ROUNDS.length || timeUp) { phase = 'done'; destroy(); onEnd({ playerHits: totalHits, swordsCollected: totalSwords }); }
        else startRound(next);
      }
      return;
    }
    if (phase === 'done') return;

    // ── Playing ───────────────────────────────────────────────────────────
    const cfg = ROUNDS[currentRound];
    roundElapsed += dt;
    totalElapsed += dt;
    const totalTimeLeft = Math.max(0, TOTAL_GAME_SECONDS - totalElapsed);
    timerTxt.text = `${Math.ceil(totalTimeLeft)}s`;
    // Last 10 seconds: blink timer red
    if (totalTimeLeft <= LOW_TIME_THRESHOLD) {
      timerTxt.style.fill = Math.floor(totalElapsed * 4) % 2 === 0 ? 0xff3333 : 0xffffff;
    } else {
      timerTxt.style.fill = 0xffffff;
    }
    swordTxt.text = `⚔️ ${roundSwords}/${SWORDS_PER_ROUND}`;

    // Hit shake: apply and decay
    if (hitShakeTimer > 0) {
      const t = hitShakeTimer / HIT_SHAKE_DURATION;
      gameLayer.x = (Math.random() - 0.5) * 2 * HIT_SHAKE_INTENSITY * t;
      gameLayer.y = (Math.random() - 0.5) * 2 * HIT_SHAKE_INTENSITY * t;
      hitShakeTimer -= dt;
      if (hitShakeTimer <= 0) { gameLayer.x = 0; gameLayer.y = 0; }
    }
    // Hit flash: red overlay fade-out
    if (hitFlashAlpha > 0) {
      hitFlashAlpha -= dt * 3.2;
      hitFlashGfx.alpha = hitFlashAlpha;
      if (hitFlashAlpha <= 0) { hitFlashGfx.visible = false; }
    }

    // Player smooth move + idle bob
    player.x += (playerTargetX - player.x) * Math.min(1, dt * 20);
    player.y = PL_Y + Math.sin(roundElapsed * 3.2) * 1.8;

    if      (flashTimer > 0) { flashTimer -= dt; player.tint = flashTimer > 0 ? 0xff3333 : 0xffffff; }
    else if (goldTimer  > 0) { goldTimer  -= dt; player.tint = goldTimer  > 0 ? 0xffdd44 : 0xffffff; }

    // Global time limit — end game
    if (totalElapsed >= TOTAL_GAME_SECONDS) {
      phase = 'done';
      destroy();
      onEnd({ playerHits: totalHits, swordsCollected: totalSwords });
      return;
    }

    // Spawn fireballs
    fbCooldown -= dt;
    if (fbCooldown <= 0) {
      fireballs.push(makeFireball(Math.floor(Math.random() * LANE_COUNT)));
      fbCooldown = cfg.spawnEvery;
      if (roundElapsed / REFERENCE_DURATION > cfg.extraThreshold && Math.random() < cfg.extraChance) {
        const last = fireballs[fireballs.length - 1]?.lane ?? -1;
        let alt = Math.floor(Math.random() * LANE_COUNT);
        for (let t = 0; t < 4 && alt === last; t++) alt = Math.floor(Math.random() * LANE_COUNT);
        fireballs.push(makeFireball(alt));
      }
    }

    // Spawn swords
    swCooldown -= dt;
    if (swCooldown <= 0) { swords.push(makeSword(Math.floor(Math.random() * LANE_COUNT))); swCooldown = cfg.swordEvery; }

    // Sword ambient sparkles
    sparkCD -= dt;
    if (sparkCD <= 0) { for (const sw of swords) swordSpark(sw.gfx.x, sw.gfx.y); sparkCD = 0.1; }

    const speed = (H / 3) * (1 + (roundElapsed / REFERENCE_DURATION) * cfg.speedMult);

    // Fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const fb = fireballs[i];
      fb.c.y += speed * dt;
      fb.c.rotation += fb.rotSpeed * dt;
      fb.c.scale.set(0.9 + Math.sin(roundElapsed * 10 + i * 1.7) * 0.1);

      // Fire trail — more particles = denser trail
      if (Math.random() < 0.9) trail(fb.c.x, fb.c.y);
      if (speed > H * 0.7 && Math.random() < 0.5) trail(fb.c.x, fb.c.y); // extra trail at high speed

      const fbX = laneW * fb.lane + laneW / 2;
      if (fb.c.y + FB_R >= PL_Y - PL_SIZE && Math.abs(fbX - player.x) < laneW * 0.85) {
        roundHits++; totalHits++;
        hitsTxt.text = `💥 ${totalHits}`;
        flashTimer = 0.4;
        hitShakeTimer = HIT_SHAKE_DURATION;
        hitFlashAlpha = 0.5;
        hitFlashGfx.visible = true;
        hitFlashGfx.alpha = hitFlashAlpha;
        onPlayerHit?.();
        explosion(fb.c.x, fb.c.y);
        fb.c.destroy({ children: true }); fireballs.splice(i, 1);
        continue;
      }
      if (fb.c.y - FB_R > H) { fb.c.destroy({ children: true }); fireballs.splice(i, 1); }
    }

    // Swords
    for (let i = swords.length - 1; i >= 0; i--) {
      const sw = swords[i];
      sw.gfx.y += speed * 0.65 * dt;
      sw.gfx.rotation += 4 * dt;

      const swX = laneW * sw.lane + laneW / 2;
      if (sw.gfx.y >= PL_Y - PL_SIZE && Math.abs(swX - player.x) < laneW * 0.85) {
        roundSwords++; totalSwords++;
        swordTxt.text = `⚔️ ${roundSwords}/${SWORDS_PER_ROUND}`;
        goldTimer = 0.35;
        swordCatch(sw.gfx.x, sw.gfx.y);
        sw.gfx.destroy(); swords.splice(i, 1);
        continue;
      }
      if (sw.gfx.y - SW_SIZE > H) { sw.gfx.destroy(); swords.splice(i, 1); }
    }

    if (roundSwords >= SWORDS_PER_ROUND) {
      onRoundComplete?.();
      startBetween();
    }
  };

  app.ticker.add(tick);

  // ── Input ─────────────────────────────────────────────────────────────────
  const updateTarget = () => { playerTargetX = laneW * playerLane + laneW / 2; redrawHL(); };
  const moveLeft  = () => { if (phase !== 'playing') return; if (playerLane > 0)              { playerLane--; updateTarget(); } };
  const moveRight = () => { if (phase !== 'playing') return; if (playerLane < LANE_COUNT - 1) { playerLane++; updateTarget(); } };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { e.preventDefault(); moveLeft(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); moveRight(); }
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    const t = Math.max(0, Math.min(LANE_COUNT - 1, Math.floor(((e.clientX - rect.left) / rect.width) * LANE_COUNT)));
    if (t < playerLane) moveLeft(); else if (t > playerLane) moveRight();
  };
  let sx = 0, sy = 0;
  const onTS = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
  const onTE = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) { if (dx < 0) moveLeft(); else moveRight(); }
  };

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('touchstart', onTS, { passive: true });
  canvas.addEventListener('touchend', onTE);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    app.ticker.remove(tick);
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerdown', onPointer);
    canvas.removeEventListener('touchstart', onTS);
    canvas.removeEventListener('touchend', onTE);
  };

  return { destroy };
}
