// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useMobile: vi.fn(),
  motion: vi.fn(),
  card: vi.fn(),
  foundationTap: vi.fn(),
  wasteTap: vi.fn(),
  destinationTap: vi.fn(),
  tableauTap: vi.fn(),
  clear: vi.fn(),
  stockTap: vi.fn(),
  onMove: vi.fn(),
}));

vi.mock(
  "@/components/games/solitaire/klondike/use-klondike-mobile-interactions",
  () => ({
    useKlondikeMobileInteractions: mocks.useMobile,
  }),
);

vi.mock("@/components/games/solitaire/klondike/use-mobile-card-motion", () => ({
  useMobileCardMotion: mocks.motion,
}));

vi.mock("@/components/games/solitaire/shared/mobile-card", () => ({
  default: (props: unknown) => {
    mocks.card(props);
    return null;
  },
}));

import { KlondikeMobileBoard } from "@/components/games/solitaire/klondike/klondike-mobile-board";

type Props = Parameters<typeof KlondikeMobileBoard>[0];
type Source =
  | { type: "foundation"; foundationIndex: number }
  | { type: "waste" }
  | { type: "tableau"; columnIndex: number; cardIndex: number };

let board: Props["board"];
let container: HTMLDivElement | undefined;
let root: Root | undefined;

function state(
  pendingSource: Source | null = null,
  pendingDestinations: { type: "tableau"; columnIndex: number }[] = [],
) {
  return {
    pendingSource,
    pendingDestinations,
    handleFoundationTap: mocks.foundationTap,
    handleWasteTap: mocks.wasteTap,
    handleDestinationTap: mocks.destinationTap,
    handleTableauCardTap: mocks.tableauTap,
    clearPendingMove: mocks.clear,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
  mocks.useMobile.mockReturnValue(state());
  mocks.motion.mockReturnValue({ current: null });

  board = {
    stock: [{ id: "stock", suit: "clubs", rank: "K", faceUp: true }],
    waste: [{ id: "waste", suit: "hearts", rank: "7", faceUp: true }],
    foundations: [
      {
        suit: "hearts",
        cards: [{ id: "ace", suit: "hearts", rank: "A", faceUp: true }],
      },
      { suit: "spades", cards: [] },
    ],
    tableau: [
      [
        { id: "hidden", suit: "clubs", rank: "K", faceUp: false },
        { id: "queen", suit: "hearts", rank: "Q", faceUp: true },
        { id: "jack", suit: "clubs", rank: "J", faceUp: true },
      ],
      [],
    ],
  };

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  try {
    await act(async () => {
      root?.unmount();
    });
  } finally {
    container?.remove();
    container = undefined;
    root = undefined;
    vi.unstubAllGlobals();
  }
});

async function render(overrides: Partial<Props> = {}) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(KlondikeMobileBoard, {
        board,
        onMove: mocks.onMove,
        onStockTap: mocks.stockTap,
        hint: null,
        ...overrides,
      }),
    );
  });
}

