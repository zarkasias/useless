import type { GameCard } from "@/lib/types/gamecards";
import type { KlondikeBoardState } from "./klondike-types";

export function createKlondikeBoard(deck: GameCard[]): KlondikeBoardState {
  const workingDeck = deck.map((card) => ({
    ...card,
    faceUp: false,
  }));

  const tableau: GameCard[][] = Array.from({ length: 7 }, () => []);

  for (let column = 0; column < 7; column++) {
    for (let row = 0; row <= column; row++) {
      const card = workingDeck.shift();

      if (!card) {
        throw new Error("Not enough card to create Klondike tableau");
      }

      tableau[column].push({
        ...card,
        faceUp: row === column,
      });
    }
  }

  const foundations = [
    { suit: "hearts" as const, cards: [] },
    { suit: "diamonds" as const, cards: [] },
    { suit: "clubs" as const, cards: [] },
    { suit: "spades" as const, cards: [] },
  ];

  return {
    stock: workingDeck,
    waste: [],
    foundations,
    tableau,
  };
}
