import { describe, expect, it } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";
import { createKlondikeBoard } from "@/lib/games/solitaire/klondike/klondike-setup";
import { validateKlondikeBoard } from "@/lib/games/solitaire/klondike/klondike-validator";

function createDeck(): GameCard[] {
  const suits: GameCard["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: GameCard["rank"][] = [
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
  ];

  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
      faceUp: true,
    })),
  );
}

describe("createKlondikeBoard", () => {
  it("deals seven columns in deck order and leaves 24 stock cards", () => {
    const deck = createDeck();
    const board = createKlondikeBoard(deck);

    expect(board.tableau.map((column) => column.length)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);

    expect(board.tableau.flat().map((card) => card.id)).toEqual(
      deck.slice(0, 28).map((card) => card.id),
    );

    expect(board.stock.map((card) => card.id)).toEqual(
      deck.slice(28).map((card) => card.id),
    );

    expect(board.stock).toHaveLength(24);
    expect(board.waste).toEqual([]);
    expect(validateKlondikeBoard(board)).toBe(true);
  });

  it("turns up only the last card of each tableau column", () => {
    const board = createKlondikeBoard(createDeck());

    for (const column of board.tableau) {
      expect(column.map((card) => card.faceUp)).toEqual(
        column.map((_, index) => index === column.length - 1),
      );
    }

    expect(board.stock.every((card) => !card.faceUp)).toBe(true);
  });

  it("creates four empty foundations with their suits", () => {
    const board = createKlondikeBoard(createDeck());

    expect(board.foundations).toEqual([
      { suit: "hearts", cards: [] },
      { suit: "diamonds", cards: [] },
      { suit: "clubs", cards: [] },
      { suit: "spades", cards: [] },
    ]);
  });

  it("preserves the input deck and creates independent card objects", () => {
    const deck = createDeck();
    const original = deck.map((card) => ({ ...card }));
    const board = createKlondikeBoard(deck);

    expect(deck).toEqual(original);
    expect(board.tableau[0][0]).not.toBe(deck[0]);
    expect(board.stock[0]).not.toBe(deck[28]);

    board.tableau[0][0].faceUp = false;
    board.stock[0].faceUp = true;

    expect(deck).toEqual(original);
  });

  it.each([0, 1, 27])("rejects a deck containing only %i cards", (count) => {
    expect(() => createKlondikeBoard(createDeck().slice(0, count))).toThrow(
      "Not enough card to create Klondike tableau",
    );
  });
});

describe("validateKlondikeBoard", () => {
  it("accepts a correctly dealt initial board", () => {
    expect(validateKlondikeBoard(createKlondikeBoard(createDeck()))).toBe(true);
  });

  it("rejects a board missing a card", () => {
    const board = createKlondikeBoard(createDeck());
    board.stock.pop();

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a board containing an extra card", () => {
    const board = createKlondikeBoard(createDeck());
    board.stock.push({ ...board.stock[0], id: "extra-card" });

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects an incorrect tableau column count", () => {
    const board = createKlondikeBoard(createDeck());
    board.tableau.push([]);

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects an incorrect stock count even when all 52 cards remain", () => {
    const board = createKlondikeBoard(createDeck());
    board.waste.push(board.stock.pop()!);

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a nonempty waste with the correct stock and total counts", () => {
    const board = createKlondikeBoard(createDeck());
    board.waste.push(board.tableau[6].pop()!);

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a nonempty foundation with all 52 cards present", () => {
    const board = createKlondikeBoard(createDeck());
    board.foundations[0].cards.push(board.tableau[6].pop()!);

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects incorrect column sizes without losing cards", () => {
    const board = createKlondikeBoard(createDeck());
    board.tableau[0].push(board.tableau[1].pop()!);

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a column with no face-up card", () => {
    const board = createKlondikeBoard(createDeck());
    board.tableau[0][0].faceUp = false;

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a column with multiple face-up cards", () => {
    const board = createKlondikeBoard(createDeck());
    board.tableau[1][0].faceUp = true;

    expect(validateKlondikeBoard(board)).toBe(false);
  });

  it("rejects a column whose only face-up card is not the last card", () => {
    const board = createKlondikeBoard(createDeck());
    board.tableau[1][0].faceUp = true;
    board.tableau[1][1].faceUp = false;

    expect(validateKlondikeBoard(board)).toBe(false);
  });
});
