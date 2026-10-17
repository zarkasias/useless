import { describe, expect, it } from "vitest";

import {
  canAutoFinishKlondike,
  getNextAutoFinishMove,
} from "@/lib/games/solitaire/klondike/klondike-autofinish";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import type { GameCard } from "@/lib/types/gamecards";

const SUITS: GameCard["suit"][] = ["hearts", "diamonds", "clubs", "spades"];

const RANKS: GameCard["rank"][] = [
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

function card(rank: GameCard["rank"], suit: GameCard["suit"]): GameCard {
  return { id: `${suit}-${rank}`, rank, suit, faceUp: true };
}

function nearlyFinishedBoard(): KlondikeBoardState {
  return {
    stock: [],
    waste: [],
    foundations: SUITS.map((suit) => ({
      suit,
      cards: RANKS.slice(0, -1).map((rank) => card(rank, suit)),
    })),
    tableau: [...SUITS.map((suit) => [card("K", suit)]), [], [], []],
  };
}

describe("canAutoFinishKlondike", () => {
  it("accepts a finishable exposed board without changing it", () => {
    const board = nearlyFinishedBoard();
    const original = structuredClone(board);

    expect(canAutoFinishKlondike(board)).toBe(true);
    expect(board).toEqual(original);
  });

  it("rejects hidden tableau cards", () => {
    const board = nearlyFinishedBoard();
    board.tableau[0][0].faceUp = false;

    expect(canAutoFinishKlondike(board)).toBe(false);
  });

  it("rejects remaining stock even when its card could reach foundation", () => {
    const board = nearlyFinishedBoard();
    const king = board.tableau[0].pop()!;
    board.stock = [{ ...king, faceUp: false }];

    expect(canAutoFinishKlondike(board)).toBe(false);
  });

  it("simulates repeated waste moves", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0].pop()!;

    // Queen is exposed first; King follows.
    board.waste = [king, queen];
    const original = structuredClone(board);

    expect(canAutoFinishKlondike(board)).toBe(true);
    expect(board).toEqual(original);
  });

  it("retries a blocked waste card after a tableau move enables it", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0].pop()!;

    board.waste = [king];
    board.tableau[0] = [queen];

    expect(canAutoFinishKlondike(board)).toBe(true);
  });

  it("rejects an exposed board that cannot fully finish", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0][0];

    // King blocks the Queen required to enable its foundation move.
    board.tableau[0] = [queen, king];
    const original = structuredClone(board);

    expect(canAutoFinishKlondike(board)).toBe(false);
    expect(board).toEqual(original);
  });

  it("rejects waste whose top card blocks a required lower card", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0].pop()!;

    board.waste = [queen, king];

    expect(canAutoFinishKlondike(board)).toBe(false);
  });

  it("does not finish cards whose foundation suit is missing", () => {
    const board = nearlyFinishedBoard();
    board.foundations = board.foundations.slice(1);

    expect(canAutoFinishKlondike(board)).toBe(false);
  });

  it("does not finish waste whose foundation suit is missing", () => {
    const board = nearlyFinishedBoard();
    board.waste = [board.tableau[0].pop()!];
    board.foundations = board.foundations.slice(1);

    expect(canAutoFinishKlondike(board)).toBe(false);
  });

  it("recognizes an already completed board", () => {
    const board = nearlyFinishedBoard();

    for (let index = 0; index < SUITS.length; index += 1) {
      board.foundations[index].cards.push(board.tableau[index].pop()!);
    }

    expect(canAutoFinishKlondike(board)).toBe(true);
    expect(getNextAutoFinishMove(board)).toBeNull();
  });

  it("simulates all 52 cards from exposed tableau columns", () => {
    const board: KlondikeBoardState = {
      stock: [],
      waste: [],
      foundations: SUITS.map((suit) => ({ suit, cards: [] })),
      tableau: [
        ...SUITS.map((suit) =>
          [...RANKS].reverse().map((rank) => card(rank, suit)),
        ),
        [],
        [],
        [],
      ],
    };

    const original = structuredClone(board);

    expect(canAutoFinishKlondike(board)).toBe(true);
    expect(board).toEqual(original);
  });
});

describe("getNextAutoFinishMove", () => {
  it("prefers a legal waste move and returns its animation metadata", () => {
    const board = nearlyFinishedBoard();
    const king = board.tableau[0].pop()!;
    board.waste = [king];
    const original = structuredClone(board);

    const move = getNextAutoFinishMove(board);

    expect(move).not.toBeNull();
    expect(move).toMatchObject({
      cardId: king.id,
      source: { type: "waste" },
      foundationIndex: 0,
    });
    expect(move!.board.waste).toEqual([]);
    expect(move!.board.foundations[0].cards.at(-1)).toEqual(king);
    expect(move!.board.tableau).toEqual(board.tableau);
    expect(board).toEqual(original);
  });

  it("returns a tableau move when waste cannot yet move", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0].pop()!;

    board.waste = [king];
    board.tableau[0] = [queen];

    const move = getNextAutoFinishMove(board);

    expect(move).toMatchObject({
      cardId: queen.id,
      source: { type: "tableau", columnIndex: 0 },
      foundationIndex: 0,
    });
    expect(move!.board.waste).toEqual([king]);
    expect(move!.board.tableau[0]).toEqual([]);
    expect(move!.board.foundations[0].cards.at(-1)).toEqual(queen);
  });

  it("skips empty columns and cards without a matching foundation", () => {
    const board = nearlyFinishedBoard();
    board.foundations = board.foundations.slice(1);
    board.tableau.unshift([]);
    board.waste = [board.tableau[1].pop()!];

    const move = getNextAutoFinishMove(board);

    expect(move).toMatchObject({
      cardId: "diamonds-K",
      source: { type: "tableau", columnIndex: 2 },
      foundationIndex: 0,
    });
    expect(move!.board.waste).toEqual(board.waste);
  });

  it("returns null when the remaining tableau card cannot move", () => {
    const board = nearlyFinishedBoard();
    const queen = board.foundations[0].cards.pop()!;
    const king = board.tableau[0][0];

    board.tableau[0] = [queen, king];

    for (let index = 1; index < SUITS.length; index += 1) {
      board.foundations[index].cards.push(board.tableau[index].pop()!);
    }

    expect(getNextAutoFinishMove(board)).toBeNull();
  });

  it("finishes the board by applying successive returned moves", () => {
    const original = nearlyFinishedBoard();
    let board = original;
    const movedIds: string[] = [];

    for (let step = 0; step < 4; step += 1) {
      const move = getNextAutoFinishMove(board);
      expect(move).not.toBeNull();

      movedIds.push(move!.cardId);
      board = move!.board;
    }

    expect(new Set(movedIds).size).toBe(4);
    expect(board.tableau.every((column) => column.length === 0)).toBe(true);
    expect(board.foundations.every((pile) => pile.cards.length === 13)).toBe(
      true,
    );
    expect(getNextAutoFinishMove(board)).toBeNull();
    expect(original.tableau[0]).toHaveLength(1);
  });
});
