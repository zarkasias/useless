import { describe, expect, it } from "vitest";
import { isKlondikeStalemate } from "../src/lib/games/solitaire/klondike/klondike-stalemate";
import { moveTableauSequence, moveFoundationCardToTableau } from "../src/lib/games/solitaire/klondike/klondike-moves";
import type { KlondikeBoardState } from "../src/lib/games/solitaire/klondike/klondike-types";
import type { GameCard } from "../src/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
): GameCard {
  return { id: `${rank}-${suit}`, rank, suit, faceUp };
}

// Reduced positions isolate the moves relevant to the detector.
function blockedBoard(): KlondikeBoardState {
  return {
    stock: [],
    waste: [card("9", "clubs")],
    foundations: [
      { suit: "hearts", cards: [] },
      { suit: "diamonds", cards: [] },
      { suit: "clubs", cards: [] },
      { suit: "spades", cards: [] },
    ],
    tableau: [
      [card("K", "spades"), card("Q", "hearts")],
      [], [], [], [], [], [],
    ],
  };
}

describe("Klondike stalemate detection", () => {
  it("ignores relocating a whole King stack while keeping the move legal", () => {
    const board = blockedBoard();
    expect(isKlondikeStalemate(board)).toBe(true);

    const relocated = moveTableauSequence(board, 0, 0, 1);
    expect(relocated).not.toBeNull();
    expect(isKlondikeStalemate(relocated!)).toBe(true);
  });

  it("also ignores relocating a lone King", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("K", "spades")];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("counts a King stack move that uncovers a hidden card", () => {
    const board = blockedBoard();
    board.tableau[0].unshift(card("4", "clubs", false));
    expect(isKlondikeStalemate(board)).toBe(false);
    const moved = moveTableauSequence(board, 0, 1, 1);
    expect(moved?.tableau[0][0].faceUp).toBe(true);
  });

  it("still counts moves onto an occupied tableau column", () => {
    const board = blockedBoard();
    board.tableau[1] = [card("J", "diamonds")];
    board.tableau[2] = [card("10", "spades")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("still counts available foundation moves", () => {
    const board = blockedBoard();
    board.tableau[1] = [card("A", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("allows a foundation move that unlocks a hidden card", () => {
    const board = blockedBoard();
    board.waste = [];
    board.foundations[0].cards = (["A", "2", "3", "4", "5", "6"] as const)
      .map((rank) => card(rank, "hearts"));
    board.tableau = [
      [card("A", "clubs", false), card("5", "spades")],
      [card("8", "diamonds"), card("7", "clubs")],
      [], [], [], [], [],
    ];

    expect(isKlondikeStalemate(board)).toBe(false);
    const recovered = moveFoundationCardToTableau(board, 0, 1);
    expect(recovered).not.toBeNull();
    const revealed = moveTableauSequence(recovered!, 0, 1, 1);
    expect(revealed?.tableau[0][0].faceUp).toBe(true);
  });

  it("counts a foundation King that can move into an empty column", () => {
    const board = blockedBoard();
    board.foundations[0].cards = (
      ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const
    ).map((rank) => card(rank, "hearts"));
    // Avoid duplicating the queen already in this foundation.
    board.tableau[0] = [card("K", "spades")];
    expect(isKlondikeStalemate(board)).toBe(false);
    expect(moveFoundationCardToTableau(board, 0, 1)).not.toBeNull();
  });

  it("does not count a foundation card with no legal destination", () => {
    const board = blockedBoard();
    board.foundations[0].cards = [card("A", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it.each(["stock", "waste"] as const)(
    "counts a King in the %s that can fill the empty column",
    (pile) => {
      const board = blockedBoard();
      board[pile] = [card("K", "clubs", pile === "waste")];
      expect(isKlondikeStalemate(board)).toBe(false);
    },
  );
});
