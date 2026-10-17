// @vitest-environment jsdom

import {
  act,
  createElement,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

const mocks = vi.hoisted(() => ({
  createBoard: vi.fn(),
  content: vi.fn(),
}));

vi.mock("@/components/games/solitaire/klondike/klondike-helper", () => ({
  createInitialBoard: mocks.createBoard,
}));

vi.mock("@/components/games/system/game-table", () => ({
  GameTable: ({ children }: { children: ReactNode }) =>
    createElement("section", { "data-testid": "game-table" }, children),
}));

vi.mock("@/components/games/solitaire/klondike/klondike-gamecontent", () => ({
  KlondikeGameContent: (props: unknown) => {
    mocks.content(props);
    return createElement("div", { "data-testid": "game-content" });
  },
}));

import { KlondikeGame } from "@/components/games/solitaire/klondike/klondike-game";

type ContentProps = {
  board: KlondikeBoardState;
  setBoard: Dispatch<SetStateAction<KlondikeBoardState | null>>;
  onGameRecorded?: () => void;
};

const board: KlondikeBoardState = {
  stock: [{ id: "hearts-A", suit: "hearts", rank: "A", faceUp: false }],
  waste: [],
  foundations: [],
  tableau: [],
};

let container: HTMLDivElement | undefined;
let root: Root | undefined;

beforeEach(() => {
  mocks.createBoard.mockReset();
  mocks.content.mockReset();
  mocks.createBoard.mockReturnValue(board);
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

async function render(onGameRecorded?: () => void) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(createElement(KlondikeGame, { onGameRecorded }));
  });
}

function latestContent(): ContentProps {
  const call = mocks.content.mock.calls.at(-1);
  if (!call) throw new Error("Game content was not rendered");
  return call[0] as ContentProps;
}

describe("KlondikeGame", () => {
  it("renders the shuffling screen before client effects run", () => {
    const html = renderToStaticMarkup(createElement(KlondikeGame));

    expect(html).toContain("Shuffling cards...");
    expect(html).toContain('data-testid="game-table"');
    expect(mocks.createBoard).not.toHaveBeenCalled();
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it("initializes the board and renders game content after mounting", async () => {
    await render();

    expect(mocks.createBoard).toHaveBeenCalledExactlyOnceWith();
    expect(latestContent().board).toBe(board);
    expect(
      container?.querySelector('[data-testid="game-content"]'),
    ).not.toBeNull();
    expect(container?.textContent).not.toContain("Shuffling cards...");
  });

  it("forwards the game-recorded callback", async () => {
    const onGameRecorded = vi.fn();

    await render(onGameRecorded);

    expect(latestContent().onGameRecorded).toBe(onGameRecorded);
    expect(onGameRecorded).not.toHaveBeenCalled();
  });

  it("allows game content to update the board without creating another game", async () => {
    await render();

    const updated: KlondikeBoardState = {
      ...board,
      stock: [],
      waste: [{ ...board.stock[0], faceUp: true }],
    };

    await act(async () => {
      latestContent().setBoard(updated);
    });

    expect(latestContent().board).toBe(updated);
    expect(mocks.createBoard).toHaveBeenCalledTimes(1);
  });

  it("does not reset the board when the parent rerenders", async () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    await render(firstCallback);
    await render(secondCallback);

    expect(mocks.createBoard).toHaveBeenCalledTimes(1);
    expect(latestContent().board).toBe(board);
    expect(latestContent().onGameRecorded).toBe(secondCallback);
  });
});
