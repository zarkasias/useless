// @vitest-environment jsdom

import {
  act,
  createElement,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useKlondikeInteractions } from "@/components/games/solitaire/klondike/use-klondike-interactions";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import type { GameCard } from "@/lib/types/gamecards";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }

  container?.remove();
  root = undefined;
  container = undefined;
});

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
): GameCard {
  return {
    id: `${rank}-${suit}`,
    rank,
    suit,
    faceUp,
  };
}

function makeBoard(
  overrides: Partial<KlondikeBoardState> = {},
): KlondikeBoardState {
  return {
    stock: [],
    waste: [],
    foundations: [
      { suit: "hearts", cards: [] },
      { suit: "diamonds", cards: [] },
      { suit: "clubs", cards: [] },
      { suit: "spades", cards: [] },
    ],
    tableau: Array.from({ length: 7 }, () => []),
    ...overrides,
  };
}

function setup(initialBoard: KlondikeBoardState) {
  let current!: {
    board: KlondikeBoardState;
    interactions: ReturnType<typeof useKlondikeInteractions>;
    setComplete: Dispatch<SetStateAction<boolean>>;
  };

  function Harness() {
    const [board, setBoard] = useState<KlondikeBoardState | null>(initialBoard);
    const [complete, setComplete] = useState(false);

    if (!board) {
      throw new Error("Unexpected null board");
    }

    const interactions = useKlondikeInteractions({
      board,
      setBoard,
      isComplete: complete,
    });

    current = { board, interactions, setComplete };
    return null;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => root!.render(createElement(Harness)));

  return {
    current: () => current,
    click: (
      action: (
        interactions: ReturnType<typeof useKlondikeInteractions>,
      ) => void,
    ) => {
      act(() => action(current.interactions));
    },
  };
}

describe("Klondike click interactions", () => {
  it("selects a face-up card and deselects it on a second click", () => {
    const h = setup(makeBoard({ tableau: [[card("K", "hearts")]] }));

    h.click((i) => i.handleTableauCardClick(0, 0));
    expect(h.current().interactions.selectedTableauCard).toEqual({
      columnIndex: 0,
      cardIndex: 0,
    });

    h.click((i) => i.handleTableauCardClick(0, 0));
    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("ignores missing and face-down cards", () => {
    const board = makeBoard({
      tableau: [[card("K", "hearts", false)]],
    });
    const h = setup(board);

    h.click((i) => i.handleTableauCardClick(9, 0));
    h.click((i) => i.handleTableauCardClick(0, 0));

    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().board).toBe(board);
    expect(h.current().interactions.hasStarted).toBe(false);
  });

  it("moves a selected sequence and reveals the card underneath", () => {
    const hidden = card("9", "clubs", false);
    const queen = card("Q", "hearts");
    const jack = card("J", "clubs");
    const king = card("K", "spades");

    const board = makeBoard({
      tableau: [[hidden, queen, jack], [king]],
    });
    const h = setup(board);

    h.click((i) => i.handleTableauCardClick(0, 1));
    expect(h.current().interactions.isValidTableauTarget(1)).toBe(true);

    h.click((i) => i.handleTableauCardClick(1, 0));

    expect(h.current().board.tableau).toEqual([
      [{ ...hidden, faceUp: true }],
      [king, queen, jack],
    ]);
    expect(h.current().interactions.flippedCardId).toBe(hidden.id);
    expect(h.current().interactions.moveCount).toBe(1);
    expect(h.current().interactions.hasStarted).toBe(true);
    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(board.tableau[0][0].faceUp).toBe(false);
  });

  it("rejects an illegal tableau move without starting the game", () => {
    const board = makeBoard({
      tableau: [[card("Q", "hearts")], [card("K", "diamonds")]],
    });
    const h = setup(board);

    h.click((i) => i.handleTableauCardClick(0, 0));
    expect(h.current().interactions.isValidTableauTarget(1)).toBe(false);

    h.click((i) => i.handleTableauClick(1));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.hasStarted).toBe(false);
    expect(h.current().interactions.selectedTableauCard).toBeNull();
  });

  it("moves the selected waste card onto a tableau card", () => {
    const queen = card("Q", "hearts");
    const king = card("K", "clubs");
    const h = setup(makeBoard({ waste: [queen], tableau: [[king]] }));

    h.click((i) => i.setSelectedCardId(queen.id));
    expect(h.current().interactions.isValidTableauTarget(0)).toBe(true);

    h.click((i) => i.handleTableauCardClick(0, 0));

    expect(h.current().board.waste).toEqual([]);
    expect(h.current().board.tableau[0]).toEqual([king, queen]);
    expect(h.current().interactions.selectedCardId).toBeNull();
    expect(h.current().interactions.moveCount).toBe(1);
  });

  it("does not move an unselected waste card", () => {
    const board = makeBoard({
      waste: [card("A", "hearts")],
      tableau: [[card("2", "clubs")]],
    });
    const h = setup(board);

    h.click((i) => i.handleTableauClick(0));
    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("ignores tableau and foundation destinations when waste is empty", () => {
    const board = makeBoard();
    const h = setup(board);

    h.click((i) => i.handleTableauClick(0));
    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.isValidTableauTarget(0)).toBe(false);
    expect(h.current().interactions.isValidFoundationTarget(0)).toBe(false);
  });

  it("moves a selected waste ace to its foundation", () => {
    const ace = card("A", "hearts");
    const h = setup(makeBoard({ waste: [ace] }));

    h.click((i) => i.setSelectedCardId(ace.id));
    expect(h.current().interactions.isValidFoundationTarget(0)).toBe(true);

    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board.waste).toEqual([]);
    expect(h.current().board.foundations[0].cards).toEqual([ace]);
    expect(h.current().interactions.selectedCardId).toBeNull();
    expect(h.current().interactions.moveCount).toBe(1);
  });

  it("rejects a waste card that cannot enter the foundation", () => {
    const queen = card("Q", "hearts");
    const board = makeBoard({ waste: [queen] });
    const h = setup(board);

    h.click((i) => i.setSelectedCardId(queen.id));
    expect(h.current().interactions.isValidFoundationTarget(0)).toBe(false);

    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.selectedCardId).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("moves a tableau ace to foundation and reveals the next card", () => {
    const hidden = card("K", "clubs", false);
    const ace = card("A", "hearts");
    const h = setup(makeBoard({ tableau: [[hidden, ace]] }));

    h.click((i) => i.handleTableauCardClick(0, 1));
    expect(h.current().interactions.isValidFoundationTarget(0)).toBe(true);

    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board.foundations[0].cards).toEqual([ace]);
    expect(h.current().board.tableau[0]).toEqual([{ ...hidden, faceUp: true }]);
    expect(h.current().interactions.flippedCardId).toBe(hidden.id);
    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.moveCount).toBe(1);
  });

  it("rejects a tableau card that cannot enter the foundation", () => {
    const board = makeBoard({
      tableau: [[card("Q", "hearts")]],
    });
    const h = setup(board);

    h.click((i) => i.handleTableauCardClick(0, 0));
    h.click((i) => i.handleFoundationClick(0));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
  });

  it("moves a selected foundation card back onto the tableau", () => {
    const ace = card("A", "hearts");
    const two = card("2", "clubs");
    const board = makeBoard({ tableau: [[two]] });
    board.foundations[0].cards = [ace];
    const h = setup(board);

    h.click((i) => i.setSelectedFoundationIndex(0));
    expect(h.current().interactions.isValidTableauTarget(0)).toBe(true);
    expect(h.current().interactions.isValidFoundationTarget(1)).toBe(false);

    h.click((i) => i.handleTableauCardClick(0, 0));

    expect(h.current().board.foundations[0].cards).toEqual([]);
    expect(h.current().board.tableau[0]).toEqual([two, ace]);
    expect(h.current().interactions.selectedFoundationIndex).toBeNull();
    expect(h.current().interactions.moveCount).toBe(1);
  });

  it("clears foundation selection after an illegal tableau move", () => {
    const board = makeBoard();
    board.foundations[0].cards = [card("A", "hearts")];
    const h = setup(board);

    h.click((i) => i.setSelectedFoundationIndex(0));
    h.click((i) => i.handleTableauClick(0));

    expect(h.current().board).toBe(board);
    expect(h.current().interactions.selectedFoundationIndex).toBeNull();
    expect(h.current().interactions.moveCount).toBe(0);
  });
});

