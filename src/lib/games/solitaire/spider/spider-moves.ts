import { flipTopCardIfNeeded } from "@/lib/games/solitaire/core/tableau-utils";
import { collectCompletedRuns } from "./spider-completed-runs";

import { canDealFromStock, canMoveTableauSequence } from "./spider-rules";
import type { SpiderBoardState } from "./spider-types";

export function moveTableauSequence(
  board: SpiderBoardState,
  fromColumnIndex: number,
  cardIndex: number,
  toColumnIndex: number,
): SpiderBoardState | null {
  if (
    !Number.isInteger(fromColumnIndex) ||
    !Number.isInteger(toColumnIndex) ||
    !Number.isInteger(cardIndex) ||
    fromColumnIndex === toColumnIndex
  ) {
    return null;
  }

  const sourceColumn = board.tableau[fromColumnIndex];
  const targetColumn = board.tableau[toColumnIndex];

  if (
    !sourceColumn ||
    !targetColumn ||
    cardIndex < 0 ||
    cardIndex >= sourceColumn.length
  ) {
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

  return collectCompletedRuns({
    ...board,
    tableau: nextTableau,
  });
}

export function dealFromStock(
  board: SpiderBoardState,
): SpiderBoardState | null {
  if (!canDealFromStock(board)) {
    return null;
  }

  const dealtCards = board.stock.slice(0, board.tableau.length);

  const tableau = board.tableau.map((column, columnIndex) => [
    ...column,
    {
      ...dealtCards[columnIndex],
      faceUp: true,
    },
  ]);

  return collectCompletedRuns({
    ...board,
    stock: board.stock.slice(board.tableau.length),
    tableau,
  });
}
