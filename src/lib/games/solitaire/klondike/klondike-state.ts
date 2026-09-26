import type { KlondikeBoardState } from "./klondike-types";

export function isKlondikeComplete(board: KlondikeBoardState): boolean {
  const foundationCount = board.foundations.reduce(
    (total, foundation) => total + foundation.cards.length,
    0,
  );

  return foundationCount === 52;
}
