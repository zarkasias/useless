import type { GameCard } from "@/lib/types/gamecards";

export type SpiderDifficulty = 1 | 2 | 4;

export interface SpiderCompletedRun {
  suit: GameCard["suit"];
  cards: GameCard[];
}

export interface SpiderBoardState {
  difficulty: SpiderDifficulty;
  stock: GameCard[];
  tableau: GameCard[][];
  completedRuns: SpiderCompletedRun[];
}

export interface SpiderMoveSource {
  columnIndex: number;
  cardIndex: number;
}

export interface SpiderMove {
  board: SpiderBoardState;
  source: SpiderMoveSource;
  targetColumnIndex: number;
  movedCardIds: string[];
}

export interface SpiderCompletedRunMove {
  board: SpiderBoardState;
  columnIndex: number;
  suit: GameCard["suit"];
  cardIds: string[];
}
