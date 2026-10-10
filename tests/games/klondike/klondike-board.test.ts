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

import { KlondikeBoard } from "@/components/games/solitaire/klondike/klondike-board";

type Props = Parameters<typeof KlondikeBoard>[0];
type PileProps = Parameters<
  typeof import("@/components/games/solitaire/shared/card-pile").CardPile
>[0];
type ColumnProps = Parameters<
  typeof import("@/components/games/solitaire/shared/card-column").CardColumn
>[0];

const ace: GameCard = {
  id: "hearts-A",
  suit: "hearts",
  rank: "A",
  faceUp: true,
};
const waste: GameCard = {
  id: "clubs-7",
  suit: "clubs",
  rank: "7",
  faceUp: true,
};

function makeInteractions() {
  return {
    selectedCardId: null as string | null,
    selectedTableauCard: null as {
      columnIndex: number;
      cardIndex: number;
    } | null,
    selectedFoundationIndex: null as number | null,
    flippedCardId: null as string | null,
    setSelectedCardId: vi.fn(),
    setSelectedTableauCard: vi.fn(),
    setSelectedFoundationIndex: vi.fn(),
    handleDragEnd: vi.fn(),
    handleStockClick: vi.fn(),
    handleTableauClick: vi.fn(),
    handleFoundationClick: vi.fn(),
    handleTableauCardClick: vi.fn(),
    isValidTableauTarget: vi.fn(() => false),
    isValidFoundationTarget: vi.fn(() => false),
    handleTableauDragOver: vi.fn(),
    handleTableauDragStart: vi.fn(),
    handleTableauDrop: vi.fn(),
    handleWasteDragStart: vi.fn(),
    handleFoundationDragOver: vi.fn(),
    handleFoundationDragStart: vi.fn(),
    handleFoundationDrop: vi.fn(),
  };
}

let interactions: ReturnType<typeof makeInteractions>;
let board: Props["board"];

beforeEach(() => {
  vi.clearAllMocks();
  interactions = makeInteractions();
  board = {
    stock: [{ ...ace, id: "stock-A", faceUp: false }],
    waste: [waste],
    foundations: [
      { suit: "hearts", cards: [ace] },
      { suit: "spades", cards: [] },
    ],
    tableau: [[waste], []],
  };
});

