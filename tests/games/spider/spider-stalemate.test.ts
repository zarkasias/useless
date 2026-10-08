import { describe, expect, it } from "vitest";

import { createSpiderDeck } from "@/lib/games/solitaire/spider/spider-deck";
import {
  hasAvailableSpiderMove,
  isSpiderStalemate,
} from "@/lib/games/solitaire/spider/spider-stalemate";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  id: string,
): GameCard {
  return { id, rank, suit, faceUp: true };
}

// Reduced positions isolate whether any legal action exists.
function blockedBoard(): SpiderBoardState {
  return {
    difficulty: 4,
    stock: [],
    completedRuns: [],
    tableau: Array.from({ length: 10 }, (_, i) => [
      card("K", "spades", `king-${i}`),
    ]),
  };
}

describe("Spider stalemate detection", () => {
  it("detects a blocked board with no stock", () => {
    const board = blockedBoard();

    expect(hasAvailableSpiderMove(board)).toBe(false);
    expect(isSpiderStalemate(board)).toBe(true);
  });

  it("does not report stalemate when a stock deal is available", () => {
    const board = blockedBoard();

    board.stock = Array.from({ length: 10 }, (_, i) => ({
      ...card("2", "hearts", `stock-${i}`),
      faceUp: false,
    }));

    expect(hasAvailableSpiderMove(board)).toBe(true);
    expect(isSpiderStalemate(board)).toBe(false);
  });

  it("does not report stalemate when a tableau move is available", () => {
    const board = blockedBoard();

    board.tableau[0] = [card("7", "spades", "moving-seven")];
    board.tableau[1] = [card("8", "hearts", "target-eight")];

    expect(hasAvailableSpiderMove(board)).toBe(true);
    expect(isSpiderStalemate(board)).toBe(false);
  });

  it("counts relocating a whole column into an empty column", () => {
    const board = blockedBoard();
    board.tableau[1] = [];

    expect(hasAvailableSpiderMove(board)).toBe(true);
    expect(isSpiderStalemate(board)).toBe(false);
  });

  it("does not confuse a completed game with stalemate", () => {
    const deck = createSpiderDeck(1);

    const board: SpiderBoardState = {
      difficulty: 1,
      stock: [],
      tableau: Array.from({ length: 10 }, () => []),
      completedRuns: Array.from({ length: 8 }, (_, i) => ({
        suit: "spades",
        cards: deck
          .slice(i * 13, (i + 1) * 13)
          .reverse()
          .map((card) => ({ ...card, faceUp: true })),
      })),
    };

    expect(hasAvailableSpiderMove(board)).toBe(false);
    expect(isSpiderStalemate(board)).toBe(false);
  });
});
