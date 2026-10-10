// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useMobile: vi.fn(),
  clearPendingMove: vi.fn(),
  destinationTap: vi.fn(),
  cardTap: vi.fn(),
  stockTap: vi.fn(),
  onMove: vi.fn(),
}));

vi.mock(
  "@/components/games/solitaire/spider/use-spider-mobile-interactions",
  () => ({
    useSpiderMobileInteractions: mocks.useMobile,
  }),
);

vi.mock("@/components/games/solitaire/shared/mobile-card", () => ({
  default: () => null,
}));

import { SpiderMobileBoard } from "@/components/games/solitaire/spider/spider-mobile-board";

type Props = Parameters<typeof SpiderMobileBoard>[0];

const board: Props["board"] = {
  difficulty: 1,
  stock: Array.from({ length: 20 }, (_, index) => ({
    id: `stock-${index}`,
    suit: "spades",
    rank: "A",
    faceUp: false,
  })),
  completedRuns: [
    { suit: "hearts", cards: [] },
    { suit: "spades", cards: [] },
  ],
  tableau: [
    [
      { id: "hidden", suit: "spades", rank: "K", faceUp: false },
      { id: "queen", suit: "spades", rank: "Q", faceUp: true },
      { id: "jack", suit: "spades", rank: "J", faceUp: true },
    ],
    [],
  ],
};

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function mobileState(
  pendingSource: { columnIndex: number; cardIndex: number } | null = null,
  pendingDestinations: number[] = [],
) {
  return {
    pendingSource,
    pendingDestinations,
    clearPendingMove: mocks.clearPendingMove,
    handleDestinationTap: mocks.destinationTap,
    handleTableauCardTap: mocks.cardTap,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
  mocks.useMobile.mockReturnValue(mobileState());
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
      createElement(SpiderMobileBoard, {
        board,
        onMove: mocks.onMove,
        onStockTap: mocks.stockTap,
        canDeal: true,
        hint: null,
        ...overrides,
      }),
    );
  });
}

function labelledButton(label: string): HTMLButtonElement {
  const button = container?.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (!button) throw new Error(`Missing button: ${label}`);
  return button;
}

function dealButton(): HTMLButtonElement {
  const button = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) => element.textContent?.includes("Deal ("),
  );

  if (!button) throw new Error("Missing deal button");
  return button;
}

describe("SpiderMobileBoard", () => {
  it("renders completed-run labels, suits, and empty slots", async () => {
    await render();

    const group = container?.querySelector(
      '[role="group"][aria-label="Completed runs"]',
    );
    expect(group?.children).toHaveLength(8);

    const hearts = group?.querySelector(
      '[aria-label="Run 1: hearts complete"]',
    );
    expect(hearts?.textContent).toBe("♥");
    expect(hearts?.classList.contains("text-red-700")).toBe(true);

    const spades = group?.querySelector(
      '[aria-label="Run 2: spades complete"]',
    );
    expect(spades?.textContent).toBe("♠");
    expect(spades?.classList.contains("text-slate-900")).toBe(true);

    expect(
      group?.querySelector('[aria-label="Run 3: empty"]')?.textContent,
    ).toBe("3");
  });

  it("labels cards and disables face-down cards and unavailable destinations", async () => {
    await render();

    expect(labelledButton("Face-down card, column 1").disabled).toBe(true);
    expect(labelledButton("Q of spades, column 1").disabled).toBe(false);
    expect(labelledButton("Move to column 2").disabled).toBe(true);
    expect(labelledButton("Empty column 2").disabled).toBe(true);
  });

  it("forwards card taps and destination taps", async () => {
    mocks.useMobile.mockReturnValue(
      mobileState({ columnIndex: 0, cardIndex: 1 }, [1]),
    );
    await render();

    await act(async () => {
      labelledButton("Q of spades, column 1").click();
      labelledButton("Move to column 2").click();
      labelledButton("Empty column 2").click();
    });

    expect(mocks.cardTap).toHaveBeenCalledExactlyOnceWith(0, 1);
    expect(mocks.destinationTap).toHaveBeenCalledTimes(2);
    expect(mocks.destinationTap).toHaveBeenNthCalledWith(1, 1);
    expect(mocks.destinationTap).toHaveBeenNthCalledWith(2, 1);
  });

  it("marks every card in the pending sequence as selected", async () => {
    mocks.useMobile.mockReturnValue(
      mobileState({ columnIndex: 0, cardIndex: 1 }, [1]),
    );
    await render();

    expect(
      labelledButton("Face-down card, column 1").getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      labelledButton("Q of spades, column 1").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      labelledButton("J of spades, column 1").getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("clears the pending move before dealing stock", async () => {
    mocks.stockTap.mockImplementation(() => {
      expect(mocks.clearPendingMove).toHaveBeenCalledTimes(1);
    });
    await render();

    expect(dealButton().textContent).toContain("Deal (2)");

    await act(async () => {
      dealButton().click();
    });

    expect(mocks.stockTap).toHaveBeenCalledTimes(1);
  });

  it("disables dealing when stock cannot be dealt", async () => {
    await render({ canDeal: false });

    expect(dealButton().disabled).toBe(true);

    await act(async () => {
      dealButton().click();
    });

    expect(mocks.clearPendingMove).not.toHaveBeenCalled();
    expect(mocks.stockTap).not.toHaveBeenCalled();
  });

  it("highlights stock for a deal hint and removes highlighting when fading", async () => {
    const hint: Props["hint"] = {
      type: "deal-stock",
      reason: "Deal another row",
    };
    await render({ hint });

    expect(
      dealButton().parentElement?.classList.contains("ring-amber-300"),
    ).toBe(true);

    await render({ hint, hintFading: true });

    expect(
      dealButton().parentElement?.classList.contains("ring-amber-300"),
    ).toBe(false);
  });

  it("shows move hints and fades their labels", async () => {
    const hint: Props["hint"] = {
      type: "tableau-to-tableau",
      sourceColumnIndex: 0,
      cardIndex: 1,
      targetColumnIndex: 1,
      reason: "Build a sequence",
    };
    await render({ hint });

    expect(container?.textContent).toContain("Move");
    expect(container?.textContent).toContain("Here");
    expect(
      labelledButton("Q of spades, column 1").classList.contains(
        "ring-amber-300",
      ),
    ).toBe(true);

    await render({ hint, hintFading: true });

    const labels = Array.from(container?.querySelectorAll("span") ?? []).filter(
      (element) => ["Move", "Here"].includes(element.textContent ?? ""),
    );
    expect(labels).toHaveLength(2);
    expect(labels.every((element) => element.style.opacity === "0")).toBe(true);
    expect(
      labelledButton("Q of spades, column 1").classList.contains(
        "ring-amber-300",
      ),
    ).toBe(false);
  });

  it("suppresses hints while a move is selected", async () => {
    mocks.useMobile.mockReturnValue(
      mobileState({ columnIndex: 0, cardIndex: 1 }, [1]),
    );
    await render({
      hint: {
        type: "tableau-to-tableau",
        sourceColumnIndex: 0,
        cardIndex: 1,
        targetColumnIndex: 1,
        reason: "Build a sequence",
      },
    });

    const hintLabels = Array.from(
      container?.querySelectorAll("span") ?? [],
    ).filter((element) => ["Move", "Here"].includes(element.textContent ?? ""));

    expect(hintLabels).toHaveLength(0);
    expect(mocks.useMobile).toHaveBeenLastCalledWith({
      board,
      onMove: mocks.onMove,
    });
  });
});
