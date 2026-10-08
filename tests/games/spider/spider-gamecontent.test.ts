// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";

const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
  record: vi.fn(),
  createBoard: vi.fn(),
  interactions: vi.fn(),
  reset: vi.fn(),
  undo: vi.fn(),
  applyMove: vi.fn(),
  stock: vi.fn(),
  hint: vi.fn(),
  desktop: vi.fn(),
  mobile: vi.fn(),
  setBoard: vi.fn(),
  recorded: vi.fn(),
}));

vi.mock("@/lib/games/solitaire/spider/spider-state", () => ({
  isSpiderComplete: mocks.complete,
}));

vi.mock("@/lib/games/solitaire/spider/spider-hint", () => ({
  getNextSpiderHint: mocks.hint,
}));

vi.mock("@/app/actions/game-actions", () => ({
  recordSpiderGameResultAction: mocks.record,
}));

vi.mock("@/components/games/solitaire/spider/spider-helper", () => ({
  createInitialBoard: mocks.createBoard,
}));

vi.mock("@/components/games/solitaire/spider/use-spider-interactions", () => ({
  useSpiderInteractions: mocks.interactions,
}));

vi.mock("@/components/games/solitaire/spider/spider-board", () => ({
  SpiderBoard: (props: unknown) => {
    mocks.desktop(props);
    return null;
  },
}));

vi.mock("@/components/games/solitaire/spider/spider-mobile-board", () => ({
  SpiderMobileBoard: (props: unknown) => {
    mocks.mobile(props);
    return null;
  },
}));

vi.mock("@/components/games/solitaire/spider/spider-settings", () => ({
  SpiderSettings: () => null,
  SpiderInfo: () => null,
}));

vi.mock("@/components/games/system/game-achievements", () => ({
  default: () => null,
}));

import { SpiderGameContent } from "@/components/games/solitaire/spider/spider-gamecontent";

const board: SpiderBoardState = {
  difficulty: 2,
  stock: [],
  tableau: [],
  completedRuns: [],
};

const nextBoard: SpiderBoardState = {
  ...board,
  tableau: [[]],
};

function interactionState(overrides = {}) {
  return {
    isStalemate: false,
    hasStarted: false,
    moveCount: 12,
    elapsedSeconds: 65,
    canUndo: true,
    canDeal: true,
    handleUndo: mocks.undo,
    applyMove: mocks.applyMove,
    handleStockClick: mocks.stock,
    resetInteractions: mocks.reset,
    ...overrides,
  };
}

let container: HTMLDivElement | undefined;
let root: Root | undefined;

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.complete.mockReturnValue(false);
  mocks.record.mockResolvedValue({
    success: true,
    session: { score: 750 },
    unlockedAchievements: [],
  });
  mocks.createBoard.mockReturnValue(nextBoard);
  mocks.interactions.mockReturnValue(interactionState());
  mocks.hint.mockReturnValue({
    type: "deal-stock",
    reason: "Deal another row",
  });

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );

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
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

async function render(currentBoard = board) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(SpiderGameContent, {
        board: currentBoard,
        setBoard: mocks.setBoard,
        onGameRecorded: mocks.recorded,
      }),
    );
  });
}

function button(label: string): HTMLButtonElement {
  const visibleLabels: Record<string, string> = {
    "Undo last move": "Undo",
    "Get a Hint": "Hint",
  };

  const visibleLabel = visibleLabels[label] ?? label;

  const result = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) =>
      element.textContent?.trim() === visibleLabel ||
      element.getAttribute("aria-label") === label,
  );

  if (!result) throw new Error(`Missing button: ${label}`);
  return result;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

