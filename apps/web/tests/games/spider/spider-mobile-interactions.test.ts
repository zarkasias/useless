// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { useSpiderMobileInteractions } from "@/components/games/solitaire/spider/use-spider-mobile-interactions";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function card(rank: GameCard["rank"], suit: GameCard["suit"]): GameCard {
  return { id: `${suit}-${rank}`, rank, suit, faceUp: true };
}

function makeBoard(twoDestinations = false): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    completedRuns: [],
    tableau: [
      [card("7", "spades")],
      [card("8", "hearts")],
      ...(twoDestinations ? [[card("8", "spades")]] : [[card("A", "spades")]]),
      ...Array.from({ length: 7 }, (_, i) => [
        { ...card("A", "hearts"), id: `filler-${i}` },
      ]),
    ],
  };
}

it("handles automatic moves, destination choices, cancellation, and board resets", () => {
  let board = makeBoard();
  let mobile!: ReturnType<typeof useSpiderMobileInteractions>;

  const container = document.createElement("div");
  const root = createRoot(container);

  const onMove = vi.fn((nextBoard: SpiderBoardState) => {
    board = nextBoard;
    root.render(createElement(Harness));
    return true;
  });

  function Harness() {
    mobile = useSpiderMobileInteractions({ board, onMove });
    return null;
  }

  try {
    act(() => root.render(createElement(Harness)));

    // One destination: move immediately.
    act(() => mobile.handleTableauCardTap(0, 0));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(board.tableau[0]).toEqual([]);
    expect(board.tableau[1].map((card) => card.rank)).toEqual(["8", "7"]);
    expect(mobile.pendingSource).toBeNull();

    // Two destinations: select and wait for a choice.
    board = makeBoard(true);
    onMove.mockClear();
    act(() => root.render(createElement(Harness)));
    act(() => mobile.handleTableauCardTap(0, 0));

    expect(onMove).not.toHaveBeenCalled();
    expect(mobile.pendingSource).toEqual({
      columnIndex: 0,
      cardIndex: 0,
    });
    expect(mobile.pendingDestinations).toEqual([1, 2]);

    // An invalid destination leaves the selection in place.
    act(() => {
      expect(mobile.handleDestinationTap(3)).toBe(false);
    });

    expect(onMove).not.toHaveBeenCalled();
    expect(mobile.pendingDestinations).toEqual([1, 2]);

    // Tapping the selected card cancels.
    act(() => mobile.handleTableauCardTap(0, 0));

    expect(mobile.pendingSource).toBeNull();
    expect(mobile.pendingDestinations).toEqual([]);

    // Select again and tap a card in a highlighted column.
    act(() => mobile.handleTableauCardTap(0, 0));
    act(() => mobile.handleTableauCardTap(2, 0));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(board.tableau[0]).toEqual([]);
    expect(board.tableau[2].map((card) => card.rank)).toEqual(["8", "7"]);
    expect(mobile.pendingSource).toBeNull();

    // Replacing the board invalidates a pending selection.
    board = makeBoard(true);
    onMove.mockClear();
    act(() => root.render(createElement(Harness)));
    act(() => mobile.handleTableauCardTap(0, 0));

    expect(mobile.pendingDestinations).toEqual([1, 2]);

    board = makeBoard();
    act(() => root.render(createElement(Harness)));

    expect(mobile.pendingSource).toBeNull();
    expect(mobile.pendingDestinations).toEqual([]);

    act(() => {
      expect(mobile.handleDestinationTap(1)).toBe(false);
    });

    expect(onMove).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
  }
});
