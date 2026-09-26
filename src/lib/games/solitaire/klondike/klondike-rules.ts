import type { GameCard } from "@/lib/types/gamecards";
import {
  getCardColor,
  getRankValue,
} from "@/lib/games/solitaire/core/card-utils";

import type { KlondikeFoundation } from "./klondike-types";

export function canPlaceOnTableau(
  movingCard: GameCard,
  targetCard: GameCard,
): boolean {
  if (!movingCard.faceUp || !targetCard.faceUp) {
    return false;
  }

  const movingColor = getCardColor(movingCard.suit);
  const targetColor = getCardColor(targetCard.suit);

  const isOppositeColor = movingColor !== targetColor;

  const isNextRankDown =
    getRankValue(movingCard.rank) === getRankValue(targetCard.rank) - 1;

  return isOppositeColor && isNextRankDown;
}

export function canPlaceOnEmptyTableau(movingCard: GameCard): boolean {
  return movingCard.faceUp && movingCard.rank === "K";
}

export function canPlaceOnFoundation(
  movingCard: GameCard,
  foundation: KlondikeFoundation,
): boolean {
  if (!movingCard.faceUp) {
    return false;
  }

  if (movingCard.suit !== foundation.suit) {
    return false;
  }

  if (foundation.cards.length === 0) {
    return movingCard.rank === "A";
  }

  const topCard = foundation.cards[foundation.cards.length - 1];

  return getRankValue(movingCard.rank) === getRankValue(topCard.rank) + 1;
}

export function isValidTableauSequence(cards: GameCard[]): boolean {
  if (cards.length === 0) {
    return false;
  }

  if (cards.some((card) => !card.faceUp)) {
    return false;
  }

  for (let i = 0; i < cards.length - 1; i++) {
    const currentCard = cards[i];
    const nextCard = cards[i + 1];

    const currentColor = getCardColor(currentCard.suit);
    const nextColor = getCardColor(nextCard.suit);

    const isOppositeColor = currentColor !== nextColor;

    const isDescendingByOne =
      getRankValue(nextCard.rank) === getRankValue(currentCard.rank) - 1;

    if (!isOppositeColor || !isDescendingByOne) {
      return false;
    }
  }

  return true;
}

export function canMoveTableauSequence(
  movingCards: GameCard[],
  targetColumn: GameCard[],
): boolean {
  if (!isValidTableauSequence(movingCards)) {
    return false;
  }

  const firstMovingCard = movingCards[0];

  if (!firstMovingCard) {
    return false;
  }

  if (targetColumn.length === 0) {
    return canPlaceOnEmptyTableau(firstMovingCard);
  }

  const targetCard = targetColumn[targetColumn.length - 1];

  return canPlaceOnTableau(firstMovingCard, targetCard);
}
