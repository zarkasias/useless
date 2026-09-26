import type { CardRank, CardSuit, GameCard } from "@/lib/types/gamecards";

const suits: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

const ranks: CardRank[] = [
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

export function createStandardDeck(): GameCard[] {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
      faceUp: false,
    })),
  );
}
