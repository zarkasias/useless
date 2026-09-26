// card-display-utils.ts
import type { GameCard } from "@/lib/types/gamecards";

export function getSuitSymbol(suit: GameCard["suit"]): string {
  switch (suit) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
  }
}

export function getSuitColor(suit: GameCard["suit"]): string {
  return suit === "hearts" || suit === "diamonds"
    ? "text-red-600"
    : "text-gray-900";
}
