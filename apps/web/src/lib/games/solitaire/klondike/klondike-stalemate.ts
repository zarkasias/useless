import type { KlondikeBoardState } from "./klondike-types";
import { canMoveTableauSequence, canPlaceOnFoundation } from "./klondike-rules";
import { isKlondikeComplete } from "./klondike-state";

export type KlondikeProgressStatus = "available" | "stalemate" | "unknown";

// Column positions have no effect on legal plays. Sorting makes moving a
// whole King stack between empty slots the same position, and breaks cycles.
function positionKey(board: KlondikeBoardState): string {
  return JSON.stringify(
    board.tableau
      .map((column) =>
        column.map((card) => [card.suit, card.rank, card.faceUp]),
      )
      .map((column) => JSON.stringify(column))
      .sort(),
  );
}

/**
 * Proves whether progress is reachable without foundation-to-tableau moves.
 * Progress means a foundation advance, revealing a hidden card, or playing
 * a stock/waste card. A playable card is conservative evidence to keep playing;
 * it does not imply that the game is winnable.
 *
 * Only tableau rearrangements need searching: foundations and stock/waste
 * stay fixed until progress. With draw-one and unlimited recycling, every
 * stock/waste card can become the top waste card without other moves.
 * Exhausting the budget is inconclusive and must never trigger a loss.
 */
export function getKlondikeProgressStatus(
  board: KlondikeBoardState,
  maxPositions = 2000,
): KlondikeProgressStatus {
  if (isKlondikeComplete(board)) return "available";

  const playableDrawCards = [...board.stock, ...board.waste].map((card) => ({
    ...card,
    faceUp: true,
  }));
  const pending = [board];
  const visited = new Set([positionKey(board)]);
  let examined = 0;

  while (pending.length > 0) {
    if (examined >= maxPositions) return "unknown";
    const current = pending.pop()!;
    examined++;

    for (const card of playableDrawCards) {
      if (
        current.foundations.some((foundation) =>
          canPlaceOnFoundation(card, foundation),
        ) ||
        current.tableau.some((column) => canMoveTableauSequence([card], column))
      ) {
        return "available";
      }
    }

    for (
      let sourceIndex = 0;
      sourceIndex < current.tableau.length;
      sourceIndex++
    ) {
      const source = current.tableau[sourceIndex];
      const top = source[source.length - 1];

      if (
        top &&
        current.foundations.some((foundation) =>
          canPlaceOnFoundation(top, foundation),
        )
      ) {
        return "available";
      }

      for (let cardIndex = 0; cardIndex < source.length; cardIndex++) {
        const moving = source.slice(cardIndex);
        for (
          let targetIndex = 0;
          targetIndex < current.tableau.length;
          targetIndex++
        ) {
          if (
            sourceIndex === targetIndex ||
            !canMoveTableauSequence(moving, current.tableau[targetIndex])
          )
            continue;

          // The actual move automatically flips the newly exposed card.
          if (cardIndex > 0 && !source[cardIndex - 1].faceUp)
            return "available";

          const next = {
            ...current,
            tableau: current.tableau.map((column, index) =>
              index === sourceIndex
                ? source.slice(0, cardIndex)
                : index === targetIndex
                  ? [...column, ...moving]
                  : column,
            ),
          };
          const key = positionKey(next);
          if (visited.has(key)) continue;
          // Bound both memory and work. Unknown keeps the game playable.
          if (visited.size >= maxPositions) return "unknown";
          visited.add(key);
          pending.push(next);
        }
      }
    }
  }

  return "stalemate";
}

export function hasAvailableKlondikeMove(board: KlondikeBoardState): boolean {
  return getKlondikeProgressStatus(board) !== "stalemate";
}

export function isKlondikeStalemate(board: KlondikeBoardState): boolean {
  return getKlondikeProgressStatus(board) === "stalemate";
}