describe("SpiderGameContent", () => {
  it("renders elapsed time and forwards mobile interaction handlers", async () => {
    await render();

    expect(container?.textContent).toContain("1:05");
    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.mobile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        board,
        onMove: mocks.applyMove,
        onStockTap: mocks.stock,
        canDeal: true,
      }),
    );

    await click("Undo last move");

    expect(mocks.undo).toHaveBeenCalledTimes(1);
  });

  it("disables undo when no move can be undone", async () => {
    mocks.interactions.mockReturnValue(interactionState({ canUndo: false }));

    await render();

    expect(button("Undo last move").disabled).toBe(true);
  });

  it("records a win once and displays the saved score", async () => {
    mocks.complete.mockReturnValue(true);

    await render();
    await render();

    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({
      result: "win",
      moves: 12,
      durationSeconds: 65,
      difficulty: 2,
      completedRuns: 0,
    });
    expect(mocks.recorded).toHaveBeenCalledTimes(1);
    expect(container?.textContent).toContain(
      "You won Useless Spider Solitaire!",
    );
    expect(container?.textContent).toContain("750");
    expect(container?.textContent).toContain("Result saved.");
    expect(button("Get a Hint").disabled).toBe(true);
  });

  it("records a stalemate as a loss and lets the user view the board", async () => {
    mocks.interactions.mockReturnValue(interactionState({ isStalemate: true }));

    await render();

    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({ result: "loss" }),
    );
    expect(container?.textContent).toContain("This game is blocked");
    expect(button("Get a Hint").disabled).toBe(true);

    await click("View Board");

    expect(container?.textContent).not.toContain("This game is blocked");
    expect(mocks.record).toHaveBeenCalledTimes(1);
  });

  it("shows a service-reported result save error", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.record.mockResolvedValue({
      success: false,
      error: "Unable to save this game.",
    });

    await render();

    expect(container?.textContent).toContain("Unable to save this game.");
    expect(mocks.recorded).not.toHaveBeenCalled();
  });

  it("shows a confirmation error when saving throws", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.record.mockRejectedValue(new Error("Network unavailable"));

    await render();

    expect(container?.textContent).toContain(
      "Unable to confirm that your result was saved.",
    );
    expect(mocks.recorded).not.toHaveBeenCalled();
  });

  it("restarts an untouched game without recording abandonment", async () => {
    await render();
    await click("New Game");

    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.createBoard).toHaveBeenCalledExactlyOnceWith(2);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
  });

  it("records abandonment and prevents restarting the same board twice", async () => {
    mocks.interactions.mockReturnValue(interactionState({ hasStarted: true }));

    await render();
    await click("New Game");
    await click("New Game");

    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({
      result: "abandoned",
      moves: 12,
      durationSeconds: 65,
      difficulty: 2,
      completedRuns: 0,
    });
    expect(mocks.recorded).toHaveBeenCalledTimes(1);
    expect(mocks.createBoard).toHaveBeenCalledTimes(1);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it("reports and dismisses an abandonment save failure", async () => {
    mocks.interactions.mockReturnValue(interactionState({ hasStarted: true }));
    mocks.record.mockResolvedValue({ success: false });

    await render();
    await click("New Game");

    expect(container?.querySelector('[role="alert"]')?.textContent).toBe(
      "Unable to confirm that the previous game's result was saved.",
    );
    expect(mocks.setBoard).toHaveBeenCalledWith(nextBoard);

    await click("Dismiss");

    expect(container?.querySelector('[role="alert"]')).toBeNull();
  });

  it("fades mobile hints after 4.5 seconds and removes them after 5 seconds", async () => {
    vi.useFakeTimers();

    await render();
    await click("Get a Hint");

    expect(mocks.hint).toHaveBeenCalledExactlyOnceWith(board);
    expect(mocks.mobile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hint: { type: "deal-stock", reason: "Deal another row" },
        hintFading: false,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500);
    });

    expect(mocks.mobile).toHaveBeenLastCalledWith(
      expect.objectContaining({ hintFading: true }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(mocks.mobile).toHaveBeenLastCalledWith(
      expect.objectContaining({ hint: null, hintFading: false }),
    );
  });

  it("clears the active hint when the board changes", async () => {
    await render();
    await click("Get a Hint");

    await render(nextBoard);

    expect(mocks.desktop).toHaveBeenLastCalledWith(
      expect.objectContaining({ board: nextBoard, hint: null }),
    );
  });
  it("reports an abandonment exception without preventing restart", async () => {
    mocks.interactions.mockReturnValue(interactionState({ hasStarted: true }));
    mocks.record.mockRejectedValue(new Error("Network unavailable"));

    await render();
    await click("New Game");

    expect(container?.querySelector('[role="alert"]')?.textContent).toBe(
      "Unable to confirm that the previous game's result was saved.",
    );
    expect(mocks.recorded).not.toHaveBeenCalled();
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
  });

  it("restarts from the stalemate overlay without recording abandonment", async () => {
    mocks.interactions.mockReturnValue(
      interactionState({ hasStarted: true, isStalemate: true }),
    );

    await render();

    const restartButtons = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).filter((element) => element.textContent?.trim() === "New Game");

    expect(restartButtons).toHaveLength(2);

    await act(async () => {
      restartButtons[1]!.click();
    });

    expect(mocks.createBoard).toHaveBeenCalledExactlyOnceWith(2);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({ result: "loss" }),
    );
  });

  it("restarts from the victory overlay without recording abandonment", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.interactions.mockReturnValue(interactionState({ hasStarted: true }));

    await render();

    const restartButtons = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).filter((element) => element.textContent?.trim() === "New Game");

    expect(restartButtons).toHaveLength(2);

    await act(async () => {
      restartButtons[1]!.click();
    });

    expect(mocks.createBoard).toHaveBeenCalledExactlyOnceWith(2);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({ result: "win" }),
    );
  });

  it("uses the fallback message when a failed save has no error", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.record.mockResolvedValue({ success: false });

    await render();

    expect(container?.querySelector('[role="status"]')?.textContent).toBe(
      "Unable to save your result.",
    );
    expect(mocks.recorded).not.toHaveBeenCalled();
  });

  it.each(["win", "loss"] as const)(
    "shows the pending save status for a %s until confirmation arrives",
    async (result) => {
      let resolveSave!: (value: { success: true }) => void;

      mocks.record.mockReturnValue(
        new Promise<{ success: true }>((resolve) => {
          resolveSave = resolve;
        }),
      );
      mocks.complete.mockReturnValue(result === "win");
      mocks.interactions.mockReturnValue(
        interactionState({ isStalemate: result === "loss" }),
      );

      await render();

      expect(container?.querySelector('[role="status"]')?.textContent).toBe(
        "Saving result...",
      );
      expect(mocks.recorded).not.toHaveBeenCalled();

      await act(async () => {
        resolveSave({ success: true });
      });

      expect(container?.querySelector('[role="status"]')?.textContent).toBe(
        "Result saved.",
      );
      expect(mocks.recorded).toHaveBeenCalledTimes(1);
    },
  );
});
