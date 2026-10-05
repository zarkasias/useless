import { describe, expect, it } from "vitest";

import { getNextSpiderHint } from "@/lib/games/solitaire/spider/spider-hint";
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

// Reduced positions isolate hint choices.
// Kings fill unused columns to avoid introducing empty destinations.
function makeBoard(columns: GameCard[][]): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    completedRuns: [],
    tableau: Array.from(
      { length: 10 },
      (_, i) => columns[i] ?? [{ ...card("K", "hearts"), id: `filler-${i}` }],
    ),
  };
}

describe("Spider hints", () => {
  it("prefers completing a run over revealing a hidden card", () => {
    const almostComplete = (
      ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const
    ).map((rank) => card(rank, "spades"));

    const board = makeBoard([
      almostComplete,
      [card("A", "spades")],
      [card("3", "hearts", false), card("7", "hearts")],
      [card("8", "hearts")],
    ]);
    const original = structuredClone(board);

    expect(getNextSpiderHint(board)).toMatchObject({
      type: "tableau-to-tableau",
      sourceColumnIndex: 1,
      cardIndex: 0,
      targetColumnIndex: 0,
    });

    expect(board).toEqual(original);
  });

  it("prefers revealing a hidden card over a same-suit join", () => {
    const board = makeBoard([
      [card("3", "hearts", false), card("7", "spades")],
      [card("8", "hearts")],
      [card("5", "spades")],
      [card("6", "spades")],
    ]);

    expect(getNextSpiderHint(board)).toMatchObject({
      type: "tableau-to-tableau",
      sourceColumnIndex: 0,
      cardIndex: 1,
      targetColumnIndex: 1,
    });
  });

  it("prefers a same-suit destination over a different suit", () => {
    const board = makeBoard([
      [card("7", "spades")],
      [card("8", "hearts")],
      [card("8", "spades")],
    ]);

    expect(getNextSpiderHint(board)).toMatchObject({
      type: "tableau-to-tableau",
      sourceColumnIndex: 0,
      cardIndex: 0,
      targetColumnIndex: 2,
    });
  });

  it("suggests a stock deal when no tableau hint is available", () => {
    const board = makeBoard([]);

    board.stock = Array.from({ length: 10 }, (_, i) => ({
      ...card("2", "spades", false),
      id: `stock-${i}`,
    }));

    expect(getNextSpiderHint(board)).toMatchObject({
      type: "deal-stock",
    });
  });

  it("does not suggest dealing when a column is empty", () => {
    const board = makeBoard([[]]);

    board.stock = Array.from({ length: 10 }, (_, i) => ({
      ...card("2", "spades", false),
      id: `stock-${i}`,
    }));

    expect(getNextSpiderHint(board)).toBeNull();
  });

  it("can return no hint even though a legal relocation exists", () => {
    const board = makeBoard([[card("K", "spades")], []]);

    expect(getTableauCardDestinations(board, 0, 0)).toContain(1);
    expect(getNextSpiderHint(board)).toBeNull();
  });
});
