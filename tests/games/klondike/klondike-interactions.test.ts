// @vitest-environment jsdom
import { act, createElement, type DragEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKlondikeInteractions } from "../../../src/components/games/solitaire/klondike/use-klondike-interactions";
import { createCardDragPreview } from "../../../src/components/games/solitaire/shared/card-drag-preview";
import type { KlondikeBoardState } from "../../../src/lib/games/solitaire/klondike/klondike-types";
import type { GameCard } from "../../../src/lib/types/gamecards";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  document.body.replaceChildren();
});
const card = (rank: GameCard["rank"], suit: GameCard["suit"]): GameCard => ({
  id: `${rank}-${suit}`,
  rank,
  suit,
  faceUp: true,
});
const event = () =>
  ({
    preventDefault: vi.fn(),
    dataTransfer: { setData: vi.fn(), setDragImage: vi.fn() },
  }) as unknown as DragEvent<HTMLButtonElement>;

function setup() {
  const board: KlondikeBoardState = {
    stock: [],
    waste: [card("A", "hearts")],
    foundations: [{ suit: "hearts", cards: [] }],
    tableau: [
      [card("2", "clubs"), card("A", "diamonds")],
      [card("3", "hearts")],
      [card("A", "hearts")],
    ],
  };
  const setBoard = vi.fn();
  let interactions: ReturnType<typeof useKlondikeInteractions>;
  function Harness() {
    interactions = useKlondikeInteractions({
      board,
      setBoard,
      isComplete: false,
    });
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(Harness)));
  return { current: () => interactions!, setBoard, board };
}

describe("Klondike drag interactions", () => {
  it("uses the dragged tableau sequence instead of an earlier waste selection", () => {
    const h = setup();

    act(() => h.current().setSelectedCardId(h.board.waste[0].id));
    act(() => h.current().handleTableauDragStart(0, 0, event()));
    expect(h.current().isValidTableauTarget(1)).toBe(true);
    expect(h.current().isValidTableauTarget(0)).toBe(false);
    act(() =>
      h
        .current()
        .handleTableauDrop(1, event() as unknown as DragEvent<HTMLDivElement>),
    );
    expect(h.setBoard.mock.calls[0][0].tableau[1]).toHaveLength(3);
    expect(h.setBoard.mock.calls[0][0].waste).toHaveLength(1);
    expect(h.current().dragSource).toBeNull();
  });

  it("clears cancelled drags before a waste-to-foundation move", () => {
    const h = setup();
    act(() => h.current().handleTableauDragStart(2, 0, event()));
    act(() => h.current().handleDragEnd());
    expect(h.current().isValidFoundationTarget(0)).toBe(false);
    act(() => h.current().handleWasteDragStart(event()));
    act(() => h.current().handleFoundationDrop(0, event()));
    expect(h.setBoard.mock.calls[0][0].waste).toHaveLength(0);
    expect(h.setBoard.mock.calls[0][0].tableau[2]).toHaveLength(1);
  });

  it("rejects sequence-to-foundation moves for both dragging and clicking", () => {
    const h = setup();
    // The last card fits, but the selected sequence must not be split.
    h.board.tableau[0][1] = card("A", "hearts");
    act(() => h.current().handleTableauDragStart(0, 0, event()));
    expect(h.current().isValidFoundationTarget(0)).toBe(false);
    act(() => h.current().handleFoundationDrop(0, event()));
    expect(h.setBoard).not.toHaveBeenCalled();
    expect(h.current().dragSource).toBeNull();
    act(() =>
      h.current().setSelectedTableauCard({ columnIndex: 0, cardIndex: 0 }),
    );
    act(() => h.current().handleFoundationClick(0));
    expect(h.setBoard).not.toHaveBeenCalled();
  });

  it("ignores drops without an active drag", () => {
    const h = setup();
    act(() => h.current().setSelectedCardId(h.board.waste[0].id));
    act(() => h.current().handleFoundationDrop(0, event()));
    expect(h.setBoard).not.toHaveBeenCalled();
  });
});

it("builds a static drag preview without changing the original card", () => {
  vi.useFakeTimers();
  const button = document.createElement("button");
  button.innerHTML = '<div class="animate-card-flip-in">A</div>';
  document.body.appendChild(button);
  const drag = event();
  createCardDragPreview(drag, [button]);
  const preview = vi.mocked(drag.dataTransfer.setDragImage).mock
    .calls[0][0] as HTMLElement;
  expect(preview.querySelector(".animate-card-flip-in")).toBeNull();
  expect(button.querySelector(".animate-card-flip-in")).not.toBeNull();
  expect(preview.isConnected).toBe(true);
  vi.runAllTimers();
  expect(preview.isConnected).toBe(false);
});
