import { flipTopCardIfNeeded } from "@/lib/games/solitaire/core/tableau-utils";

import { isValidTableauSequence } from "./spider-rules";
import type { SpiderBoardState } from "./spider-types";

export function collectCompletedRuns(
  board: SpiderBoardState,
): SpiderBoardState {
  const completedRuns = [...board.completedRuns];
  let changed = false;

  const tableau = board.tableau.map((column) => {
    let nextColumn = column;

    while (nextColumn.length >= 13) {
      const run = nextColumn.slice(-13);
      const firstCard = run[0];
      const lastCard = run[run.length - 1];

      if (
        !firstCard ||
        !lastCard ||
        firstCard.rank !== "K" ||
        lastCard.rank !== "A" ||
        !isValidTableauSequence(run)
      ) {
        break;
      }

      completedRuns.push({
        suit: firstCard.suit,
        cards: run,
      });

      nextColumn = flipTopCardIfNeeded(nextColumn.slice(0, -13));
      changed = true;
    }

    return nextColumn;
  });

  if (!changed) {
    return board;
  }

  return {
    ...board,
    tableau,
    completedRuns,
  };
}
