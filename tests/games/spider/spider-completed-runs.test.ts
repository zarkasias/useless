import { describe, expect, it } from "vitest";

import { collectCompletedRuns } from "@/lib/games/solitaire/spider/spider-completed-runs";
import {
  dealFromStock,
  moveTableauSequence,
} from "@/lib/games/solitaire/spider/spider-moves";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  copy = 0,
): GameCard {
  return {
    id: `${suit}-${rank}-${copy}`,
    rank,
    suit,
    faceUp: true,
  };
}

function makeRun(copy = 0): GameCard[] {
  return (
    ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"] as const
  ).map((rank) => card(rank, "spades", copy));
}

// Reduced positions isolate run collection.
function makeBoard(
  columns: GameCard[][],
  stock: GameCard[] = [],
): SpiderBoardState {
  return {
    difficulty: 2,
    tableau: Array.from({ length: 10 }, (_, i) => columns[i] ?? []),
    stock,
    completedRuns: [],
  };
}

describe("Spider completed runs", () => {
  it("collects a run and reveals the card underneath", () => {
    const hidden = { ...card("4", "hearts"), faceUp: false };
    const run = makeRun();
    const board = makeBoard([[hidden, ...run]]);
    const original = structuredClone(board);

    const next = collectCompletedRuns(board);

    expect(next.tableau[0]).toEqual([{ ...hidden, faceUp: true }]);
    expect(next.completedRuns).toEqual([{ suit: "spades", cards: run }]);
    expect(board).toEqual(original);
  });

  it("collects two stacked runs", () => {
    const upperRun = makeRun(0);
    const exposedRun = makeRun(1);
    const board = makeBoard([[...upperRun, ...exposedRun]]);

    const next = collectCompletedRuns(board);

    expect(next.tableau[0]).toEqual([]);
    expect(next.completedRuns).toEqual([
      { suit: "spades", cards: exposedRun },
      { suit: "spades", cards: upperRun },
    ]);
  });

  it("does not collect a mixed-suit King-to-Ace sequence", () => {
    const run = makeRun();
    run[12] = card("A", "hearts");
    const board = makeBoard([run]);

    expect(collectCompletedRuns(board)).toBe(board);
    expect(board.completedRuns).toEqual([]);
  });

  it("automatically collects a run completed by a tableau move", () => {
    const run = makeRun();
    const board = makeBoard([run.slice(0, 12), [run[12]]]);
    const original = structuredClone(board);

    const next = moveTableauSequence(board, 1, 0, 0);

    expect(next?.tableau[0]).toEqual([]);
    expect(next?.tableau[1]).toEqual([]);
    expect(next?.completedRuns).toEqual([{ suit: "spades", cards: run }]);
    expect(board).toEqual(original);
  });

  it("automatically collects a run completed by a stock deal", () => {
    const run = makeRun();
    const columns = [
      run.slice(0, 12),
      ...Array.from({ length: 9 }, (_, i) => [card("5", "hearts", i)]),
    ];
    const stock = [
      { ...run[12], faceUp: false },
      ...Array.from({ length: 9 }, (_, i) => ({
        ...card("9", "hearts", i),
        faceUp: false,
      })),
    ];
    const board = makeBoard(columns, stock);
    const original = structuredClone(board);

    const next = dealFromStock(board);

    expect(next?.stock).toEqual([]);
    expect(next?.tableau[0]).toEqual([]);
    expect(next?.completedRuns).toEqual([{ suit: "spades", cards: run }]);

    for (let i = 1; i < 10; i++) {
      expect(next?.tableau[i]).toEqual([
        ...columns[i],
        { ...stock[i], faceUp: true },
      ]);
    }

    expect(board).toEqual(original);
  });
});
