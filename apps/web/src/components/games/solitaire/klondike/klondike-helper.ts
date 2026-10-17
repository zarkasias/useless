import { createStandardDeck } from "@/lib/games/solitaire/core/deck";
import { shuffleDeck } from "@/lib/games/solitaire/core/shuffle";
import { createKlondikeBoard } from "@/lib/games/solitaire/klondike/klondike-setup";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

export function createInitialBoard(): KlondikeBoardState {
  const deck = createStandardDeck();
  const shuffledDeck = shuffleDeck(deck);

  return createKlondikeBoard(shuffledDeck);
}
