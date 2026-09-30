import type { KlondikeBoardState } from "./klondike-types";

import {
  canPlaceOnTableau,
  canPlaceOnEmptyTableau,
  canMoveTableauSequence,
  canPlaceOnFoundation,
  isValidTableauSequence,
} from "./klondike-rules";

export type KlondikeMobileDestination =
  | {
      type: "foundation";
      foundationIndex: number;
    }
  | {
      type: "tableau";
      columnIndex: number;
    };

export type KlondikeMobileMoveDecision =
  | {
      type: "none";
    }
  | {
      type: "move";
      destination: KlondikeMobileDestination;
    }
  | {
      type: "choose";
      destinations: KlondikeMobileDestination[];
    };

export function getWasteCardDestinations(
  board: KlondikeBoardState,
): KlondikeMobileDestination[] {
  const topWasteCard = board.waste[board.waste.length - 1];

  if (!topWasteCard) {
    return [];
  }

  const destinations: KlondikeMobileDestination[] = [];

  for (
    let foundationIndex = 0;
    foundationIndex < board.foundations.length;
    foundationIndex++
  ) {
    const foundation = board.foundations[foundationIndex];

    if (canPlaceOnFoundation(topWasteCard, foundation)) {
      destinations.push({
        type: "foundation",
        foundationIndex,
      });
    }
  }

  for (let columnIndex = 0; columnIndex < board.tableau.length; columnIndex++) {
    const column = board.tableau[columnIndex];

    if (column.length === 0) {
      if (canPlaceOnEmptyTableau(topWasteCard)) {
        destinations.push({
          type: "tableau",
          columnIndex,
        });
      }

      continue;
    }

    const targetCard = column[column.length - 1];

    if (canPlaceOnTableau(topWasteCard, targetCard)) {
      destinations.push({
        type: "tableau",
        columnIndex,
      });
    }
  }

  return destinations;
}

export function getTableauCardDestinations(
  board: KlondikeBoardState,
  sourceColumnIndex: number,
  cardIndex: number,
): KlondikeMobileDestination[] {
  const sourceColumn = board.tableau[sourceColumnIndex];
  const card = sourceColumn?.[cardIndex];

  if (!card || !card.faceUp) {
    return [];
  }

  const movingCards = sourceColumn.slice(cardIndex);

  if (!isValidTableauSequence(movingCards)) {
    return [];
  }

  const destinations: KlondikeMobileDestination[] = [];

  // Only the top card can move to a foundation.
  const isTopCard = cardIndex === sourceColumn.length - 1;

  if (isTopCard) {
    for (
      let foundationIndex = 0;
      foundationIndex < board.foundations.length;
      foundationIndex++
    ) {
      const foundation = board.foundations[foundationIndex];

      if (canPlaceOnFoundation(card, foundation)) {
        destinations.push({
          type: "foundation",
          foundationIndex,
        });
      }
    }
  }

  // Sequence → tableau
  for (let columnIndex = 0; columnIndex < board.tableau.length; columnIndex++) {
    if (columnIndex === sourceColumnIndex) {
      continue;
    }

    const targetColumn = board.tableau[columnIndex];

    if (canMoveTableauSequence(movingCards, targetColumn)) {
      destinations.push({
        type: "tableau",
        columnIndex,
      });
    }
  }

  return destinations;
}

export function getMobileMoveDecision(
  destinations: KlondikeMobileDestination[],
): KlondikeMobileMoveDecision {
  if (destinations.length === 0) {
    return {
      type: "none",
    };
  }

  if (destinations.length === 1) {
    return {
      type: "move",
      destination: destinations[0],
    };
  }

  const foundationDestination = destinations.find(
    (destination) => destination.type === "foundation",
  );

  if (
    foundationDestination &&
    destinations.filter((destination) => destination.type === "foundation")
      .length === 1
  ) {
    return {
      type: "move",
      destination: foundationDestination,
    };
  }

  return {
    type: "choose",
    destinations,
  };
}
