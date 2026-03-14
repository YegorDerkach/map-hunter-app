export interface MiniGame {
  destroy(): void;
  /** Arrow game only — trigger a directional hit from an external button. Returns true on hit, false on false press. */
  hitDirection?: (dir: 'left' | 'right' | 'up' | 'down') => boolean;
}

export interface MiniGameResult {
  playerHits: number;
  swordsCollected: number;
}

export type MiniGameEndCallback = (result: MiniGameResult) => void;

export interface MiniGameOptions {
  /** Called each time the player takes damage. Optional amount lets the game pass per-round damage values. */
  onPlayerHit?: (amount?: number) => void;
  /** Called when the player collects 5 swords and wins the round (e.g. deal 1/3 enemy HP). */
  onRoundComplete?: () => void;
  /** Called when round is a draw (e.g. deal damage to both player and enemy). */
  onDraw?: () => void;
  /** Called when player presses a button with no arrow to hit (false press). */
  onFalseHit?: () => void;
}
