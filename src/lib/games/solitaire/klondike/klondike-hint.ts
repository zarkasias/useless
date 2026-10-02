import type { KlondikeBoardState } from "./klondike-types";
import { canMoveTableauSequence, canPlaceOnFoundation } from "./klondike-rules";

export type KlondikeHint =
  | {
      type: "tableau-to-foundation";
      sourceColumnIndex: number;
      cardIndex: number;
      foundationIndex: number;
      cardId: string;
    }
  | {
      type: "tableau-to-tableau";
      sourceColumnIndex: number;
      cardIndex: number;
      targetColumnIndex: number;
      cardId: string;
    }
  | {
      type: "waste-to-foundation";
      foundationIndex: number;
      cardId: string;
    }
  | {
      type: "waste-to-tableau";
      targetColumnIndex: number;
      cardId: string;
    }
  | {
      type: "stock";
    }
  | {
      type: "none";
    };

function hasPlayableDrawCard(board: KlondikeBoardState): boolean {
  const drawCards = [...board.stock, ...board.waste];

  return drawCards.some((card) => {
    const playableCard = {
      ...card,
      faceUp: true,
    };

    const canMoveToFoundation = board.foundations.some((foundation) =>
      canPlaceOnFoundation(playableCard, foundation),
    );

    if (canMoveToFoundation) {
      return true;
    }

    const canMoveToTableau = board.tableau.some((column) =>
      canMoveTableauSequence([playableCard], column),
    );

    return canMoveToTableau;
  });
}

export function getKlondikeHints(board: KlondikeBoardState): KlondikeHint[] {
  const hints: KlondikeHint[] = [];

  const wasteCard = board.waste[board.waste.length - 1];

  if (wasteCard) {
    for (
      let foundationIndex = 0;
      foundationIndex < board.foundations.length;
      foundationIndex++
    ) {
      const foundation = board.foundations[foundationIndex];

      if (canPlaceOnFoundation(wasteCard, foundation)) {
        hints.push({
          type: "waste-to-foundation",
          foundationIndex,
          cardId: wasteCard.id,
        });
      }
    }

    for (
      let targetColumnIndex = 0;
      targetColumnIndex < board.tableau.length;
      targetColumnIndex++
    ) {
      const targetColumn = board.tableau[targetColumnIndex];

      if (canMoveTableauSequence([wasteCard], targetColumn)) {
        hints.push({
          type: "waste-to-tableau",
          targetColumnIndex,
          cardId: wasteCard.id,
        });
      }
    }
  }

  for (
    let sourceColumnIndex = 0;
    sourceColumnIndex < board.tableau.length;
    sourceColumnIndex++
  ) {
    const sourceColumn = board.tableau[sourceColumnIndex];
    const topCard = sourceColumn[sourceColumn.length - 1];

    if (topCard?.faceUp) {
      for (
        let foundationIndex = 0;
        foundationIndex < board.foundations.length;
        foundationIndex++
      ) {
        const foundation = board.foundations[foundationIndex];

        if (canPlaceOnFoundation(topCard, foundation)) {
          hints.push({
            type: "tableau-to-foundation",
            sourceColumnIndex,
            cardIndex: sourceColumn.length - 1,
            foundationIndex,
            cardId: topCard.id,
          });
        }
      }
    }

    for (let cardIndex = 0; cardIndex < sourceColumn.length; cardIndex++) {
      const movingCards = sourceColumn.slice(cardIndex);

      if (!movingCards[0]?.faceUp) {
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

        /*
         * Moving an entire face-up stack to an empty column
         * does not reveal a card or create meaningful progress.
         *
         * This prevents King stacks from being suggested
         * back and forth between empty columns.
         */
        const movesEntireColumn = cardIndex === 0;
        const movingToEmptyColumn = targetColumn.length === 0;

        if (movesEntireColumn && movingToEmptyColumn) {
          continue;
        }

        const revealsHiddenCard =
          cardIndex > 0 && !sourceColumn[cardIndex - 1].faceUp;

        if (!revealsHiddenCard) {
          continue;
        }

        hints.push({
          type: "tableau-to-tableau",
          sourceColumnIndex,
          cardIndex,
          targetColumnIndex,
          cardId: movingCards[0].id,
        });
      }
    }
  }

  if (hasPlayableDrawCard(board)) {
    hints.push({
      type: "stock",
    });
  }

  return hints;
}

export function getKlondikeHint(board: KlondikeBoardState): KlondikeHint {
  const hints = getKlondikeHints(board);

  return (
    hints[0] ?? {
      type: "none",
    }
  );
}