describe("Klondike stock, timer, and reset", () => {
  it("draws a face-up card, counts the move, and clears selections", () => {
    const drawn = card("K", "hearts", false);
    const h = setup(makeBoard({ stock: [drawn] }));

    h.click((i) => {
      i.setSelectedCardId("old-selection");
      i.setSelectedTableauCard({ columnIndex: 0, cardIndex: 0 });
      i.setSelectedFoundationIndex(0);
    });
    h.click((i) => i.handleStockClick());

    expect(h.current().board.stock).toEqual([]);
    expect(h.current().board.waste).toEqual([{ ...drawn, faceUp: true }]);
    expect(h.current().interactions.moveCount).toBe(1);
    expect(h.current().interactions.selectedCardId).toBeNull();
    expect(h.current().interactions.selectedTableauCard).toBeNull();
    expect(h.current().interactions.selectedFoundationIndex).toBeNull();
  });

  it("recycles waste in reverse order without counting a move", () => {
    const first = card("A", "hearts");
    const second = card("2", "clubs");
    const h = setup(makeBoard({ waste: [first, second] }));

    h.click((i) => i.handleStockClick());

    expect(h.current().board.waste).toEqual([]);
    expect(h.current().board.stock).toEqual([
      { ...second, faceUp: false },
      { ...first, faceUp: false },
    ]);
    expect(h.current().interactions.moveCount).toBe(0);
    expect(h.current().interactions.hasStarted).toBe(false);
  });

  it("starts timing after the first move and stops on completion", () => {
    vi.useFakeTimers();
    const h = setup(makeBoard({ stock: [card("K", "hearts", false)] }));

    act(() => vi.advanceTimersByTime(2_000));
    expect(h.current().interactions.elapsedSeconds).toBe(0);

    h.click((i) => i.handleStockClick());
    act(() => vi.advanceTimersByTime(3_000));
    expect(h.current().interactions.elapsedSeconds).toBe(3);

    act(() => h.current().setComplete(true));
    act(() => vi.advanceTimersByTime(5_000));
    expect(h.current().interactions.elapsedSeconds).toBe(3);
  });

  it("resets counters, selections, flip feedback, and the timer", () => {
    vi.useFakeTimers();
    const h = setup(makeBoard({ stock: [card("K", "hearts", false)] }));

    h.click((i) => i.handleStockClick());
    act(() => vi.advanceTimersByTime(2_000));

    h.click((i) => {
      i.setSelectedCardId("selected");
      i.setSelectedTableauCard({ columnIndex: 0, cardIndex: 0 });
      i.setSelectedFoundationIndex(0);
    });
    h.click((i) => i.resetInteractions());

    expect(h.current().interactions).toMatchObject({
      moveCount: 0,
      elapsedSeconds: 0,
      hasStarted: false,
      selectedCardId: null,
      selectedTableauCard: null,
      selectedFoundationIndex: null,
      dragSource: null,
      flippedCardId: null,
    });

    act(() => vi.advanceTimersByTime(3_000));
    expect(h.current().interactions.elapsedSeconds).toBe(0);
  });
});
