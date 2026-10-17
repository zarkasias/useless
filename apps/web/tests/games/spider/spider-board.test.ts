// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";

const mocks = vi.hoisted(() => ({
  pile: vi.fn(),
  column: vi.fn(),
}));

vi.mock("@/components/games/solitaire/shared/card-pile", () => ({
  CardPile: (props: unknown) => {
    mocks.pile(props);
    return null;
  },
}));

vi.mock("@/components/games/solitaire/shared/card-column", () => ({
  CardColumn: (props: unknown) => {
    mocks.column(props);
    return null;
  },
}));

import { SpiderBoard } from "@/components/games/solitaire/spider/spider-board";

type Props = Parameters<typeof SpiderBoard>[0];
type PileProps = Parameters<
  typeof import("@/components/games/solitaire/shared/card-pile").CardPile
>[0];
type ColumnProps = Parameters<
  typeof import("@/components/games/solitaire/shared/card-column").CardColumn
>[0];

const king: GameCard = {
  id: "spades-K",
  suit: "spades",
  rank: "K",
  faceUp: true,
};

function makeInteractions() {
  return {
    canDeal: true,
    selectedTableauCard: null as {
      columnIndex: number;
      cardIndex: number;
    } | null,
    handleStockClick: vi.fn(),
    handleTableauClick: vi.fn(),
    handleTableauCardClick: vi.fn(),
    isValidTableauTarget: vi.fn(() => false),
    handleTableauDragStart: vi.fn(),
    handleTableauDragOver: vi.fn(),
    handleTableauDrop: vi.fn(),
    handleDragEnd: vi.fn(),
  };
}

let interactions: ReturnType<typeof makeInteractions>;
let board: Props["board"];

beforeEach(() => {
  vi.clearAllMocks();
  interactions = makeInteractions();
  board = {
    difficulty: 1,
    stock: [{ ...king, id: "stock-K", faceUp: false }],
    completedRuns: [],
    tableau: [[king], []],
  };
});

function render(hint: Props["hint"] = null) {
  renderToStaticMarkup(
    createElement(SpiderBoard, {
      board,
      interactions: interactions as unknown as Props["interactions"],
      hint,
    }),
  );
}

function pile(label: string): PileProps {
  const call = mocks.pile.mock.calls.find(([props]) => props.label === label);
  if (!call) throw new Error(`Missing pile: ${label}`);
  return call[0] as PileProps;
}

function column(index: number): ColumnProps {
  const call = mocks.column.mock.calls[index];
  if (!call) throw new Error(`Missing column: ${index}`);
  return call[0] as ColumnProps;
}

describe("SpiderBoard", () => {
  it("renders eight empty completed-run piles", () => {
    render();

    for (let index = 1; index <= 8; index++) {
      expect(pile(`Run ${index}`).card).toBeNull();
    }
    expect(mocks.pile).toHaveBeenCalledTimes(9);
  });

  it("shows the first card of a completed run", () => {
    board.completedRuns = [
      {
        suit: "spades",
        cards: [king, { ...king, id: "spades-Q", rank: "Q" }],
      },
    ];

    render();

    expect(pile("Run 1").card).toBe(king);
    expect(pile("Run 2").card).toBeNull();
  });

  it("shows the stock face down and forwards the deal handler", () => {
    render();

    expect(pile("Stock").card).toBe(board.stock[0]);
    expect(pile("Stock").faceDown).toBe(true);
    expect(pile("Stock").onClick).toBe(interactions.handleStockClick);

    pile("Stock").onClick?.();

    expect(interactions.handleStockClick).toHaveBeenCalledTimes(1);
  });

  it("disables stock interaction when dealing is unavailable", () => {
    interactions.canDeal = false;
    board.stock = [];

    render();

    expect(pile("Stock").card).toBeNull();
    expect(pile("Stock").onClick).toBeUndefined();
  });

  it("highlights stock for a deal hint", () => {
    render({ type: "deal-stock", reason: "Deal another row" });

    expect(pile("Stock").isHint).toBe(true);
    expect(column(0).hintCardIndex).toBeNull();
    expect(column(0).hintTarget).toBe(false);
  });

  it("highlights the source card and target column for a move hint", () => {
    render({
      type: "tableau-to-tableau",
      sourceColumnIndex: 0,
      cardIndex: 0,
      targetColumnIndex: 1,
      reason: "Build a sequence",
    });

    expect(pile("Stock").isHint).toBe(false);
    expect(column(0).hintCardIndex).toBe(0);
    expect(column(1).hintCardIndex).toBeNull();
    expect(column(0).hintTarget).toBe(false);
    expect(column(1).hintTarget).toBe(true);
  });

  it("forwards selected card indexes and valid targets", () => {
    interactions.selectedTableauCard = { columnIndex: 0, cardIndex: 0 };
    interactions.isValidTableauTarget.mockImplementation(
      (index?: number) => index === 1,
    );

    render();

    expect(column(0).selectedCardIndex).toBe(0);
    expect(column(1).selectedCardIndex).toBeNull();
    expect(column(0).validTarget).toBe(false);
    expect(column(1).validTarget).toBe(true);
  });

  it("uses the minimum height for short columns and expands long columns", () => {
    board.tableau = [
      [],
      Array.from({ length: 12 }, (_, index) => ({
        ...king,
        id: `card-${index}`,
      })),
    ];

    render();

    expect(column(0).minHeight).toBe(340);
    expect(column(1).minHeight).toBe(404);
    expect(column(1).cardOffset).toBe(28);
  });

  it("forwards column and card click indexes", () => {
    render();

    column(1).onColumnClick?.();
    column(1).onCardClick?.(2);

    expect(interactions.handleTableauClick).toHaveBeenCalledExactlyOnceWith(1);
    expect(interactions.handleTableauCardClick).toHaveBeenCalledExactlyOnceWith(
      1,
      2,
    );
  });

  it("forwards drag indexes and the drag-end handler", () => {
    render();

    const event = {} as Parameters<
      NonNullable<ColumnProps["onCardDragStart"]>
    >[1];
    const overEvent = {} as Parameters<
      NonNullable<ColumnProps["onDragOver"]>
    >[0];

    column(1).onCardDragStart?.(2, event);
    column(1).onDragOver?.(overEvent);
    column(1).onDrop?.(overEvent);

    expect(interactions.handleTableauDragStart).toHaveBeenCalledWith(
      1,
      2,
      event,
    );
    expect(interactions.handleTableauDragOver).toHaveBeenCalledWith(
      1,
      overEvent,
    );
    expect(interactions.handleTableauDrop).toHaveBeenCalledWith(1, overEvent);
    expect(column(1).onDragEnd).toBe(interactions.handleDragEnd);
  });
});
