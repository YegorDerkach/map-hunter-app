import { Application, Container, Graphics, Text } from 'pixi.js';
import type { MiniGame, MiniGameOptions } from '../types';

// ── Round config ────────────────────────────────────────────────────────────
const ROUNDS = [
  { difficulty: 'easy'   as const, damage: 10 },
  { difficulty: 'medium' as const, damage: 5  },
  { difficulty: 'hard'   as const, damage: 2  },
] as const;

// ── Palette ─────────────────────────────────────────────────────────────────
const CREAM   = 0xE8E0D0;
const CREAM_D = 0xC7BCA8;
const TEAL    = 0x2DA99A;
const DARK    = 0x1E3A44;
const RED     = 0xD63535;
const ORANGE  = 0xF26A1A;
const GREEN   = 0x2E9A65;

// ── Board logic ─────────────────────────────────────────────────────────────
const PLAYER =  1 as const;
const AI     = -1 as const;

type Cell  = 0 | 1 | -1;
type Board = [Cell,Cell,Cell,Cell,Cell,Cell,Cell,Cell,Cell];

const WIN_LINES: readonly [number, number, number][] = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
] as const;

/** Returns 1 (player), -1 (AI), 0 (draw), or null (ongoing). */
function checkResult(b: Board): 1 | -1 | 0 | null {
  for (const [a, m, c] of WIN_LINES) {
    if (b[a] !== 0 && b[a] === b[m] && b[m] === b[c]) return b[a] as 1 | -1;
  }
  return b.every(c => c !== 0) ? 0 : null;
}

function findWinLine(b: Board): [number,number,number] | null {
  for (const line of WIN_LINES) {
    const [a, m, c] = line;
    if (b[a] !== 0 && b[a] === b[m] && b[m] === b[c]) return line;
  }
  return null;
}

function emptyCells(b: Board): number[] {
  return (b as Cell[]).reduce<number[]>((acc, c, i) => { if (c === 0) acc.push(i); return acc; }, []);
}

function minimax(b: Board, isMax: boolean, depth: number): number {
  const r = checkResult(b);
  if (r === AI)     return 10 - depth;
  if (r === PLAYER) return depth - 10;
  if (r === 0)      return 0;
  const cells = emptyCells(b);
  if (isMax) {
    let best = -Infinity;
    for (const i of cells) { b[i] = AI;     best = Math.max(best, minimax(b, false, depth + 1)); b[i] = 0; }
    return best;
  } else {
    let best =  Infinity;
    for (const i of cells) { b[i] = PLAYER; best = Math.min(best, minimax(b, true,  depth + 1)); b[i] = 0; }
    return best;
  }
}

function getAiMove(b: Board, difficulty: 'easy' | 'medium' | 'hard'): number {
  const cells = emptyCells(b);
  if (cells.length === 0) return -1;

  if (difficulty === 'easy') {
    return cells[Math.floor(Math.random() * cells.length)];
  }

  if (difficulty === 'medium') {
    // Take win
    for (const i of cells) { b[i] = AI;     if (checkResult(b) === AI)     { b[i] = 0; return i; } b[i] = 0; }
    // Block player win
    for (const i of cells) { b[i] = PLAYER; if (checkResult(b) === PLAYER) { b[i] = 0; return i; } b[i] = 0; }
    // Prefer center, then corners, then random
    for (const pref of [4, 0, 2, 6, 8]) { if (cells.includes(pref)) return pref; }
    return cells[Math.floor(Math.random() * cells.length)];
  }

  // hard: minimax
  let best = -Infinity, bestMove = cells[0];
  for (const i of cells) {
    b[i] = AI;
    const score = minimax(b, false, 0);
    b[i] = 0;
    if (score > best) { best = score; bestMove = i; }
  }
  return bestMove;
}

