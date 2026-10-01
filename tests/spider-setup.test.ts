import { describe, expect, it } from "vitest";

import { createInitialBoard } from "@/components/games/solitaire/spider/spider-helper";
import { isSpiderComplete } from "@/lib/games/solitaire/spider/spider-state";

describe("Spider initial board", () => {
  it.each([1, 2, 4] as const)(
    "creates a valid starting board for %i suit(s)",
    (difficulty) => {
      const board = createInitialBoard(difficulty);
      const allCards = [...board.stock, ...board.tableau.flat()];

      expect(board.difficulty).toBe(difficulty);
      expect(allCards).toHaveLength(104);
      expect(new Set(allCards.map((card) => card.id)).size).toBe(104);

      expect(board.tableau.map((column) => column.length)).toEqual([
        6, 6, 6, 6, 5, 5, 5, 5, 5, 5,
      ]);

      expect(board.stock).toHaveLength(50);
      expect(board.stock.every((card) => !card.faceUp)).toBe(true);

      for (const column of board.tableau) {
        expect(column[column.length - 1].faceUp).toBe(true);
        expect(column.slice(0, -1).every((card) => !card.faceUp)).toBe(true);
      }

      const expectedSuits =
        difficulty === 1
          ? ["spades"]
          : difficulty === 2
            ? ["spades", "hearts"]
            : ["spades", "hearts", "clubs", "diamonds"];

      expect(new Set(allCards.map((card) => card.suit))).toEqual(
        new Set(expectedSuits),
      );

      for (const suit of expectedSuits) {
        const suitCards = allCards.filter((card) => card.suit === suit);

        expect(suitCards).toHaveLength(104 / difficulty);

        for (const rank of [
          "A",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "J",
          "Q",
          "K",
        ]) {
          expect(suitCards.filter((card) => card.rank === rank)).toHaveLength(
            8 / difficulty,
          );
        }
      }

      expect(board.completedRuns).toEqual([]);
      expect(isSpiderComplete(board)).toBe(false);
    },
  );
});
