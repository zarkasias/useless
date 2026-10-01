import type { GameCard } from "@/lib/types/gamecards";

import type { SpiderBoardState, SpiderDifficulty } from "./spider-types";

export function createSpiderBoard(
  deck: GameCard[],
  difficulty: SpiderDifficulty,
): SpiderBoardState {
  const workingDeck = deck.map((card) => ({
    ...card,
    faceUp: false,
  }));

  if (workingDeck.length !== 104) {
    throw new Error("Spider Solitaire requires exactly 104 cards");
  }

  const tableau: GameCard[][] = Array.from({ length: 10 }, () => []);

  for (let column = 0; column < 10; column++) {
    const cardCount = column < 4 ? 6 : 5;

    for (let row = 0; row < cardCount; row++) {
      const card = workingDeck.shift();

      if (!card) {
        throw new Error("Not enough cards to create Spider tableau");
      }

      tableau[column].push({
        ...card,
        faceUp: row === cardCount - 1,
      });
    }
  }

  return {
    difficulty,
    stock: workingDeck,
    tableau,
    completedRuns: [],
  };
}
