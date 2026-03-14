export type { MiniGame, MiniGameEndCallback, MiniGameResult, MiniGameOptions } from './types';
export { createDodgeGame } from './dodge';   // Game 0 (non-boss)
export { createArrowGame } from './arrow';   // Game 1 (non-boss)
export { createPairsGame } from './pairs';   // Game 2 (non-boss)
export { createTicTacToeGame } from './tictactoe'; // Game 3 (boss only)
