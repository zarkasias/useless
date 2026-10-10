import { describe, expect, it } from "vitest";

import {
  getKlondikeHint,
  getKlondikeHints,
  type KlondikeHint,
} from "@/lib/games/solitaire/klondike/klondike-hint";

import {
  isHintFoundationTarget,
  isHintSourceCard,
  isHintStock,
  isHintTableauSource,
  isHintTableauTarget,
  isHintWasteSource,
} from "@/lib/games/solitaire/klondike/klondike-hint-display";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import type { GameCard } from "@/lib/types/gamecards";

function card(
  rank: GameCard["rank"],
  suit: GameCard["suit"],
  faceUp = true,
): GameCard {
  return { id: `${suit}-${rank}`, rank, suit, faceUp };
}

function board(
  overrides: Partial<KlondikeBoardState> = {},
): KlondikeBoardState {
  return {
    stock: [],
    waste: [],
    foundations: [
      { suit: "hearts", cards: [] },
      { suit: "diamonds", cards: [] },
      { suit: "clubs", cards: [] },
      { suit: "spades", cards: [] },
    ],
    tableau: Array.from({ length: 7 }, () => []),
    ...overrides,
  };
}

describe("Klondike hint generation", () => {
  it("returns none when there are no suggested moves", () => {
    const position = board();

    expect(getKlondikeHints(position)).toEqual([]);
    expect(getKlondikeHint(position)).toEqual({ type: "none" });
  });

  it("prioritizes a waste-to-foundation hint over tableau moves", () => {
    const ace = card("A", "hearts");
    const position = board({
      waste: [ace],
      tableau: [[card("2", "clubs")], [], [], [], [], [], []],
    });

    expect(getKlondikeHint(position)).toEqual({
      type: "waste-to-foundation",
      foundationIndex: 0,
      cardId: ace.id,
    });
    expect(getKlondikeHints(position)).toContainEqual({
      type: "waste-to-tableau",
      targetColumnIndex: 0,
      cardId: ace.id,
    });
  });

  it("uses only the top waste card for immediate waste hints", () => {
    const position = board({
      waste: [card("A", "hearts"), card("5", "clubs")],
    });

    expect(getKlondikeHints(position)).toEqual([{ type: "stock" }]);
  });

  it("suggests moving an exposed tableau ace to its foundation", () => {
    const ace = card("A", "spades");
    const position = board({ tableau: [[ace], []] });

    expect(getKlondikeHint(position)).toEqual({
      type: "tableau-to-foundation",
      sourceColumnIndex: 0,
      cardIndex: 0,
      foundationIndex: 3,
      cardId: ace.id,
    });
  });

  it("suggests a sequence move that reveals a hidden card", () => {
    const queen = card("Q", "hearts");
    const position = board({
      tableau: [
        [card("3", "clubs", false), queen, card("J", "clubs")],
        [card("K", "spades")],
      ],
    });
    const original = structuredClone(position);

    expect(getKlondikeHints(position)).toContainEqual({
      type: "tableau-to-tableau",
      sourceColumnIndex: 0,
      cardIndex: 1,
      targetColumnIndex: 1,
      cardId: queen.id,
    });
    expect(position).toEqual(original);
  });

  it("suggests a King move to an empty column when it reveals a card", () => {
    const king = card("K", "hearts");
    const position = board({
      tableau: [[card("3", "clubs", false), king], []],
    });

    expect(getKlondikeHints(position)).toEqual([
      {
        type: "tableau-to-tableau",
        sourceColumnIndex: 0,
        cardIndex: 1,
        targetColumnIndex: 1,
        cardId: king.id,
      },
    ]);
  });

  it("does not suggest moving an entire King stack to an empty column", () => {
    const position = board({
      tableau: [[card("K", "hearts"), card("Q", "clubs")], []],
    });

    expect(getKlondikeHints(position)).toEqual([]);
  });

  it("does not suggest a tableau move that reveals no hidden card", () => {
    const position = board({
      tableau: [[card("Q", "hearts")], [card("K", "clubs")]],
    });

    expect(getKlondikeHints(position)).toEqual([]);
  });

  it("does not suggest moving face-down tableau cards", () => {
    const position = board({
      tableau: [[card("A", "hearts", false)], []],
    });

    expect(getKlondikeHints(position)).toEqual([]);
  });

  it("does not suggest a mixed-color-invalid sequence", () => {
    const position = board({
      tableau: [
        [card("3", "clubs", false), card("Q", "hearts"), card("J", "diamonds")],
        [card("K", "spades")],
      ],
    });

    expect(getKlondikeHints(position)).toEqual([]);
  });

  it("suggests stock for a hidden draw card playable on foundation", () => {
    const position = board({
      stock: [card("A", "hearts", false)],
    });

    expect(getKlondikeHint(position)).toEqual({ type: "stock" });
    expect(position.stock[0].faceUp).toBe(false);
  });

  it("suggests stock for a draw card playable on tableau", () => {
    const position = board({
      stock: [card("Q", "hearts", false)],
      tableau: [[card("K", "clubs")]],
    });

    expect(getKlondikeHint(position)).toEqual({ type: "stock" });
  });

  it("does not suggest stock when no draw card is playable", () => {
    const position = board({
      stock: [card("5", "hearts", false)],
    });

    expect(getKlondikeHints(position)).toEqual([]);
  });
});

