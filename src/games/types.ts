export interface MiniGame {
  destroy(): void;
}

export interface MiniGameResult {
  playerHits: number;
  swordsCollected: number;
}

export type MiniGameEndCallback = (result: MiniGameResult) => void;
