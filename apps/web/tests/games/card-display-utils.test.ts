import { describe, expect, it } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";
import {
  getSuitSymbol,
  getSuitColor,
} from "@/components/games/solitaire/shared/card-display-utils";

const cases: {
  suit: GameCard["suit"];
  symbol: string;
  color: string;
}[] = [
  { suit: "hearts", symbol: "♥", color: "text-red-600" },
  { suit: "diamonds", symbol: "♦", color: "text-red-600" },
  { suit: "clubs", symbol: "♣", color: "text-gray-900" },
  { suit: "spades", symbol: "♠", color: "text-gray-900" },
];

describe("card display helpers", () => {
  it.each(cases)("returns the symbol for $suit", ({ suit, symbol }) => {
    expect(getSuitSymbol(suit)).toBe(symbol);
  });

  it.each(cases)("returns the text color for $suit", ({ suit, color }) => {
    expect(getSuitColor(suit)).toBe(color);
  });
});