describe("Klondike hint display helpers", () => {
  const cases: Array<{
    name: string;
    hint: KlondikeHint | null;
    sourceCard: boolean;
    waste: boolean;
    tableauSource: boolean;
    tableauTarget: boolean;
    foundationTarget: boolean;
    stock: boolean;
  }> = [
    {
      name: "null",
      hint: null,
      sourceCard: false,
      waste: false,
      tableauSource: false,
      tableauTarget: false,
      foundationTarget: false,
      stock: false,
    },
    {
      name: "none",
      hint: { type: "none" },
      sourceCard: false,
      waste: false,
      tableauSource: false,
      tableauTarget: false,
      foundationTarget: false,
      stock: false,
    },
    {
      name: "stock",
      hint: { type: "stock" },
      sourceCard: false,
      waste: false,
      tableauSource: false,
      tableauTarget: false,
      foundationTarget: false,
      stock: true,
    },
    {
      name: "waste to foundation",
      hint: {
        type: "waste-to-foundation",
        foundationIndex: 2,
        cardId: "source-card",
      },
      sourceCard: true,
      waste: true,
      tableauSource: false,
      tableauTarget: false,
      foundationTarget: true,
      stock: false,
    },
    {
      name: "waste to tableau",
      hint: {
        type: "waste-to-tableau",
        targetColumnIndex: 2,
        cardId: "source-card",
      },
      sourceCard: true,
      waste: true,
      tableauSource: false,
      tableauTarget: true,
      foundationTarget: false,
      stock: false,
    },
    {
      name: "tableau to foundation",
      hint: {
        type: "tableau-to-foundation",
        sourceColumnIndex: 1,
        cardIndex: 0,
        foundationIndex: 2,
        cardId: "source-card",
      },
      sourceCard: true,
      waste: false,
      tableauSource: true,
      tableauTarget: false,
      foundationTarget: true,
      stock: false,
    },
    {
      name: "tableau to tableau",
      hint: {
        type: "tableau-to-tableau",
        sourceColumnIndex: 1,
        cardIndex: 0,
        targetColumnIndex: 2,
        cardId: "source-card",
      },
      sourceCard: true,
      waste: false,
      tableauSource: true,
      tableauTarget: true,
      foundationTarget: false,
      stock: false,
    },
  ];

  it.each(cases)(
    "highlights the correct elements for $name",
    ({
      hint,
      sourceCard,
      waste,
      tableauSource,
      tableauTarget,
      foundationTarget,
      stock,
    }) => {
      expect(isHintSourceCard(hint, "source-card")).toBe(sourceCard);
      expect(isHintSourceCard(hint, "other-card")).toBe(false);
      expect(isHintWasteSource(hint)).toBe(waste);
      expect(isHintTableauSource(hint, 1)).toBe(tableauSource);
      expect(isHintTableauSource(hint, 99)).toBe(false);
      expect(isHintTableauTarget(hint, 2)).toBe(tableauTarget);
      expect(isHintTableauTarget(hint, 99)).toBe(false);
      expect(isHintFoundationTarget(hint, 2)).toBe(foundationTarget);
      expect(isHintFoundationTarget(hint, 99)).toBe(false);
      expect(isHintStock(hint)).toBe(stock);
    },
  );
});
