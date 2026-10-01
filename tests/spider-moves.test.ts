import { describe, expect, it } from "vitest";

import { moveTableauSequence } from "@/lib/games/solitaire/spider/spider-moves";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
): GameCard {
  return { id: `${suit}-${rank}`, rank, suit, faceUp };
}

// Small positions isolate movement behavior without a full deck.
function makeBoard(columns: GameCard[][]): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    tableau: Array.from({ length: 10 }, (_, i) => columns[i] ?? []),

    completedRuns: [],
  };
}

describe("Spider tableau moves", () => {
  it("moves a same-suit group onto a different suit and reveals a card", () => {
    const hidden = card("3", "hearts", false);
    const seven = card("7", "spades");
    const six = card("6", "spades");
    const eight = card("8", "hearts");
    const board = makeBoard([[hidden, seven, six], [eight]]);
    const original = structuredClone(board);

    const next = moveTableauSequence(board, 0, 1, 1);

    expect(next).not.toBeNull();
    expect(next?.tableau[0]).toEqual([{ ...hidden, faceUp: true }]);
    expect(next?.tableau[1]).toEqual([eight, seven, six]);
    expect(board).toEqual(original);
  });

  it("allows a non-king group to move into an empty column", () => {
    const group = [card("7", "spades"), card("6", "spades")];
    const board = makeBoard([group, []]);

    const next = moveTableauSequence(board, 0, 0, 1);

    expect(next?.tableau[0]).toEqual([]);
    expect(next?.tableau[1]).toEqual(group);
  });

  it("rejects moving a mixed-suit group", () => {
    const board = makeBoard([
      [card("7", "spades"), card("6", "hearts")],
      [card("8", "hearts")],
    ]);

    expect(moveTableauSequence(board, 0, 0, 1)).toBeNull();
  });

  it("rejects a group with a gap in its ranks", () => {
    const board = makeBoard([[card("7", "spades"), card("5", "spades")], []]);

    expect(moveTableauSequence(board, 0, 0, 1)).toBeNull();
  });

  it("rejects moving a face-down card", () => {
    const board = makeBoard([[card("7", "spades", false)], []]);

    expect(moveTableauSequence(board, 0, 0, 1)).toBeNull();
  });

  it("rejects an incorrect destination rank", () => {
    const board = makeBoard([[card("7", "spades")], [card("9", "hearts")]]);

    expect(moveTableauSequence(board, 0, 0, 1)).toBeNull();
  });

  it("rejects placing a card onto a face-down card", () => {
    const board = makeBoard([
      [card("7", "spades")],
      [card("8", "hearts", false)],
    ]);

    expect(moveTableauSequence(board, 0, 0, 1)).toBeNull();
  });

  it("rejects moving within the same column", () => {
    const board = makeBoard([[card("7", "spades")]]);

    expect(moveTableauSequence(board, 0, 0, 0)).toBeNull();
  });

  it("rejects a negative card index", () => {
    const board = makeBoard([[card("7", "spades")], []]);

    expect(moveTableauSequence(board, 0, -1, 1)).toBeNull();
  });
});
