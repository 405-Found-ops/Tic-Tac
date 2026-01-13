
export type Player = 'X' | 'O' | null;

export enum GameMode {
  PVP = 'PVP',
  PVE = 'PVE'
}

export enum Difficulty {
  EASY = 'EASY',
  HARD = 'HARD'
}

export interface Move {
  player: 'X' | 'O';
  index: number;
  timestamp: number;
}

export interface GameState {
  board: Player[];
  isXNext: boolean;
  winner: Player | 'Draw';
  winningLine: number[] | null;
  scores: { X: number; O: number };
  history: Move[];
  gameMode: GameMode;
  difficulty: Difficulty;
}
