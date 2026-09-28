import type { KlondikeBoardState } from "./klondike-types";

import {
  canMoveTableauSequence,
  canPlaceOnEmptyTableau,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  isValidTableauSequence,
} from "./klondike-rules";

export function hasAvailableKlondikeMove(board: KlondikeBoardState): boolean {
  const stockAndWasteCards = [...board.stock, ...board.waste];

  for (const card of stockAndWasteCards) {
    // Stock cards become face-up when drawn
    const playableCard = {
      ...card,
      faceUp: true,
    };

    // Can this card eventually move to a foundation?
    for (const foundation of board.foundations) {
      if (canPlaceOnFoundation(playableCard, foundation)) {
        return true;
      }
    }

    // Can this card eventually move to the tableau?
    for (const targetColumn of board.tableau) {
      if (targetColumn.length === 0) {
        if (canPlaceOnEmptyTableau(playableCard)) {
          return true;
        }

        continue;
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      if (canPlaceOnTableau(playableCard, targetCard)) {
        return true;
      }
    }
  }

  const topWasteCard = board.waste[board.waste.length - 1];

  // Waste → foundation / tableau
  if (topWasteCard) {
    for (const foundation of board.foundations) {
      if (canPlaceOnFoundation(topWasteCard, foundation)) {
        return true;
      }
    }

    for (const targetColumn of board.tableau) {
      if (targetColumn.length === 0) {
        if (canPlaceOnEmptyTableau(topWasteCard)) {
          return true;
        }

        continue;
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      if (canPlaceOnTableau(topWasteCard, targetCard)) {
        return true;
      }
    }
  }

  // Tableau moves
  for (
    let sourceColumnIndex = 0;
    sourceColumnIndex < board.tableau.length;
    sourceColumnIndex++
  ) {
    const sourceColumn = board.tableau[sourceColumnIndex];

    if (sourceColumn.length === 0) {
      continue;
    }

    const topCard = sourceColumn[sourceColumn.length - 1];

    // Tableau → foundation
    for (const foundation of board.foundations) {
      if (canPlaceOnFoundation(topCard, foundation)) {
        return true;
      }
    }

    // Tableau → tableau
    for (let cardIndex = 0; cardIndex < sourceColumn.length; cardIndex++) {
      const movingCards = sourceColumn.slice(cardIndex);

      if (!isValidTableauSequence(movingCards)) {
        continue;
      }

      for (
        let targetColumnIndex = 0;
        targetColumnIndex < board.tableau.length;
        targetColumnIndex++
      ) {
        if (targetColumnIndex === sourceColumnIndex) {
          continue;
        }

        const targetColumn = board.tableau[targetColumnIndex];

        if (!canMoveTableauSequence(movingCards, targetColumn)) {
          continue;
        }

        const cardUnderMovingSequence =
          cardIndex > 0 ? sourceColumn[cardIndex - 1] : null;

        // 1. Moving the sequence reveals a face-down card.
        if (cardUnderMovingSequence && !cardUnderMovingSequence.faceUp) {
          return true;
        }

        // 2. Moving the sequence exposes a card that can
        // immediately advance to a foundation.
        if (cardUnderMovingSequence?.faceUp) {
          const canExposedCardReachFoundation = board.foundations.some(
            (foundation) =>
              canPlaceOnFoundation(cardUnderMovingSequence, foundation),
          );

          if (canExposedCardReachFoundation) {
            return true;
          }
        }

        // 3. Moving the entire column creates an empty tableau slot.
        //
        // Don't count simply moving a King-led column from one
        // empty-space configuration to another.
        if (cardIndex === 0 && sourceColumn.length > 0) {
          const movingCard = movingCards[0];

          if (movingCard.rank !== "K") {
            return true;
          }
        }
      }
    }
  }

  // Count every legal foundation move, even if it can be reversed.
  // Moving a card back to the tableau may unlock another sequence.
  for (const foundation of board.foundations) {
    const topCard = foundation.cards[foundation.cards.length - 1];

    if (!topCard) {
      continue;
    }

    for (const targetColumn of board.tableau) {
      const canMove = targetColumn.length === 0
        ? canPlaceOnEmptyTableau(topCard)
        : canPlaceOnTableau(topCard, targetColumn[targetColumn.length - 1]);

      if (canMove) {
        return true;
      }
    }
  }

  return false;
}

export function isKlondikeStalemate(board: KlondikeBoardState): boolean {
  return !hasAvailableKlondikeMove(board);
}