function button(label: string): HTMLButtonElement {
  const result = container?.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (!result) throw new Error(`Missing button: ${label}`);
  return result;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

describe("KlondikeMobileBoard", () => {
  it("labels foundations, waste, stock, and face-down cards", async () => {
    await render();

    expect(button("hearts foundation, A")).toBeDefined();
    expect(button("spades foundation, empty").textContent).toBe("♠");
    expect(button("Move 7 of hearts from waste").disabled).toBe(false);
    expect(button("Draw a card")).toBeDefined();
    expect(button("Face-down card, column 1").disabled).toBe(true);
    expect(button("Q of hearts, column 1").disabled).toBe(false);

    expect(mocks.motion).toHaveBeenLastCalledWith(board);
    expect(mocks.useMobile).toHaveBeenLastCalledWith({
      board,
      onMove: mocks.onMove,
    });
  });

  it("forwards foundation, waste, tableau, and empty-column taps", async () => {
    await render();

    await click("hearts foundation, A");
    await click("Move 7 of hearts from waste");
    await click("Q of hearts, column 1");
    await click("Empty column 2");

    expect(mocks.foundationTap).toHaveBeenCalledExactlyOnceWith(0);
    expect(mocks.wasteTap).toHaveBeenCalledTimes(1);
    expect(mocks.tableauTap).toHaveBeenCalledExactlyOnceWith(0, 1);
    expect(mocks.destinationTap).toHaveBeenCalledExactlyOnceWith({
      type: "tableau",
      columnIndex: 1,
    });
  });

  it("clears pending selection before drawing stock", async () => {
    mocks.stockTap.mockImplementation(() => {
      expect(mocks.clear).toHaveBeenCalledTimes(1);
    });

    await render();
    await click("Draw a card");

    expect(mocks.stockTap).toHaveBeenCalledTimes(1);
    expect(mocks.card).toHaveBeenCalledWith({
      card: { ...board.stock[0], faceUp: false },
    });
    expect(board.stock[0].faceUp).toBe(true);
  });

  it("renders recycle and empty-waste controls when those piles are empty", async () => {
    board.stock = [];
    board.waste = [];
    await render();

    expect(button("Empty waste").disabled).toBe(true);
    expect(button("Recycle waste").textContent).toBe("↻");

    await click("Recycle waste");

    expect(mocks.stockTap).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      source: { type: "foundation", foundationIndex: 0 },
      label: "hearts foundation, A",
    },
    { source: { type: "waste" }, label: "Move 7 of hearts from waste" },
  ] satisfies { source: Source; label: string }[])(
    "highlights a selected $source.type",
    async ({ source, label }) => {
      mocks.useMobile.mockReturnValue(state(source));
      await render();

      expect(button(label).classList.contains("ring-amber-300")).toBe(true);
    },
  );

  it("marks the selected tableau sequence and available destination", async () => {
    mocks.useMobile.mockReturnValue(
      state({ type: "tableau", columnIndex: 0, cardIndex: 1 }, [
        { type: "tableau", columnIndex: 1 },
      ]),
    );
    await render();

    expect(
      button("Face-down card, column 1").getAttribute("aria-pressed"),
    ).toBe("false");
    expect(button("Q of hearts, column 1").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(button("J of clubs, column 1").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(button("Empty column 2").textContent).toBe("↓");
  });

  it("forwards auto-finish animation only to matching cards", async () => {
    await render({ autoFinishCardId: "ace" });

    expect(mocks.card).toHaveBeenCalledWith({
      card: board.foundations[0].cards[0],
      active: true,
    });
    expect(mocks.card).toHaveBeenCalledWith({
      card: board.tableau[0][1],
      active: false,
    });
  });

  it("highlights stock and waste-to-foundation hints", async () => {
    await render({ hint: { type: "stock" } });
    expect(button("Draw a card").classList.contains("ring-amber-300")).toBe(
      true,
    );

    await render({
      hint: {
        type: "waste-to-foundation",
        foundationIndex: 1,
        cardId: "waste",
      },
    });

    expect(
      button("Move 7 of hearts from waste").classList.contains(
        "ring-amber-300",
      ),
    ).toBe(true);
    expect(
      button("spades foundation, empty").classList.contains("ring-emerald-300"),
    ).toBe(true);
  });

  it("highlights tableau source cards and the destination column", async () => {
    await render({
      hint: {
        type: "tableau-to-tableau",
        sourceColumnIndex: 0,
        cardIndex: 1,
        targetColumnIndex: 1,
        cardId: "queen",
      },
    });

    expect(
      button("Q of hearts, column 1").classList.contains("ring-amber-300"),
    ).toBe(true);
    expect(
      button("J of clubs, column 1").classList.contains("ring-amber-300"),
    ).toBe(true);
    expect(button("Empty column 2").textContent).toBe("↓");
  });
});
