import type { GameCard } from "@/lib/types/gamecards";
import { getRankValue } from "@/lib/games/solitaire/core/card-utils";

import type { SpiderBoardState } from "./spider-types";

export function canPlaceOnTableau(
  movingCard: GameCard,
  targetCard: GameCard,
): boolean {
  return (
    movingCard.faceUp &&
    targetCard.faceUp &&
    getRankValue(movingCard.rank) === getRankValue(targetCard.rank) - 1
  );
}

export function canPlaceOnEmptyTableau(movingCard: GameCard): boolean {
  return movingCard.faceUp;
}

export function isValidTableauSequence(cards: GameCard[]): boolean {
  if (cards.length === 0 || cards.some((card) => !card.faceUp)) {
    return false;
  }

  for (let i = 0; i < cards.length - 1; i++) {
    const currentCard = cards[i];
    const nextCard = cards[i + 1];

    if (
      currentCard.suit !== nextCard.suit ||
      getRankValue(nextCard.rank) !== getRankValue(currentCard.rank) - 1
    ) {
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

export function canDealFromStock(board: SpiderBoardState): boolean {
  return (
    board.tableau.length === 10 &&
    board.stock.length >= 10 &&
    board.tableau.every((column) => column.length > 0)
  );
}
