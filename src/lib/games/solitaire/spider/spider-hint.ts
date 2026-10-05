import { getTableauCardDestinations } from "./spider-available-moves";
import { moveTableauSequence } from "./spider-moves";
import { canDealFromStock } from "./spider-rules";
import { isSpiderComplete } from "./spider-state";
import type { SpiderBoardState } from "./spider-types";

import { getRankValue } from "@/lib/games/solitaire/core/card-utils";

export type SpiderHint =
  | {
      type: "tableau-to-tableau";
      sourceColumnIndex: number;
      cardIndex: number;
      targetColumnIndex: number;
      reason: string;
    }
  | {
      type: "deal-stock";
      reason: string;
    };

export function getNextSpiderHint(board: SpiderBoardState): SpiderHint | null {
  if (isSpiderComplete(board)) {
    return null;
  }

  let bestHint: SpiderHint | null = null;
  let bestScore = -Infinity;

  for (
    let sourceColumnIndex = 0;
    sourceColumnIndex < board.tableau.length;
    sourceColumnIndex++
  ) {
    const source = board.tableau[sourceColumnIndex];

    for (let cardIndex = 0; cardIndex < source.length; cardIndex++) {
      const destinations = getTableauCardDestinations(
        board,
        sourceColumnIndex,
        cardIndex,
      );

      for (const targetColumnIndex of destinations) {
        const target = board.tableau[targetColumnIndex];

        // Moving an entire column into an empty column just relocates it.
        if (cardIndex === 0 && target.length === 0) {
          continue;
        }

        const nextBoard = moveTableauSequence(
          board,
          sourceColumnIndex,
          cardIndex,
          targetColumnIndex,
        );

        if (!nextBoard) {
          continue;
        }

        const completedRuns =
          nextBoard.completedRuns.length - board.completedRuns.length;

        const revealsCard = cardIndex > 0 && !source[cardIndex - 1].faceUp;

        const movingCard = source[cardIndex];
        const targetCard = target[target.length - 1];

        const joinsSameSuit =
          targetCard !== undefined && targetCard.suit === movingCard.suit;

        const createsEmptyColumn = cardIndex === 0 && target.length > 0;

        // Avoid recommending splitting a same-suit sequence when
        // an otherwise equally useful move keeps it intact.
        const previousCard = source[cardIndex - 1];
        const splitsSameSuit =
          previousCard !== undefined &&
          previousCard.faceUp &&
          previousCard.suit === movingCard.suit &&
          getRankValue(previousCard.rank) === getRankValue(movingCard.rank) + 1;

        const score =
          completedRuns * 1000 +
          (revealsCard ? 100 : 0) +
          (joinsSameSuit ? 30 : 0) +
          (createsEmptyColumn ? 20 : 0) -
          (splitsSameSuit ? 10 : 0);

        if (score <= bestScore) {
          continue;
        }

        bestScore = score;
        bestHint = {
          type: "tableau-to-tableau",
          sourceColumnIndex,
          cardIndex,
          targetColumnIndex,
          reason:
            completedRuns > 0
              ? "Complete a same-suit run."
              : revealsCard
                ? "Reveal a face-down card."
                : joinsSameSuit
                  ? "Build a same-suit sequence."
                  : createsEmptyColumn
                    ? "Free a column for rearranging cards."
                    : "Try rearranging these cards.",
        };
      }
    }
  }

  if (bestHint) {
    return bestHint;
  }

  if (canDealFromStock(board)) {
    return {
      type: "deal-stock",
      reason: "Deal a new row of cards.",
    };
  }

  return null;
}
