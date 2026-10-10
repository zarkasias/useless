import type { CardSuit, GameCard } from "@/lib/types/gamecards";
import { createStandardDeck } from "@/lib/games/solitaire/core/deck";

import type { SpiderDifficulty } from "./spider-types";

const suitsByDifficulty: Record<SpiderDifficulty, CardSuit[]> = {
  1: ["spades"],
  2: ["spades", "hearts"],
  4: ["spades", "hearts", "clubs", "diamonds"],
};

export function createSpiderDeck(difficulty: SpiderDifficulty): GameCard[] {
  const suits = suitsByDifficulty[difficulty];

  const baseCards = createStandardDeck().filter((card) =>
    suits.includes(card.suit),
  );

  const copies = 104 / baseCards.length;

  return Array.from({ length: copies }, (_, copyIndex) =>
    baseCards.map((card) => ({
      ...card,
      id: `spider-${copyIndex}-${card.id}`,
    })),
  ).flat();
}