function render(overrides: Partial<Props> = {}) {
  renderToStaticMarkup(
    createElement(KlondikeBoard, {
      board,
      interactions: interactions as unknown as Props["interactions"],
      autoFinishCardId: null,
      hint: null,
      ...overrides,
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

describe("KlondikeBoard", () => {
  it("passes top cards and stock behavior to the piles", () => {
    render();

    expect(pile("hearts").card).toBe(ace);
    expect(pile("spades").card).toBeNull();
    expect(pile("Waste").card).toBe(waste);
    expect(pile("Stock").card).toBe(board.stock[0]);
    expect(pile("Stock").faceDown).toBe(true);

    pile("Stock").onClick?.();
    expect(interactions.handleStockClick).toHaveBeenCalledTimes(1);
  });

  it("selects a waste card and clears other selections", () => {
    render();
    pile("Waste").onClick?.();

    expect(interactions.setSelectedCardId).toHaveBeenCalledWith(waste.id);
    expect(interactions.setSelectedTableauCard).toHaveBeenCalledWith(null);
    expect(interactions.setSelectedFoundationIndex).toHaveBeenCalledWith(null);
  });

  it("deselects an already selected waste card", () => {
    interactions.selectedCardId = waste.id;
    render();

    expect(pile("Waste").selected).toBe(true);
    pile("Waste").onClick?.();

    expect(interactions.setSelectedCardId).toHaveBeenCalledWith(null);
  });

  it("ignores clicks on an empty waste pile", () => {
    board.waste = [];
    render();
    pile("Waste").onClick?.();

    expect(interactions.setSelectedCardId).not.toHaveBeenCalled();
    expect(interactions.setSelectedTableauCard).not.toHaveBeenCalled();
    expect(interactions.setSelectedFoundationIndex).not.toHaveBeenCalled();
  });

  it("selects a populated foundation and clears other selections", () => {
    render();
    pile("hearts").onClick?.();

    expect(interactions.setSelectedFoundationIndex).toHaveBeenCalledWith(0);
    expect(interactions.setSelectedCardId).toHaveBeenCalledWith(null);
    expect(interactions.setSelectedTableauCard).toHaveBeenCalledWith(null);
  });

  it("deselects an already selected foundation", () => {
    interactions.selectedFoundationIndex = 0;
    render();

    expect(pile("hearts").selected).toBe(true);
    pile("hearts").onClick?.();

    expect(interactions.setSelectedFoundationIndex).toHaveBeenCalledWith(null);
  });

  it("delegates an empty foundation click to the move handler", () => {
    render();
    pile("spades").onClick?.();

    expect(interactions.handleFoundationClick).toHaveBeenCalledWith(1);
    expect(interactions.setSelectedFoundationIndex).not.toHaveBeenCalled();
  });

  it.each(["waste", "tableau"])(
    "delegates foundation clicks when a %s card is selected",
    (source) => {
      if (source === "waste") {
        interactions.selectedCardId = waste.id;
      } else {
        interactions.selectedTableauCard = { columnIndex: 0, cardIndex: 0 };
      }

      render();
      pile("hearts").onClick?.();

      expect(interactions.handleFoundationClick).toHaveBeenCalledWith(0);
      expect(interactions.setSelectedFoundationIndex).not.toHaveBeenCalled();
    },
  );

  it("forwards selected tableau indexes and animation flags", () => {
    interactions.selectedTableauCard = { columnIndex: 0, cardIndex: 0 };
    interactions.flippedCardId = waste.id;
    interactions.isValidTableauTarget.mockReturnValue(true);
    render({ autoFinishCardId: ace.id });

    expect(column(0).selectedCardIndex).toBe(0);
    expect(column(1).selectedCardIndex).toBeNull();
    expect(column(0).validTarget).toBe(true);
    expect(column(0).flippedCardId).toBe(waste.id);
    expect(column(0).autoFinishCardId).toBe(ace.id);
    expect(pile("Waste").animateFlip).toBe(true);
  });

  it("forwards tableau click and drag indexes", () => {
    render();

    column(1).onColumnClick?.();
    column(1).onCardClick?.(2);

    const dragEvent = {} as Parameters<
      NonNullable<ColumnProps["onCardDragStart"]>
    >[1];
    const dropEvent = {} as Parameters<NonNullable<ColumnProps["onDrop"]>>[0];

    column(1).onCardDragStart?.(2, dragEvent);
    column(1).onDrop?.(dropEvent);

    expect(interactions.handleTableauClick).toHaveBeenCalledWith(1);
    expect(interactions.handleTableauCardClick).toHaveBeenCalledWith(1, 2);
    expect(interactions.handleTableauDragStart).toHaveBeenCalledWith(
      1,
      2,
      dragEvent,
    );
    expect(interactions.handleTableauDrop).toHaveBeenCalledWith(1, dropEvent);
  });

  it("forwards foundation drag indexes and shared event handlers", () => {
    render();

    const event = {} as Parameters<NonNullable<PileProps["onDragStart"]>>[0];

    pile("hearts").onDragStart?.(event);
    pile("hearts").onDrop?.(event);

    expect(interactions.handleFoundationDragStart).toHaveBeenCalledWith(
      0,
      event,
    );
    expect(interactions.handleFoundationDrop).toHaveBeenCalledWith(0, event);
    expect(pile("hearts").onDragOver).toBe(
      interactions.handleFoundationDragOver,
    );
    expect(pile("Waste").onDragStart).toBe(interactions.handleWasteDragStart);
    expect(column(0).onDragEnd).toBe(interactions.handleDragEnd);
    expect(column(0).onDragOver).toBe(interactions.handleTableauDragOver);
  });
});

describe("KlondikeBoard hints", () => {
  it("highlights the stock for a stock hint", () => {
    render({ hint: { type: "stock" } });

    expect(pile("Stock").isHint).toBe(true);
    expect(pile("Waste").isHint).toBe(false);
    expect(column(0).hintCardIndex).toBeNull();
    expect(column(1).hintTarget).toBe(false);
  });

  it("highlights the waste and destination tableau column", () => {
    render({
      hint: {
        type: "waste-to-tableau",
        targetColumnIndex: 1,
        cardId: waste.id,
      },
    });

    expect(pile("Waste").isHint).toBe(true);
    expect(pile("Stock").isHint).toBe(false);
    expect(column(0).hintTarget).toBe(false);
    expect(column(1).hintTarget).toBe(true);
    expect(column(0).hintCardIndex).toBeNull();
    expect(column(1).hintCardIndex).toBeNull();
  });

  it("highlights the source card and destination for a tableau move", () => {
    render({
      hint: {
        type: "tableau-to-tableau",
        sourceColumnIndex: 0,
        cardIndex: 0,
        targetColumnIndex: 1,
        cardId: waste.id,
      },
    });

    expect(column(0).hintCardIndex).toBe(0);
    expect(column(1).hintCardIndex).toBeNull();
    expect(column(0).hintTarget).toBe(false);
    expect(column(1).hintTarget).toBe(true);
    expect(pile("Waste").isHint).toBe(false);
  });

  it("highlights the foundation destination for a waste move", () => {
    const html = renderToStaticMarkup(
      createElement(KlondikeBoard, {
        board,
        interactions: interactions as unknown as Props["interactions"],
        autoFinishCardId: null,
        hint: {
          type: "waste-to-foundation",
          foundationIndex: 0,
          cardId: waste.id,
        },
      }),
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    expect(pile("Waste").isHint).toBe(true);
    expect(container.querySelectorAll(".ring-emerald-300")).toHaveLength(1);
    expect(column(0).hintCardIndex).toBeNull();
  });

  it("highlights the tableau source and foundation destination", () => {
    const html = renderToStaticMarkup(
      createElement(KlondikeBoard, {
        board,
        interactions: interactions as unknown as Props["interactions"],
        autoFinishCardId: null,
        hint: {
          type: "tableau-to-foundation",
          sourceColumnIndex: 0,
          cardIndex: 0,
          foundationIndex: 1,
          cardId: waste.id,
        },
      }),
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    expect(column(0).hintCardIndex).toBe(0);
    expect(column(1).hintCardIndex).toBeNull();
    expect(column(0).hintTarget).toBe(false);
    expect(column(1).hintTarget).toBe(false);
    expect(container.querySelectorAll(".ring-emerald-300")).toHaveLength(1);
  });

  it("does not highlight cards or targets when no move is available", () => {
    render({ hint: { type: "none" } });

    expect(pile("Stock").isHint).toBe(false);
    expect(pile("Waste").isHint).toBe(false);
    expect(column(0).hintCardIndex).toBeNull();
    expect(column(1).hintCardIndex).toBeNull();
    expect(column(0).hintTarget).toBe(false);
    expect(column(1).hintTarget).toBe(false);
  });
});
