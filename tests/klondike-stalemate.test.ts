import { describe, expect, it } from "vitest";
import { getKlondikeProgressStatus, isKlondikeStalemate } from "../src/lib/games/solitaire/klondike/klondike-stalemate";
import {
  moveTableauSequence,
  moveFoundationCardToTableau,
} from "../src/lib/games/solitaire/klondike/klondike-moves";
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
      [card("8", "spades")],
      [],
      [],
      [],
      [],
      [],
      [],
    ],
  };
}

describe("Klondike stalemate detection", () => {
  it("ignores equivalent King-stack relocations", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("K", "spades"), card("Q", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(true);

    const relocated = moveTableauSequence(board, 0, 0, 1);
    expect(relocated).not.toBeNull();
    expect(isKlondikeStalemate(relocated!)).toBe(true);
  });

  it("ignores equivalent lone-King relocations", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("K", "spades")];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("counts a King stack move that uncovers a hidden card", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("4", "clubs", false), card("K", "spades"), card("Q", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(false);
    const moved = moveTableauSequence(board, 0, 1, 1);
    expect(moved?.tableau[0][0].faceUp).toBe(true);
  });

  it("detects reversible tableau moves that cannot unlock progress", () => {
    const board = blockedBoard();
    board.tableau[1] = [card("J", "diamonds")];
    board.tableau[2] = [card("10", "spades")];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("still counts available foundation moves", () => {
    const board = blockedBoard();
    board.tableau[1] = [card("A", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("ignores foundation moves even when they could unlock a hidden card", () => {
    const board = blockedBoard();
    board.waste = [];
    board.foundations[0].cards = (["A", "2", "3", "4", "5", "6"] as const).map(
      (rank) => card(rank, "hearts"),
    );
    board.tableau = [
      [card("A", "clubs", false), card("5", "spades")],
      [card("8", "diamonds"), card("7", "clubs")],
      [],
      [],
      [],
      [],
      [],
    ];

    expect(isKlondikeStalemate(board)).toBe(true);
    const recovered = moveFoundationCardToTableau(board, 0, 1);
    expect(recovered).not.toBeNull();
    const revealed = moveTableauSequence(recovered!, 0, 1, 1);
    expect(revealed?.tableau[0][0].faceUp).toBe(true);
  });

  it("ignores a foundation King that can move into an empty column", () => {
    const board = blockedBoard();
    board.foundations[0].cards = (
      [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ] as const
    ).map((rank) => card(rank, "hearts"));
    // Avoid duplicating the queen already in this foundation.
    board.tableau[0] = [card("8", "spades")];
    expect(isKlondikeStalemate(board)).toBe(true);
    expect(moveFoundationCardToTableau(board, 0, 1)).not.toBeNull();
  });

  it("does not count a foundation card with no legal destination", () => {
    const board = blockedBoard();
    board.foundations[0].cards = [card("A", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("detects a reversible sequence move with no reachable progress", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("8", "spades"), card("7", "hearts")];
    board.tableau[1] = [card("8", "clubs")];
    expect(moveTableauSequence(board, 0, 1, 1)).not.toBeNull();
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("detects four blocked waste cards with two empty columns despite King relocations", () => {
    const board = blockedBoard();
    board.waste = [card("2", "clubs"), card("4", "clubs"), card("6", "clubs"), card("9", "clubs")];
    board.tableau = [
      [card("K", "spades"), card("Q", "hearts")],
      [card("8", "spades")],
      [card("10", "spades")],
      [card("J", "clubs")],
      [card("5", "clubs")],
      [],
      [],
    ];
    expect(isKlondikeStalemate(board)).toBe(true);
  });

  it("finds a foundation advance unlocked by a rearrangement", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("A", "hearts"), card("K", "clubs")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("never labels a completed game as stalemate", () => {
    const board = blockedBoard();
    board.stock = [];
    board.waste = [];
    board.tableau = Array.from({ length: 7 }, () => []);
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
    board.foundations = board.foundations.map((foundation) => ({
      ...foundation,
      cards: ranks.map((rank) => card(rank, foundation.suit)),
    }));
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("finds a hidden-card reveal requiring two tableau rearrangements", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("4", "clubs", false), card("8", "spades"), card("7", "hearts")];
    board.tableau[1] = [card("8", "clubs")];
    board.tableau[2] = [card("9", "hearts")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("finds a waste play unlocked by a tableau rearrangement", () => {
    const board = blockedBoard();
    board.waste = [card("7", "diamonds")];
    board.tableau[0] = [card("8", "spades"), card("7", "hearts")];
    board.tableau[1] = [card("8", "clubs")];
    expect(isKlondikeStalemate(board)).toBe(false);
  });

  it("returns unknown when the search budget is exhausted", () => {
    const board = blockedBoard();
    board.tableau[0] = [card("8", "spades"), card("7", "hearts")];
    board.tableau[1] = [card("8", "clubs")];
    expect(getKlondikeProgressStatus(board, 1)).toBe("unknown");
    expect(getKlondikeProgressStatus(board, 0)).toBe("unknown");
  });

  it("does not mutate the board while searching", () => {
    const board = blockedBoard();
    const before = structuredClone(board);
    isKlondikeStalemate(board);
    expect(board).toEqual(before);
  });

  it.each(["stock", "waste"] as const)(
    "finds a playable card buried in the %s after drawing/recycling",
    (pile) => {
      const board = blockedBoard();
      board[pile] = [card("A", "hearts", pile === "waste"), card("9", "clubs", pile === "waste")];
      expect(isKlondikeStalemate(board)).toBe(false);
    },
  );

  it("detects stalemate when cycling the stock cannot produce a play", () => {
    const board = blockedBoard();
    board.stock = [card("10", "clubs", false)];
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
