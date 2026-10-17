// @vitest-environment jsdom

import { act, createElement, useState, type DragEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSpiderInteractions } from "@/components/games/solitaire/spider/use-spider-interactions";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
  id = `${suit}-${rank}`,
): GameCard {
  return { id, rank, suit, faceUp };
}

// Reduced positions isolate interactions rather than deck validation.
function board(): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    completedRuns: [],
    tableau: [
      [card("7", "spades")],
      [card("8", "hearts")],
      ...Array.from({ length: 8 }, () => []),
    ],
  };
}

function dragEvent<T extends HTMLElement>(): DragEvent<T> {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      effectAllowed: "none",
      dropEffect: "none",
      setData: vi.fn(),
    },
  } as unknown as DragEvent<T>;
}

function setup(initialBoard = board()) {
  let current!: {
    board: SpiderBoardState;
    interactions: ReturnType<typeof useSpiderInteractions>;
  };

  function Harness() {
    const [position, setBoard] = useState<SpiderBoardState | null>(
      initialBoard,
    );

    if (!position) throw new Error("Unexpected null board");

    const interactions = useSpiderInteractions({
      board: position,
      setBoard,
    });

    current = { board: position, interactions };
    return null;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(Harness)));

  return {
    current: () => current,
    action: (
      callback: (i: ReturnType<typeof useSpiderInteractions>) => void,
    ) => {
      act(() => callback(current.interactions));
    },
  };
}

describe("Spider click interactions", () => {
  it("selects and deselects the same card without counting a move", () => {
    const h = setup();

    h.action((i) => i.handleTableauCardClick(0, 0));
    expect(h.current().interactions.selectedTableauCard).toEqual({
      columnIndex: 0,
      cardIndex: 0,
    });
    expect(h.current().interactions.isValidTableauTarget(0)).toBe(false);
    expect(h.current().interactions.isValidTableauTarget(1)).toBe(true);
    expect(h.current().interactions.isValidTableauTarget(99)).toBe(false);

    h.action((i) => i.handleTableauCardClick(0, 0));

    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.hasStarted).toBe(false);
  });

  it.each([
    { column: 99, index: 0 },
    { column: 0, index: -1 },
    { column: 0, index: 99 },
  ])("ignores an invalid selection $column/$index", ({ column, index }) => {
    const h = setup();

    h.action((i) => i.handleTableauCardClick(column, index));

    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("rejects selecting a hidden card or mixed-suit sequence", () => {
    const position = board();
    position.tableau[0] = [
      card("9", "spades", false),
      card("7", "spades"),
      card("6", "hearts"),
    ];
    const h = setup(position);

    h.action((i) => i.handleTableauCardClick(0, 0));
    h.action((i) => i.handleTableauCardClick(0, 1));

    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().board).toBe(position);
  });

  it("moves a selected card, counts the move, and supports undo", () => {
    const position = board();
    const h = setup(position);

    h.action((i) => i.handleTableauCardClick(0, 0));
    h.action((i) => i.handleTableauCardClick(1, 0));

    expect(h.current().board.tableau[0]).toEqual([]);
    expect(h.current().board.tableau[1].map((c) => c.rank)).toEqual(["8", "7"]);
    expect(h.current().interactions.moveCount).toBe(1);
    expect(h.current().interactions.hasStarted).toBe(true);
    expect(h.current().interactions.canUndo).toBe(true);
    expect(h.current().interactions.selectedTableauCard).toBeNull();

    h.action((i) => i.handleUndo());

    expect(h.current().board).toEqual(position);
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.canUndo).toBe(false);

    h.action((i) => i.handleUndo());
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("preserves the selection and board after an illegal move", () => {
    const position = board();
    position.tableau[1] = [card("9", "hearts")];
    const h = setup(position);

    h.action((i) => i.handleTableauClick(1));
    h.action((i) => i.handleTableauCardClick(0, 0));
    h.action((i) => i.handleTableauClick(1));

    expect(h.current().board).toBe(position);
    expect(h.current().interactions.selectedTableauCard).toEqual({
      columnIndex: 0,
      cardIndex: 0,
    });
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.canUndo).toBe(false);
  });

  it("rejects a null move without creating history", () => {
    const h = setup();

    h.action((i) => {
      expect(i.applyMove(null)).toBe(false);
    });

    expect(h.current().interactions.canUndo).toBe(false);
    expect(h.current().interactions.hasStarted).toBe(false);
  });
});

