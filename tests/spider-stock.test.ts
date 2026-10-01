import { describe, expect, it } from "vitest";

import { createSpiderDeck } from "@/lib/games/solitaire/spider/spider-deck";
import { createSpiderBoard } from "@/lib/games/solitaire/spider/spider-setup";
import { dealFromStock } from "@/lib/games/solitaire/spider/spider-moves";
import { validateSpiderBoard } from "@/lib/games/solitaire/spider/spider-validator";

function makeBoard(difficulty: 1 | 2 | 4 = 1) {
  return createSpiderBoard(createSpiderDeck(difficulty), difficulty);
}

describe("Spider stock deals", () => {
  it.each([1, 2, 4] as const)(
    "deals one face-up card per column for %i suit(s)",
    (difficulty) => {
      const board = makeBoard(difficulty);
      const original = structuredClone(board);

      const next = dealFromStock(board);

      expect(next).not.toBeNull();

      if (!next) {
        throw new Error("Expected stock deal to succeed");
      }

      expect(next.stock).toEqual(board.stock.slice(10));

      for (let i = 0; i < 10; i++) {
        expect(next.tableau[i]).toEqual([
          ...board.tableau[i],
          { ...board.stock[i], faceUp: true },
        ]);
      }

      expect(validateSpiderBoard(next)).toBe(true);
      expect(board).toEqual(original);
    },
  );

  it("rejects a deal when a column is empty", () => {
    const board = makeBoard();

    // Relocate the column's cards to preserve the full deck.
    board.tableau[1] = [...board.tableau[0], ...board.tableau[1]];
    board.tableau[0] = [];

    const original = structuredClone(board);

    expect(dealFromStock(board)).toBeNull();
    expect(board).toEqual(original);
  });

  it.each([0, 9])(
    "rejects a deal when only %i stock cards remain",
    (remaining) => {
      const board = makeBoard();

      // Reduced stock isolates the insufficient-cards check.
      board.stock = board.stock.slice(0, remaining);

      const original = structuredClone(board);

      expect(dealFromStock(board)).toBeNull();
      expect(board).toEqual(original);
    },
  );
});
