import { shuffleDeck } from "@/lib/games/solitaire/core/shuffle";
import { createSpiderDeck } from "@/lib/games/solitaire/spider/spider-deck";
import { createSpiderBoard } from "@/lib/games/solitaire/spider/spider-setup";
import { validateSpiderBoard } from "@/lib/games/solitaire/spider/spider-validator";

import type {
  SpiderBoardState,
  SpiderDifficulty,
} from "@/lib/games/solitaire/spider/spider-types";

export function createInitialBoard(
  difficulty: SpiderDifficulty = 1,
): SpiderBoardState {
  const deck = createSpiderDeck(difficulty);
  const shuffledDeck = shuffleDeck(deck);
  const board = createSpiderBoard(shuffledDeck, difficulty);

  if (!validateSpiderBoard(board)) {
    throw new Error("Invalid initial Spider board");
  }

  return board;
}
