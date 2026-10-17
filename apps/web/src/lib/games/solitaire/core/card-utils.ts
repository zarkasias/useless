import type {
  CardRank,
  CardSuit,
  GameCard,
  CardColor,
} from "@/lib/types/gamecards";

export function getCardColor(suit: CardSuit): CardColor {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function getRankValue(rank: CardRank): number {
  const values: Record<CardRank, number> = {
    A: 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
  };

  return values[rank];
}

export function isRedCard(card: GameCard): boolean {
  return getCardColor(card.suit) === "red";
}

export function isBlackCard(card: GameCard): boolean {
  return getCardColor(card.suit) === "black";
}
