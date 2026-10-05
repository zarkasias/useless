import { getTableauCardDestinations } from "./spider-available-moves";
import { canDealFromStock } from "./spider-rules";
import { isSpiderComplete } from "./spider-state";
import type { SpiderBoardState } from "./spider-types";

export function hasAvailableSpiderMove(board: SpiderBoardState): boolean {
  if (canDealFromStock(board)) {
    return true;
  }

  for (let columnIndex = 0; columnIndex < board.tableau.length; columnIndex++) {
    const column = board.tableau[columnIndex];

    for (let cardIndex = 0; cardIndex < column.length; cardIndex++) {
      if (
        getTableauCardDestinations(board, columnIndex, cardIndex).length > 0
      ) {
        return true;
      }
    }
  }

  return false;
}

export function isSpiderStalemate(board: SpiderBoardState): boolean {
  return !isSpiderComplete(board) && !hasAvailableSpiderMove(board);
}
