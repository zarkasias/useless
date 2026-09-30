import { useState } from "react";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import {
  getMobileMoveDecision,
  getTableauCardDestinations,
  getWasteCardDestinations,
  type KlondikeMobileDestination,
} from "@/lib/games/solitaire/klondike/klondike-mobile-moves";
import {
  moveTableauSequence,
  moveTableauCardToFoundation,
  moveWasteCardToTableau,
  moveWasteCardToFoundation,
  moveFoundationCardToTableau,
} from "@/lib/games/solitaire/klondike/klondike-moves";

type Source =
  | { type: "waste" }
  | { type: "tableau"; columnIndex: number; cardIndex: number }
  | { type: "foundation"; foundationIndex: number };
interface Props {
  board: KlondikeBoardState;
  onMove: (board: KlondikeBoardState) => void;
}

export function useKlondikeMobileInteractions({ board, onMove }: Props) {
  const [pending, setPending] = useState<{
    board: KlondikeBoardState;
    source: Source;
    destinations: KlondikeMobileDestination[];
  } | null>(null);
  // A draw, reset, or auto-finish invalidates any earlier selection.
  const active = pending?.board === board ? pending : null;
  const [notice, setNotice] = useState("Tap a card to move it.");
  const clearPendingMove = () => {
    setPending(null);
    setNotice("Tap a card to move it.");
  };

  const execute = (source: Source, destination: KlondikeMobileDestination) => {
    let next: KlondikeBoardState | null = null;
    if (source.type === "waste") {
      next =
        destination.type === "foundation"
          ? moveWasteCardToFoundation(board, destination.foundationIndex)
          : moveWasteCardToTableau(board, destination.columnIndex);
    } else if (source.type === "tableau") {
      next =
        destination.type === "foundation"
          ? moveTableauCardToFoundation(
              board,
              source.columnIndex,
              destination.foundationIndex,
            )
          : moveTableauSequence(
              board,
              source.columnIndex,
              source.cardIndex,
              destination.columnIndex,
            );
    } else if (destination.type === "tableau") {
      next = moveFoundationCardToTableau(
        board,
        source.foundationIndex,
        destination.columnIndex,
      );
    }
    clearPendingMove();
    if (next) {
      onMove(next);
      setNotice("Card moved. Tap another card to continue.");
    }
  };

  const select = (
    source: Source,
    destinations: KlondikeMobileDestination[],
  ) => {
    const decision = getMobileMoveDecision(destinations);
    if (decision.type === "move") {
      execute(source, decision.destination);
    } else if (decision.type === "choose") {
      setPending({ board, source, destinations: decision.destinations });
      setNotice("Choose a highlighted destination.");
    } else {
      clearPendingMove();
      setNotice("No legal move for that card. Try another card or draw.");
    }
  };

  const handleDestinationTap = (destination: KlondikeMobileDestination) => {
    const match = active?.destinations.some((item) =>
      item.type === "tableau" && destination.type === "tableau"
        ? item.columnIndex === destination.columnIndex
        : item.type === "foundation" &&
          destination.type === "foundation" &&
          item.foundationIndex === destination.foundationIndex,
    );
    if (!active || !match) return false;
    execute(active.source, destination);
    return true;
  };

  return {
    pendingSource: active?.source ?? null,
    pendingDestinations: active?.destinations ?? [],
    notice,
    clearPendingMove,
    handleDestinationTap,
    handleWasteTap: () =>
      select({ type: "waste" }, getWasteCardDestinations(board)),
    handleTableauCardTap: (columnIndex: number, cardIndex: number) => {
      if (!handleDestinationTap({ type: "tableau", columnIndex })) {
        select(
          { type: "tableau", columnIndex, cardIndex },
          getTableauCardDestinations(board, columnIndex, cardIndex),
        );
      }
    },
    handleFoundationTap: (foundationIndex: number) => {
      if (handleDestinationTap({ type: "foundation", foundationIndex })) return;
      const destinations: KlondikeMobileDestination[] = [];
      board.tableau.forEach((_, columnIndex) => {
        if (moveFoundationCardToTableau(board, foundationIndex, columnIndex)) {
          destinations.push({ type: "tableau", columnIndex });
        }
      });
      select({ type: "foundation", foundationIndex }, destinations);
    },
  };
}
