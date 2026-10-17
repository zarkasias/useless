// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
  stalemate: vi.fn(),
  canAutoFinish: vi.fn(),
  nextAutoMove: vi.fn(),
  hints: vi.fn(),
  score: vi.fn(),
  record: vi.fn(),
  createBoard: vi.fn(),
  interactions: vi.fn(),
  reset: vi.fn(),
  registerMove: vi.fn(),
  stockClick: vi.fn(),
  desktop: vi.fn(),
  mobile: vi.fn(),
  setBoard: vi.fn(),
  recorded: vi.fn(),
}));

vi.mock("@/lib/games/solitaire/klondike/klondike-state", () => ({
  isKlondikeComplete: mocks.complete,
}));
vi.mock("@/lib/games/solitaire/klondike/klondike-stalemate", () => ({
  isKlondikeStalemate: mocks.stalemate,
}));
vi.mock("@/lib/games/solitaire/klondike/klondike-autofinish", () => ({
  canAutoFinishKlondike: mocks.canAutoFinish,
  getNextAutoFinishMove: mocks.nextAutoMove,
}));
vi.mock("@/lib/games/solitaire/klondike/klondike-hint", () => ({
  getKlondikeHints: mocks.hints,
}));
vi.mock("@/lib/games/solitaire/klondike/klondike-scoring", () => ({
  calculateKlondikeScore: mocks.score,
}));
vi.mock("@/app/actions/game-actions", () => ({
  recordKlondikeGameResultAction: mocks.record,
}));
vi.mock("@/components/games/solitaire/klondike/klondike-helper", () => ({
  createInitialBoard: mocks.createBoard,
}));
vi.mock(
  "@/components/games/solitaire/klondike/use-klondike-interactions",
  () => ({
    useKlondikeInteractions: mocks.interactions,
  }),
);
vi.mock("@/components/games/solitaire/klondike/klondike-board", () => ({
  KlondikeBoard: (props: unknown) => {
    mocks.desktop(props);
    return null;
  },
}));
vi.mock("@/components/games/solitaire/klondike/klondike-mobile-board", () => ({
  KlondikeMobileBoard: (props: unknown) => {
    mocks.mobile(props);
    return null;
  },
}));
vi.mock("@/components/games/system/game-table", () => ({
  GameTable: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));
vi.mock("@/components/games/system/game-result-overlay", () => ({
  default: ({ children }: { children: ReactNode }) =>
    createElement("section", null, children),
}));
vi.mock("@/components/games/system/game-result", () => ({
  default: ({
    title,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    stats,
  }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    stats?: ReactNode;
  }) =>
    createElement(
      "section",
      null,
      createElement("h2", null, title),
      stats,
      actionLabel
        ? createElement("button", { onClick: onAction }, actionLabel)
        : null,
      secondaryActionLabel
        ? createElement(
            "button",
            { onClick: onSecondaryAction },
            secondaryActionLabel,
          )
        : null,
    ),
}));
vi.mock("@/components/games/system/game-achievements", () => ({
  default: () => null,
}));

import { KlondikeGameContent } from "@/components/games/solitaire/klondike/klondike-gamecontent";

const board: KlondikeBoardState = {
  stock: [],
  waste: [],
  foundations: [],
  tableau: [],
};
const nextBoard: KlondikeBoardState = {
  ...board,
  tableau: [[]],
};

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function interactions(hasStarted = false) {
  return {
    hasStarted,
    moveCount: 12,
    elapsedSeconds: 65,
    resetInteractions: mocks.reset,
    registerSuccessfulMove: mocks.registerMove,
    handleStockClick: mocks.stockClick,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
  mocks.complete.mockReturnValue(false);
  mocks.stalemate.mockReturnValue(false);
  mocks.canAutoFinish.mockReturnValue(false);
  mocks.hints.mockReturnValue([]);
  mocks.score.mockReturnValue(750);
  mocks.record.mockResolvedValue({ success: true, unlockedAchievements: [] });
  mocks.createBoard.mockReturnValue(nextBoard);
  mocks.interactions.mockReturnValue(interactions());

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

async function render() {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(KlondikeGameContent, {
        board,
        setBoard: mocks.setBoard,
        onGameRecorded: mocks.recorded,
      }),
    );
  });
}

async function click(label: string) {
  const button = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) => element.textContent?.trim() === label,
  );
  if (!button) throw new Error(`Missing button: ${label}`);

  await act(async () => {
    button.click();
  });
}

