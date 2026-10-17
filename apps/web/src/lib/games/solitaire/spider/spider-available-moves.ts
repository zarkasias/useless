import { canMoveTableauSequence } from "./spider-rules";
import type { SpiderBoardState } from "./spider-types";

export function getTableauCardDestinations(
  board: SpiderBoardState,
  sourceColumnIndex: number,
  cardIndex: number,
): number[] {
  if (!Number.isInteger(sourceColumnIndex) || !Number.isInteger(cardIndex)) {
    return [];
  }

  const sourceColumn = board.tableau[sourceColumnIndex];

  if (!sourceColumn || cardIndex < 0 || cardIndex >= sourceColumn.length) {
    return [];
  }

  const movingCards = sourceColumn.slice(cardIndex);
  const destinations: number[] = [];

  for (let columnIndex = 0; columnIndex < board.tableau.length; columnIndex++) {
    if (columnIndex === sourceColumnIndex) {
      continue;
    }

    if (canMoveTableauSequence(movingCards, board.tableau[columnIndex])) {
      destinations.push(columnIndex);
    }
  }

  return destinations;
}
