import type { KlondikeBoardState } from "./klondike-types";

export function validateKlondikeBoard(board: KlondikeBoardState): boolean {
  const tableauCount = board.tableau.reduce(
    (total, column) => total + column.length,
    0,
  );

  const foundationCount = board.foundations.reduce(
    (total, foundation) => total + foundation.cards.length,
    0,
  );

  const totalCards =
    board.stock.length + board.waste.length + tableauCount + foundationCount;

  if (totalCards !== 52) {
    return false;
  }

  if (board.tableau.length !== 7) {
    return false;
  }

  if (board.stock.length !== 24) {
    return false;
  }

  if (board.waste.length !== 0) {
    return false;
  }

  if (foundationCount !== 0) {
    return false;
  }

  for (let column = 0; column < board.tableau.length; column++) {
    const cards = board.tableau[column];

    if (cards.length !== column + 1) {
      return false;
    }

    const faceUpCards = cards.filter((card) => card.faceUp);

    if (faceUpCards.length !== 1) {
      return false;
    }

    if (!cards[cards.length - 1]?.faceUp) {
      return false;
    }
  }

  return true;
}