describe("KlondikeGameContent", () => {
  it("renders time and forwards mobile moves to board state and move tracking", async () => {
    await render();

    expect(container?.textContent).toContain("1:05");
    expect(mocks.record).not.toHaveBeenCalled();

    const props = mocks.mobile.mock.calls.at(-1)![0] as {
      onMove: (board: KlondikeBoardState) => void;
      onStockTap: () => void;
    };

    await act(async () => {
      props.onMove(nextBoard);
    });

    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
    expect(mocks.registerMove).toHaveBeenCalledTimes(1);
    expect(props.onStockTap).toBe(mocks.stockClick);
  });

  it("starts a new untouched game without recording abandonment", async () => {
    await render();
    await click("New Game");

    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
  });

  it("records abandonment before restarting a started game", async () => {
    mocks.interactions.mockReturnValue(interactions(true));

    await render();
    await click("New Game");

    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({
      result: "abandoned",
      moves: 12,
      durationSeconds: 65,
      score: 0,
      autoFinished: false,
    });
    expect(mocks.recorded).toHaveBeenCalledTimes(1);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.setBoard).toHaveBeenCalledWith(nextBoard);
  });

  it("records a completed game once and displays the victory", async () => {
    mocks.complete.mockReturnValue(true);

    await render();
    await render();

    expect(mocks.score).toHaveBeenCalledExactlyOnceWith({
      result: "win",
      moves: 12,
      durationSeconds: 65,
      autoFinished: false,
    });
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({
      result: "win",
      moves: 12,
      durationSeconds: 65,
      score: 750,
      autoFinished: false,
    });
    expect(mocks.recorded).toHaveBeenCalledTimes(1);
    expect(container?.textContent).toContain("You won Useless Solitaire!");
    expect(container?.textContent).toContain("750");
  });

  it("does not notify the parent when recording a win is unsuccessful", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.record.mockResolvedValue({ success: false });

    await render();

    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.recorded).not.toHaveBeenCalled();
  });

  it("shows and dismisses the no-hint message", async () => {
    await render();
    await click("Hint");

    expect(container?.textContent).toContain("You're out of moves!!");

    await click("Keep playing");

    expect(container?.textContent).not.toContain("You're out of moves!!");
  });

  it("cycles through available hints", async () => {
    const hints = [
      { type: "stock" },
      { type: "waste-to-tableau", targetColumnIndex: 1, cardId: "waste-1" },
    ];
    mocks.hints.mockReturnValue(hints);

    await render();

    for (const expected of [hints[0], hints[1], hints[0]]) {
      await click("Hint");

      expect(mocks.desktop).toHaveBeenLastCalledWith(
        expect.objectContaining({ hint: expected }),
      );
    }
  });

  it("shows the stalemate notice only until the user chooses to keep playing", async () => {
    mocks.stalemate.mockReturnValue(true);

    await render();

    expect(container?.textContent).toContain("You're out of moves!!");

    await click("Keep playing");
    await render();

    expect(container?.textContent).not.toContain("You're out of moves!!");
  });

  it("allows dismissing the auto-finish offer", async () => {
    mocks.canAutoFinish.mockReturnValue(true);

    await render();

    expect(container?.textContent).toContain("This game can finish itself");

    await click("Keep playing");

    expect(container?.textContent).not.toContain("This game can finish itself");
    expect(mocks.nextAutoMove).not.toHaveBeenCalled();
  });
});

describe("KlondikeGameContent auto-finish and replay", () => {
  it("animates auto-finish moves and clears the animation when finished", async () => {
    vi.useFakeTimers();

    try {
      const intermediateBoard: KlondikeBoardState = {
        ...board,
        tableau: [[], []],
      };

      mocks.canAutoFinish.mockReturnValue(true);
      mocks.complete.mockImplementation(
        (candidate: KlondikeBoardState) => candidate === nextBoard,
      );
      mocks.nextAutoMove
        .mockReturnValueOnce({
          cardId: "first-card",
          board: intermediateBoard,
        })
        .mockReturnValueOnce({
          cardId: "last-card",
          board: nextBoard,
        });

      await render();
      await click("Finish game");

      expect(container?.textContent).toContain("Putting everything away...");
      expect(mocks.setBoard).toHaveBeenNthCalledWith(1, intermediateBoard);
      expect(mocks.mobile).toHaveBeenLastCalledWith(
        expect.objectContaining({ autoFinishCardId: "first-card" }),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(176);
      });

      expect(mocks.setBoard).toHaveBeenNthCalledWith(2, nextBoard);
      expect(mocks.mobile).toHaveBeenLastCalledWith(
        expect.objectContaining({ autoFinishCardId: "last-card" }),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(172);
      });

      expect(mocks.mobile).toHaveBeenLastCalledWith(
        expect.objectContaining({ autoFinishCardId: null }),
      );
      expect(container?.textContent).toContain("Putting everything away...");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(container?.textContent).not.toContain(
        "Putting everything away...",
      );
      expect(mocks.nextAutoMove).toHaveBeenCalledTimes(2);
      expect(mocks.nextAutoMove).toHaveBeenNthCalledWith(1, board);
      expect(mocks.nextAutoMove).toHaveBeenNthCalledWith(2, intermediateBoard);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it("stops auto-finishing safely when no next move is available", async () => {
    vi.useFakeTimers();

    try {
      mocks.canAutoFinish.mockReturnValue(true);
      mocks.nextAutoMove.mockReturnValue(null);

      await render();
      await click("Finish game");

      expect(mocks.nextAutoMove).toHaveBeenCalledExactlyOnceWith(board);
      expect(mocks.setBoard).not.toHaveBeenCalled();
      expect(container?.textContent).toContain("Putting everything away...");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(container?.textContent).not.toContain(
        "Putting everything away...",
      );
      expect(mocks.mobile).toHaveBeenLastCalledWith(
        expect.objectContaining({ autoFinishCardId: null }),
      );
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it("restarts a completed game without recording it as abandoned", async () => {
    mocks.complete.mockReturnValue(true);
    mocks.interactions.mockReturnValue(interactions(true));

    await render();

    expect(mocks.record).toHaveBeenCalledTimes(1);

    await click("New game");

    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.record.mock.calls[0][0].result).toBe("win");
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(mocks.createBoard).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.setBoard).toHaveBeenCalledExactlyOnceWith(nextBoard);
  });
});
