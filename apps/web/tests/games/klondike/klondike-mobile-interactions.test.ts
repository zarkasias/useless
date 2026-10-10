// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useKlondikeMobileInteractions } from "../../../src/components/games/solitaire/klondike/use-klondike-mobile-interactions";
import type { KlondikeBoardState } from "../../../src/lib/games/solitaire/klondike/klondike-types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("executes automatic moves, asks for ambiguous destinations, and invalidates old selections", () => {
  let board: KlondikeBoardState = {
    stock: [],
    waste: [{ id: "ah", rank: "A", suit: "hearts", faceUp: true }],
    foundations: [{ suit: "hearts", cards: [] }],
    tableau: [[{ id: "ks", rank: "K", suit: "spades", faceUp: true }], [], []],
  };
  const onMove = vi.fn();
  let mobile!: ReturnType<typeof useKlondikeMobileInteractions>;
  function Harness() {
    mobile = useKlondikeMobileInteractions({ board, onMove });
    return null;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(createElement(Harness)));
    act(() => mobile.handleWasteTap());
    expect(onMove.mock.calls[0][0].foundations[0].cards[0].id).toBe("ah");
    expect(onMove.mock.calls[0][0].waste).toEqual([]);
    onMove.mockClear();

    act(() => mobile.handleTableauCardTap(0, 0));
    expect(onMove).not.toHaveBeenCalled();
    expect(mobile.pendingDestinations).toHaveLength(2);
    act(() => mobile.handleDestinationTap({ type: "tableau", columnIndex: 2 }));
    expect(onMove.mock.calls[0][0].tableau[2][0].id).toBe("ks");
    expect(mobile.pendingDestinations).toEqual([]);
    act(() => mobile.handleTableauCardTap(0, 0));
    board = { ...board, stock: [] };
    act(() => root.render(createElement(Harness)));
    expect(mobile.pendingDestinations).toEqual([]);
    act(() => mobile.handleDestinationTap({ type: "tableau", columnIndex: 1 }));
    expect(onMove).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
  }
});
