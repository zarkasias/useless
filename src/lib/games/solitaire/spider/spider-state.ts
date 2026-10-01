import type { SpiderBoardState } from "./spider-types";

export function isSpiderComplete(board: SpiderBoardState): boolean {
  return (
    board.completedRuns.length === 8 &&
    board.stock.length === 0 &&
    board.tableau.every((column) => column.length === 0)
  );
}
