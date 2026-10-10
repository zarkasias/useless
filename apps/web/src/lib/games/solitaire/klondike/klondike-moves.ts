import type { KlondikeBoardState } from "./klondike-types";
import {
  canMoveTableauSequence,
  canPlaceOnFoundation,
  canPlaceOnEmptyTableau,
  canPlaceOnTableau,
} from "./klondike-rules";

import { flipTopCardIfNeeded } from "../core/tableau-utils";

export function moveTableauSequence(
  board: KlondikeBoardState,
  fromColumnIndex: number,
  cardIndex: number,
  toColumnIndex: number,
): KlondikeBoardState | null {
  if (fromColumnIndex === toColumnIndex) {
    return null;
  }

  const sourceColumn = board.tableau[fromColumnIndex];
  const targetColumn = board.tableau[toColumnIndex];

  if (!sourceColumn || !targetColumn) {
    return null;
  }

  const movingCards = sourceColumn.slice(cardIndex);

  if (!canMoveTableauSequence(movingCards, targetColumn)) {
    return null;
  }

  const nextTableau = board.tableau.map((column) => [...column]);

  nextTableau[fromColumnIndex] = flipTopCardIfNeeded(
    sourceColumn.slice(0, cardIndex),
  );

  nextTableau[toColumnIndex] = [...targetColumn, ...movingCards];

  return {
    ...board,
    tableau: nextTableau,
  };
}

export function moveTableauCardToFoundation(
  board: KlondikeBoardState,
  fromColumnIndex: number,
  foundationIndex: number,
): KlondikeBoardState | null {
  const sourceColumn = board.tableau[fromColumnIndex];
  const foundation = board.foundations[foundationIndex];

  if (!sourceColumn || !foundation) {
    return null;
  }

  const movingCard = sourceColumn[sourceColumn.length - 1];

  if (!movingCard) {
    return null;
  }

  if (!canPlaceOnFoundation(movingCard, foundation)) {
    return null;
  }

  const nextTableau = board.tableau.map((column) => [...column]);

  nextTableau[fromColumnIndex] = flipTopCardIfNeeded(sourceColumn.slice(0, -1));

  const nextFoundations = board.foundations.map((item, index) =>
    index === foundationIndex
      ? {
          ...item,
          cards: [...item.cards, movingCard],
        }
      : {
          ...item,
          cards: [...item.cards],
        },
  );

  return {
    ...board,
    tableau: nextTableau,
    foundations: nextFoundations,
  };
}

export function moveWasteCardToFoundation(
  board: KlondikeBoardState,
  foundationIndex: number,
): KlondikeBoardState | null {
  const foundation = board.foundations[foundationIndex];
  const movingCard = board.waste[board.waste.length - 1];

  if (!foundation || !movingCard) {
    return null;
  }

  if (!canPlaceOnFoundation(movingCard, foundation)) {
    return null;
  }

  const nextWaste = board.waste.slice(0, -1);

  const nextFoundations = board.foundations.map((item, index) =>
    index === foundationIndex
      ? {
          ...item,
          cards: [...item.cards, movingCard],
        }
      : {
          ...item,
          cards: [...item.cards],
        },
  );

  return {
    ...board,
    waste: nextWaste,
    foundations: nextFoundations,
  };
}

export function moveWasteCardToTableau(
  board: KlondikeBoardState,
  toColumnIndex: number,
): KlondikeBoardState | null {
  const movingCard = board.waste[board.waste.length - 1];
  const targetColumn = board.tableau[toColumnIndex];

  if (!movingCard || !targetColumn) {
    return null;
  }

  const canMove =
    targetColumn.length === 0
      ? canPlaceOnEmptyTableau(movingCard)
      : canPlaceOnTableau(movingCard, targetColumn[targetColumn.length - 1]);

  if (!canMove) {
    return null;
  }

  const nextWaste = board.waste.slice(0, -1);

  const nextTableau = board.tableau.map((column, index) =>
    index === toColumnIndex ? [...column, movingCard] : [...column],
  );

  return {
    ...board,
    waste: nextWaste,
    tableau: nextTableau,
  };
}

export function drawFromStock(board: KlondikeBoardState): KlondikeBoardState {
  if (board.stock.length === 0) {
    return board;
  }

  const nextStock = [...board.stock];
  const drawnCard = nextStock.pop();

  if (!drawnCard) {
    return board;
  }

  const nextWaste = [
    ...board.waste,
    {
      ...drawnCard,
      faceUp: true,
    },
  ];

  return {
    ...board,
    stock: nextStock,
    waste: nextWaste,
  };
}

export function recycleWasteToStock(
  board: KlondikeBoardState,
): KlondikeBoardState {
  if (board.stock.length > 0 || board.waste.length === 0) {
    return board;
  }

  const nextStock = [...board.waste].reverse().map((card) => ({
    ...card,
    faceUp: false,
  }));

  return {
    ...board,
    stock: nextStock,
    waste: [],
  };
}

export function moveFoundationCardToTableau(
  board: KlondikeBoardState,
  foundationIndex: number,
  toColumnIndex: number,
): KlondikeBoardState | null {
  const foundation = board.foundations[foundationIndex];
  const targetColumn = board.tableau[toColumnIndex];

  if (!foundation || !targetColumn) {
    return null;
  }

  const movingCard = foundation.cards[foundation.cards.length - 1];

  if (!movingCard) {
    return null;
  }

  const canMove =
    targetColumn.length === 0
      ? canPlaceOnEmptyTableau(movingCard)
      : canPlaceOnTableau(movingCard, targetColumn[targetColumn.length - 1]);

  if (!canMove) {
    return null;
  }

  const nextFoundations = board.foundations.map((item, index) =>
    index === foundationIndex
      ? {
          ...item,
          cards: item.cards.slice(0, -1),
        }
      : {
          ...item,
          cards: [...item.cards],
        },
  );

  const nextTableau = board.tableau.map((column, index) =>
    index === toColumnIndex ? [...column, movingCard] : [...column],
  );

  return {
    ...board,
    foundations: nextFoundations,
    tableau: nextTableau,
  };
}
