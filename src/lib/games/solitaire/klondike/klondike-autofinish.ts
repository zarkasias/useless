import type { KlondikeBoardState } from "./klondike-types";
import {
  moveTableauCardToFoundation,
  moveWasteCardToFoundation,
} from "./klondike-moves";

function cloneBoard(board: KlondikeBoardState): KlondikeBoardState {
  return {
    stock: board.stock.map((card) => ({ ...card })),
    waste: board.waste.map((card) => ({ ...card })),
    foundations: board.foundations.map((foundation) => ({
      ...foundation,
      cards: foundation.cards.map((card) => ({ ...card })),
    })),
    tableau: board.tableau.map((column) => column.map((card) => ({ ...card }))),
  };
}

function getFoundationIndexForSuit(
  board: KlondikeBoardState,
  suit: KlondikeBoardState["foundations"][number]["suit"],
): number {
  return board.foundations.findIndex((foundation) => foundation.suit === suit);
}

export function canAutoFinishKlondike(board: KlondikeBoardState): boolean {
  // If there are still hidden tableau cards, the game is not
  // deterministic enough to auto-finish yet.
  const hasFaceDownTableauCards = board.tableau.some((column) =>
    column.some((card) => !card.faceUp),
  );

  if (hasFaceDownTableauCards) {
    return false;
  }

  // If stock still contains cards, the player has not exposed
  // everything yet.
  if (board.stock.length > 0) {
    return false;
  }

  let simulatedBoard = cloneBoard(board);

  while (true) {
    let madeProgress = false;

    // Try waste → foundation
    const topWasteCard = simulatedBoard.waste[simulatedBoard.waste.length - 1];

    if (topWasteCard) {
      const foundationIndex = getFoundationIndexForSuit(
        simulatedBoard,
        topWasteCard.suit,
      );

      if (foundationIndex !== -1) {
        const nextBoard = moveWasteCardToFoundation(
          simulatedBoard,
          foundationIndex,
        );

        if (nextBoard) {
          simulatedBoard = nextBoard;
          madeProgress = true;
        }
      }
    }

    if (madeProgress) {
      continue;
    }

    // Try tableau → foundation
    for (
      let columnIndex = 0;
      columnIndex < simulatedBoard.tableau.length;
      columnIndex++
    ) {
      const column = simulatedBoard.tableau[columnIndex];
      const topCard = column[column.length - 1];

      if (!topCard) {
        continue;
      }

      const foundationIndex = getFoundationIndexForSuit(
        simulatedBoard,
        topCard.suit,
      );

      if (foundationIndex === -1) {
        continue;
      }

      const nextBoard = moveTableauCardToFoundation(
        simulatedBoard,
        columnIndex,
        foundationIndex,
      );

      if (nextBoard) {
        simulatedBoard = nextBoard;
        madeProgress = true;
        break;
      }
    }

    if (!madeProgress) {
      break;
    }
  }

  const foundationCardCount = simulatedBoard.foundations.reduce(
    (total, foundation) => total + foundation.cards.length,
    0,
  );

  return foundationCardCount === 52;
}