describe("Spider dragging", () => {
  it("drags a card onto a valid target and clears drag state", () => {
    const h = setup();
    const start = dragEvent<HTMLButtonElement>();

    h.action((i) => i.handleTableauCardClick(1, 0));
    h.action((i) => i.handleTableauDragStart(0, 0, start));

    expect(start.dataTransfer.setData).toHaveBeenCalledWith(
      "text/plain",
      "spider-card",
    );
    expect(start.dataTransfer.effectAllowed).toBe("move");
    expect(h.current().interactions.selectedTableauCard).toBeNull();

    const over = dragEvent<HTMLDivElement>();
    h.action((i) => i.handleTableauDragOver(1, over));
    expect(over.preventDefault).toHaveBeenCalledOnce();
    expect(over.dataTransfer.dropEffect).toBe("move");

    const invalidOver = dragEvent<HTMLDivElement>();
    h.action((i) => i.handleTableauDragOver(0, invalidOver));
    expect(invalidOver.dataTransfer.dropEffect).toBe("none");

    h.action((i) => i.handleTableauDrop(1, dragEvent<HTMLDivElement>()));

    expect(h.current().board.tableau[0]).toEqual([]);
    expect(h.current().interactions.moveCount).toBe(1);
    expect(h.current().interactions.isValidTableauTarget(2)).toBe(false);
  });

  it.each([
    { column: 99, index: 0 },
    { column: 0, index: -1 },
    { column: 0, index: 0.5 },
    { column: 0, index: 99 },
  ])("prevents invalid drag start $column/$index", ({ column, index }) => {
    const h = setup();
    const event = dragEvent<HTMLButtonElement>();

    h.action((i) => i.handleTableauDragStart(column, index, event));

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.dataTransfer.setData).not.toHaveBeenCalled();
  });

  it("ignores drag-over and drops without an active drag", () => {
    const position = board();
    const h = setup(position);
    const over = dragEvent<HTMLDivElement>();

    h.action((i) => i.handleTableauDragOver(1, over));
    expect(over.preventDefault).not.toHaveBeenCalled();

    h.action((i) => i.handleTableauDrop(1, dragEvent<HTMLDivElement>()));
    expect(h.current().board).toBe(position);
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("cancels a drag without moving cards", () => {
    const position = board();
    const h = setup(position);

    h.action((i) =>
      i.handleTableauDragStart(0, 0, dragEvent<HTMLButtonElement>()),
    );
    h.action((i) => i.handleDragEnd());
    h.action((i) => i.handleTableauDrop(1, dragEvent<HTMLDivElement>()));

    expect(h.current().board).toBe(position);
    expect(h.current().interactions.canUndo).toBe(false);
  });

  it("does not count an illegal drop as a move", () => {
    const position = board();
    const h = setup(position);

    h.action((i) =>
      i.handleTableauDragStart(0, 0, dragEvent<HTMLButtonElement>()),
    );
    h.action((i) => i.handleTableauDrop(0, dragEvent<HTMLDivElement>()));

    expect(h.current().board).toBe(position);
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.isValidTableauTarget(1)).toBe(false);
  });
});

describe("Spider stock and timer", () => {
  it("deals ten cards and restores the exact board on undo", () => {
    const position = board();
    position.stock = Array.from({ length: 10 }, (_, index) =>
      card(index === 0 ? "4" : "3", "spades", false, `stock-${index}`),
    );
    const h = setup(position);

    expect(h.current().interactions.canDeal).toBe(true);
    h.action((i) => i.handleStockClick());

    expect(h.current().board.stock).toEqual([]);
    expect(h.current().board.tableau.map((column) => column.length)).toEqual([
      2, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
    expect(
      h.current().board.tableau.every((column) => column.at(-1)?.faceUp),
    ).toBe(true);
    expect(h.current().interactions.moveCount).toBe(1);
    expect(h.current().interactions.isStalemate).toBe(false);
    expect(h.current().interactions.canUndo).toBe(true);

    h.action((i) => i.handleUndo());
    expect(h.current().board).toEqual(position);
  });

  it("ignores stock clicks when no deal is available", () => {
    const position = board();
    const h = setup(position);

    h.action((i) => i.handleStockClick());

    expect(h.current().board).toBe(position);
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("starts the timer after a move and reset clears history and timing", () => {
    vi.useFakeTimers();
    const h = setup();

    act(() => vi.advanceTimersByTime(2000));
    expect(h.current().interactions.elapsedSeconds).toBe(0);

    h.action((i) => i.handleTableauCardClick(0, 0));
    h.action((i) => i.handleTableauClick(1));
    act(() => vi.advanceTimersByTime(3000));
    expect(h.current().interactions.elapsedSeconds).toBe(3);

    h.action((i) =>
      i.handleTableauDragStart(1, 0, dragEvent<HTMLButtonElement>()),
    );
    h.action((i) => i.resetInteractions());

    expect(h.current().interactions).toMatchObject({
      moveCount: 0,
      elapsedSeconds: 0,
      hasStarted: false,
      canUndo: false,
      selectedTableauCard: null,
    });
    expect(h.current().interactions.isValidTableauTarget(2)).toBe(false);

    act(() => vi.advanceTimersByTime(3000));
    expect(h.current().interactions.elapsedSeconds).toBe(0);
  });

  it("stops timing and disables undo when a position becomes blocked", () => {
    vi.useFakeTimers();
    const h = setup();

    h.action((i) => i.handleTableauCardClick(0, 0));
    h.action((i) => i.handleTableauClick(1));
    act(() => vi.advanceTimersByTime(2000));

    const blocked = board();
    blocked.tableau = Array.from({ length: 10 }, (_, index) => [
      card("A", "spades", true, `blocked-${index}`),
    ]);

    h.action((i) => {
      expect(i.applyMove(blocked)).toBe(true);
    });

    expect(h.current().interactions.isStalemate).toBe(true);
    expect(h.current().interactions.canUndo).toBe(false);

    act(() => vi.advanceTimersByTime(3000));
    expect(h.current().interactions.elapsedSeconds).toBe(2);
  });
});
