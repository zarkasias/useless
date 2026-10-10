import { describe, expect, it } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";
import { isRedCard, isBlackCard } from "@/lib/games/solitaire/core/card-utils";

const suits: {
  suit: GameCard["suit"];
  red: boolean;
  black: boolean;
}[] = [
  { suit: "hearts", red: true, black: false },
  { suit: "diamonds", red: true, black: false },
  { suit: "clubs", red: false, black: true },
  { suit: "spades", red: false, black: true },
];

describe.each(suits)("card color helpers for $suit", ({ suit, red, black }) => {
  it.each([true, false])("classifies the suit when faceUp is %s", (faceUp) => {
    const card: GameCard = {
      id: `${suit}-A`,
      suit,
      rank: "A",
      faceUp,
    };

    expect(isRedCard(card)).toBe(red);
    expect(isBlackCard(card)).toBe(black);
  });
});