// ── Game factory ─────────────────────────────────────────────────────────────
export function createTicTacToeGame(
  app: Application,
  onEnd: () => void,
  options?: MiniGameOptions,
): MiniGame {
  const onPlayerHit    = options?.onPlayerHit;
  const onRoundComplete = options?.onRoundComplete;

  const W = app.screen.width;
  const H = app.screen.height;
  const HUD_SIZE = Math.max(10, H * 0.06);

  // ── Layers ──────────────────────────────────────────────────────────────
  const boardLayer   = new Container();
  const vfxLayer     = new Container();
  const hudLayer     = new Container();
  const overlayLayer = new Container();
  app.stage.addChild(boardLayer, vfxLayer, hudLayer, overlayLayer);

  // ── State ────────────────────────────────────────────────────────────────
  let destroyed    = false;
  let phase: 'playing' | 'result' | 'between' | 'done' = 'playing';
  let currentRound = 0;
  let roundWins    = 0;
  let lastResultWasDraw = false;
  let board        = Array(9).fill(0) as Board;
  let playerTurn   = true;
  let aiThinkTimer = 0;
  let phaseTimer   = 0;

  // ── VFX ──────────────────────────────────────────────────────────────────
  type FloatText = { gfx: Text; vy: number; life: number; maxLife: number };
  const floatTexts: FloatText[] = [];
  let hitFlashTimer    = 0;
  let hitFlashDuration = 1;
  let hitFlashPeak     = 0;

  const showFloat = (text: string, x: number, y: number, color: number) => {
    const t = new Text({ text, style: { fontSize: HUD_SIZE * 1.1, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '700' } });
    t.anchor.set(0.5, 0.5); t.x = x; t.y = y;
    vfxLayer.addChild(t);
    floatTexts.push({ gfx: t, vy: -60, life: 0.9, maxLife: 0.9 });
  };

  const triggerFlash = (peak: number, duration: number) => {
    hitFlashPeak = peak; hitFlashDuration = duration; hitFlashTimer = duration;
    hitFlashGfx.alpha = peak;
  };

  // ── Hit flash ────────────────────────────────────────────────────────────
  const hitFlashGfx = new Graphics().rect(0, 0, W, H).fill({ color: 0xff2200 });
  hitFlashGfx.alpha = 0;
  overlayLayer.addChild(hitFlashGfx);

  // ── HUD ──────────────────────────────────────────────────────────────────
  const makeText = (text: string, size: number, color: number) =>
    new Text({ text, style: { fontSize: size, fill: color, fontFamily: 'Fredoka, sans-serif', fontWeight: '600' } });

  const roundTxt  = makeText('Round 1/3', HUD_SIZE, DARK);
  roundTxt.anchor.set(0.5, 0); roundTxt.x = W / 2; roundTxt.y = 4;

  const statusTxt = makeText('', HUD_SIZE * 0.8, TEAL);
  statusTxt.anchor.set(0.5, 0); statusTxt.x = W / 2; statusTxt.y = 4 + HUD_SIZE + 2;

  hudLayer.addChild(roundTxt, statusTxt);

  // ── End overlay ──────────────────────────────────────────────────────────
  const overlayBg    = new Graphics().rect(0, 0, W, H).fill({ color: 0x000022 });
  const overlayTitle = makeText('', HUD_SIZE * 1.4, 0xffffff);
  const overlayStats = makeText('', HUD_SIZE, 0xffdd44);
  overlayBg.alpha = 0.65;
  overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
  overlayTitle.anchor.set(0.5, 0.5); overlayTitle.x = W / 2; overlayTitle.y = H / 2 - HUD_SIZE * 1.2;
  overlayStats.anchor.set(0.5, 0.5); overlayStats.x = W / 2; overlayStats.y = H / 2 + HUD_SIZE * 0.5;
  overlayLayer.addChild(overlayBg, overlayTitle, overlayStats);

  // ── Board geometry ───────────────────────────────────────────────────────
  const hudBottom = 4 + HUD_SIZE * 2 + 10;
  const margin    = Math.min(W, H) * 0.05;
  const boardSize = Math.min(W - margin * 2, H - hudBottom - margin * 2);
  const boardX    = W / 2 - boardSize / 2;
  const boardY    = hudBottom + (H - hudBottom - boardSize) / 2;
  const cellSize  = boardSize / 3;

  // Board background
  const boardBg = new Graphics()
    .roundRect(boardX, boardY, boardSize, boardSize, 10)
    .fill({ color: CREAM })
    .stroke({ color: CREAM_D, width: 2 });
  boardLayer.addChild(boardBg);

  // Grid lines
  const gridGfx = new Graphics();
  for (let i = 1; i < 3; i++) {
    const x = boardX + i * cellSize;
    const y = boardY + i * cellSize;
    gridGfx.moveTo(x, boardY + 8).lineTo(x, boardY + boardSize - 8);
    gridGfx.moveTo(boardX + 8, y).lineTo(boardX + boardSize - 8, y);
  }
  gridGfx.stroke({ color: TEAL, width: Math.max(3, cellSize * 0.06), alpha: 0.55, cap: 'round' });
  boardLayer.addChild(gridGfx);

  // Cell symbol containers
  const cellGfxs: Container[] = Array.from({ length: 9 }, (_, i) => {
    const c = new Container();
    c.x = boardX + (i % 3) * cellSize + cellSize / 2;
    c.y = boardY + Math.floor(i / 3) * cellSize + cellSize / 2;
    boardLayer.addChild(c);
    return c;
  });

  // Win-line overlay
  const winLineGfx = new Graphics();
  boardLayer.addChild(winLineGfx);

  // ── Draw helpers ─────────────────────────────────────────────────────────
  const symR = cellSize * 0.3;
  const lw   = Math.max(4, cellSize * 0.09);

  const drawX = (cont: Container) => {
    cont.removeChildren();
    const g = new Graphics();
    g.moveTo(-symR, -symR).lineTo(symR, symR);
    g.moveTo( symR, -symR).lineTo(-symR, symR);
    g.stroke({ color: RED, width: lw, cap: 'round' });
    cont.addChild(g);
  };

  const drawO = (cont: Container) => {
    cont.removeChildren();
    const g = new Graphics();
    g.circle(0, 0, symR).stroke({ color: TEAL, width: lw });
    cont.addChild(g);
  };

  const drawWinLine = (line: [number,number,number]) => {
    const [a, , c] = line;
    const ax = boardX + (a % 3) * cellSize + cellSize / 2;
    const ay = boardY + Math.floor(a / 3) * cellSize + cellSize / 2;
    const cx = boardX + (c % 3) * cellSize + cellSize / 2;
    const cy = boardY + Math.floor(c / 3) * cellSize + cellSize / 2;
    winLineGfx.clear();
    winLineGfx.moveTo(ax, ay).lineTo(cx, cy);
    winLineGfx.stroke({ color: GREEN, width: Math.max(5, cellSize * 0.1), alpha: 0.85, cap: 'round' });
  };

  // ── Round management ─────────────────────────────────────────────────────
  const startRound = (roundIndex: number) => {
    currentRound = roundIndex;
    board        = Array(9).fill(0) as Board;
    playerTurn   = true;
    phase        = 'playing';
    aiThinkTimer = 0;
    winLineGfx.clear();
    for (const c of cellGfxs) c.removeChildren();
    roundTxt.text  = `Round ${roundIndex + 1}/3`;
    statusTxt.text = 'Your turn ✖';
    (statusTxt.style as { fill: number }).fill = RED;
    overlayBg.visible = overlayTitle.visible = overlayStats.visible = false;
  };

  const endRound = (result: 'win' | 'lose' | 'draw') => {
    phase = 'result';
    phaseTimer = 1.5;
    lastResultWasDraw = result === 'draw';
    if (result === 'win') {
      showFloat('WIN! ✖', W / 2, H * 0.4, GREEN);
      onRoundComplete?.();
      roundWins++;
      statusTxt.text = 'You win!';
      (statusTxt.style as { fill: number }).fill = GREEN;
    } else if (result === 'lose') {
      showFloat('LOSE! ⭕', W / 2, H * 0.4, RED);
      triggerFlash(0.45, 0.4);
      onPlayerHit?.(ROUNDS[currentRound].damage);
      statusTxt.text = 'Enemy wins!';
      (statusTxt.style as { fill: number }).fill = RED;
    } else {
      showFloat('DRAW', W / 2, H * 0.4, ORANGE);
      statusTxt.text = 'Draw!';
      (statusTxt.style as { fill: number }).fill = ORANGE;
    }
  };

  // ── Input ────────────────────────────────────────────────────────────────
  const onTap = (e: { global: { x: number; y: number } }) => {
    if (phase !== 'playing' || !playerTurn) return;
    const gx = e.global.x - boardX;
    const gy = e.global.y - boardY;
    if (gx < 0 || gy < 0 || gx > boardSize || gy > boardSize) return;

    const col = Math.floor(gx / cellSize);
    const row = Math.floor(gy / cellSize);
    const idx = row * 3 + col;
    if (board[idx] !== 0) return;

    board[idx] = PLAYER;
    drawX(cellGfxs[idx]);
    playerTurn = false;

    const result = checkResult(board);
    if (result !== null) {
      if (result === PLAYER) { const wl = findWinLine(board); if (wl) drawWinLine(wl); endRound('win'); }
      else if (result === AI) endRound('lose');
      else                    endRound('draw');
      return;
    }
    statusTxt.text = 'Enemy thinking…';
    (statusTxt.style as { fill: number }).fill = TEAL;
    aiThinkTimer = 0.4 + Math.random() * 0.4;
  };

  app.stage.eventMode = 'static';
  app.stage.on('pointerdown', onTap);

  // ── Tick ─────────────────────────────────────────────────────────────────
  const tick = ({ deltaMS }: { deltaMS: number }) => {
    if (destroyed) return;
    const dt = deltaMS / 1000;

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
    }

    if (phase === 'playing' && !playerTurn && aiThinkTimer > 0) {
      aiThinkTimer -= dt;
      if (aiThinkTimer <= 0) {
        const move = getAiMove(board, ROUNDS[currentRound].difficulty);
        if (move >= 0) {
          board[move] = AI;
          drawO(cellGfxs[move]);
          const result = checkResult(board);
          if (result !== null) {
            if (result === AI)     { const wl = findWinLine(board); if (wl) drawWinLine(wl); endRound('lose'); }
            else if (result === PLAYER) endRound('win');
            else                        endRound('draw');
          } else {
            playerTurn = true;
            statusTxt.text = 'Your turn ✖';
            (statusTxt.style as { fill: number }).fill = RED;
          }
        }
      }
    }

    if (phase === 'result') {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        // If draw — replay same round (no advance)
        if (lastResultWasDraw) {
          startRound(currentRound);
          return;
        }
        if (currentRound + 1 < ROUNDS.length) {
          // Between rounds: short gap then next
          phase = 'between';
          phaseTimer = 0.8;
        } else {
          // All done
          phase = 'done';
          overlayBg.visible = overlayTitle.visible = overlayStats.visible = true;
          const label = roundWins >= 2 ? '🏆 VICTORY!' : '💀 DEFEAT!';
          overlayTitle.text = label;
          overlayStats.text = `${roundWins}/3 rounds won`;
          setTimeout(() => { if (!destroyed) onEnd(); }, 2000);
        }
      }
    }

    if (phase === 'between') {
      phaseTimer -= dt;
      if (phaseTimer <= 0) startRound(currentRound + 1);
    }
  };

  app.ticker.add(tick);

  // ── Kick off ─────────────────────────────────────────────────────────────
  startRound(0);

  // ── Destroy ──────────────────────────────────────────────────────────────
  const destroy = () => {
    destroyed = true;
    app.ticker.remove(tick);
    for (const ft of floatTexts) ft.gfx.destroy();
    boardLayer.destroy({ children: true });
    vfxLayer.destroy({ children: true });
    hudLayer.destroy({ children: true });
    overlayLayer.destroy({ children: true });
    app.stage.off('pointerdown', onTap);
    app.stage.eventMode = 'auto';
  };

  return { destroy };
}
