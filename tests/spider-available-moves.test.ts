import { describe, expect, it } from "vitest";

import { getTableauCardDestinations } from "@/lib/games/solitaire/spider/spider-available-moves";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
): GameCard {
  return { id: `${suit}-${rank}`, rank, suit, faceUp };
}

// Reduced positions isolate destination detection.
// Aces fill unused columns so they aren't empty destinations.
function makeBoard(columns: GameCard[][]): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    completedRuns: [],
    tableau: Array.from(
      { length: 10 },
      (_, i) =>
        columns[i] ?? [
          {
            ...card("A", "hearts"),
            id: `filler-${i}`,
          },
        ],
    ),
  };
}

describe("Spider available moves", () => {
  it("finds every legal destination, regardless of target suit", () => {
    const board = makeBoard([
      [card("7", "spades"), card("6", "spades")],
      [card("8", "hearts")],
      [card("8", "spades")],
      [],
      [card("9", "hearts")],
    ]);
    const original = structuredClone(board);

    expect(getTableauCardDestinations(board, 0, 0)).toEqual([1, 2, 3]);
    expect(board).toEqual(original);
  });

  it("rejects a mixed-suit group", () => {
    const board = makeBoard([
      [card("7", "spades"), card("6", "hearts")],
      [card("8", "hearts")],
      [],
    ]);

    expect(getTableauCardDestinations(board, 0, 0)).toEqual([]);
  });

  it("allows the bottom card of a mixed-suit group to move alone", () => {
    const board = makeBoard([
      [card("7", "spades"), card("6", "hearts")],
      [card("7", "hearts")],
    ]);

    expect(getTableauCardDestinations(board, 0, 1)).toEqual([1]);
  });

  it("rejects a sequence containing a face-down card", () => {
    const board = makeBoard([
      [card("7", "spades", false), card("6", "spades")],
      [],
    ]);

    expect(getTableauCardDestinations(board, 0, 0)).toEqual([]);
  });

  it("returns no destinations when every target is blocked", () => {
    const board = makeBoard([[card("7", "spades")]]);

    expect(getTableauCardDestinations(board, 0, 0)).toEqual([]);
  });

  it.each([
    [-1, 0],
    [10, 0],
    [0, -1],
    [0, 1],
    [0.5, 0],
    [0, 0.5],
  ])("rejects invalid indexes (%s, %s)", (columnIndex, cardIndex) => {
    const board = makeBoard([[card("7", "spades")], []]);

    expect(getTableauCardDestinations(board, columnIndex, cardIndex)).toEqual(
      [],
    );
  });
});
