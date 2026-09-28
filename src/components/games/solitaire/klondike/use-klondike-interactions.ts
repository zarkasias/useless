"use client";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

import {
  drawFromStock,
  recycleWasteToStock,
  moveTableauSequence,
  moveWasteCardToTableau,
  moveWasteCardToFoundation,
  moveTableauCardToFoundation,
  moveFoundationCardToTableau,
} from "@/lib/games/solitaire/klondike/klondike-moves";

export interface SelectedTableauCard {
  columnIndex: number;
  cardIndex: number;
}

type CardSource =
  | ({ type: "tableau" } & SelectedTableauCard)
  | { type: "waste" }
  | { type: "foundation"; foundationIndex: number };

interface UseKlondikeInteractionsProps {
  board: KlondikeBoardState;
  setBoard: Dispatch<SetStateAction<KlondikeBoardState | null>>;
  isComplete: boolean;
}

export function useKlondikeInteractions({
  board,
  setBoard,
  isComplete,
}: UseKlondikeInteractionsProps) {
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [selectedTableauCard, setSelectedTableauCard] =
    useState<SelectedTableauCard | null>(null);

  const [selectedFoundationIndex, setSelectedFoundationIndex] = useState<
    number | null
  >(null);

  const [dragSource, setDragSource] = useState<CardSource | null>(null);

  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const previousFaceUpState = useRef<Map<string, boolean> | null>(null);

  const registerSuccessfulMove = () => {
    setMoveCount((count) => count + 1);
    setHasStarted(true);
  };

  useEffect(() => {
    if (!hasStarted || isComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasStarted, isComplete]);

  useEffect(() => {
    const currentFaceUpState = new Map<string, boolean>();

    const allCards = [
      ...board.stock,
      ...board.waste,
      ...board.foundations.flatMap((foundation) => foundation.cards),
      ...board.tableau.flat(),
    ];

    for (const card of allCards) {
      currentFaceUpState.set(card.id, card.faceUp);
    }

    if (previousFaceUpState.current) {
      const newlyFlippedCard = allCards.find((card) => {
        const wasFaceUp = previousFaceUpState.current?.get(card.id) ?? false;

        return !wasFaceUp && card.faceUp;
      });

      if (newlyFlippedCard) {
        setFlippedCardId(newlyFlippedCard.id);
      }
    }

    previousFaceUpState.current = currentFaceUpState;
  }, [board]);

  const handleStockClick = () => {
    if (board.stock.length > 0) {
      const nextBoard = drawFromStock(board);

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }
    } else {
      const nextBoard = recycleWasteToStock(board);

      if (nextBoard) {
        setBoard(nextBoard);
      }
    }

    setSelectedCardId(null);
    setSelectedTableauCard(null);
    setSelectedFoundationIndex(null);
  };

  const handleTableauClick = (columnIndex: number) => {
    // Foundation → Tableau
    if (selectedFoundationIndex !== null) {
      const nextBoard = moveFoundationCardToTableau(
        board,
        selectedFoundationIndex,
        columnIndex,
      );

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedFoundationIndex(null);
      return;
    }

    // Tableau → Tableau
    if (selectedTableauCard) {
      const nextBoard = moveTableauSequence(
        board,
        selectedTableauCard.columnIndex,
        selectedTableauCard.cardIndex,
        columnIndex,
      );

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedTableauCard(null);
      return;
    }

    // Waste → Tableau
    const topWasteCard = board.waste[board.waste.length - 1];

    if (!topWasteCard) {
      return;
    }

    if (selectedCardId !== topWasteCard.id) {
      return;
    }

    const nextBoard = moveWasteCardToTableau(board, columnIndex);

    if (nextBoard) {
      setBoard(nextBoard);
      registerSuccessfulMove();
    }

    setSelectedCardId(null);
  };

  const handleFoundationClick = (foundationIndex: number) => {
    // Tableau → Foundation
    if (selectedTableauCard) {
      const column = board.tableau[selectedTableauCard.columnIndex];
      if (selectedTableauCard.cardIndex !== column.length - 1) {
        setSelectedTableauCard(null);
        return;
      }

      const nextBoard = moveTableauCardToFoundation(
        board,
        selectedTableauCard.columnIndex,
        foundationIndex,
      );

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedTableauCard(null);
      return;
    }

    // Waste → Foundation
    const topWasteCard = board.waste[board.waste.length - 1];

    if (!topWasteCard) {
      return;
    }

    if (selectedCardId !== topWasteCard.id) {
      return;
    }

    const nextBoard = moveWasteCardToFoundation(board, foundationIndex);

    if (nextBoard) {
      setBoard(nextBoard);
      registerSuccessfulMove();
    }

    setSelectedCardId(null);
  };

  const handleTableauCardClick = (columnIndex: number, cardIndex: number) => {
    const card = board.tableau[columnIndex]?.[cardIndex];

    if (!card) {
      return;
    }

    const isSameSelection =
      selectedTableauCard?.columnIndex === columnIndex &&
      selectedTableauCard.cardIndex === cardIndex;

    // Clicking the same selected card again deselects it
    if (isSameSelection) {
      setSelectedTableauCard(null);
      return;
    }

    // If a tableau card is already selected,
    // clicking another card attempts a move
    if (selectedTableauCard) {
      handleTableauClick(columnIndex);
      return;
    }

    // If a waste card is selected,
    // clicking a tableau card attempts a move
    if (selectedCardId) {
      handleTableauClick(columnIndex);
      return;
    }

    // If a foundation card is selected,
    // clicking a tableau card attempts a move
    if (selectedFoundationIndex !== null) {
      handleTableauClick(columnIndex);
      return;
    }

    // Face-down cards cannot be selected
    if (!card.faceUp) {
      return;
    }

    // Otherwise select this tableau card
    setSelectedTableauCard({
      columnIndex,
      cardIndex,
    });

    setSelectedCardId(null);
    setSelectedFoundationIndex(null);
  };

  const getSelectedSource = (): CardSource | null => {
    if (selectedTableauCard) {
      return { type: "tableau", ...selectedTableauCard };
    }
    if (selectedFoundationIndex !== null) {
      return { type: "foundation", foundationIndex: selectedFoundationIndex };
    }
    if (selectedCardId === board.waste[board.waste.length - 1]?.id) {
      return { type: "waste" };
    }
    return null;
  };

  // Highlights and drops use the same move rules and the same source.
  const boardAfterTableauMove = (
    source: CardSource | null,
    columnIndex: number,
  ) => {
    switch (source?.type) {
      case "tableau":
        return moveTableauSequence(
          board, source.columnIndex, source.cardIndex, columnIndex,
        );
      case "waste":
        return moveWasteCardToTableau(board, columnIndex);
      case "foundation":
        return moveFoundationCardToTableau(
          board, source.foundationIndex, columnIndex,
        );
      default:
        return null;
    }
  };

  const boardAfterFoundationMove = (
    source: CardSource | null,
    foundationIndex: number,
  ) => {
    if (source?.type === "waste") {
      return moveWasteCardToFoundation(board, foundationIndex);
    }

    if (source?.type === "tableau") {
      const column = board.tableau[source.columnIndex];
      // A sequence cannot be placed on a foundation, even if its last card fits.
      if (source.cardIndex === column.length - 1) {
        return moveTableauCardToFoundation(
          board, source.columnIndex, foundationIndex,
        );
      }
    }

    return null;
  };

  const isValidTableauTarget = (columnIndex: number) =>
    boardAfterTableauMove(dragSource ?? getSelectedSource(), columnIndex) !== null;

  const isValidFoundationTarget = (foundationIndex: number) =>
    boardAfterFoundationMove(dragSource ?? getSelectedSource(), foundationIndex) !== null;

  const startDrag = (
    source: CardSource,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "klondike-card");
    setSelectedCardId(null);
    setSelectedTableauCard(null);
    setSelectedFoundationIndex(null);
    setDragSource(source);
  };

  const handleDragEnd = () => setDragSource(null);

  const handleTableauDragStart = (
    columnIndex: number,
    cardIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => startDrag({ type: "tableau", columnIndex, cardIndex }, event);

  const handleWasteDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    if (!board.waste.length) {
      event.preventDefault();
      return;
    }
    startDrag({ type: "waste" }, event);
  };

  const handleFoundationDragStart = (
    foundationIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    if (!board.foundations[foundationIndex].cards.length) {
      event.preventDefault();
      return;
    }
    startDrag({ type: "foundation", foundationIndex }, event);
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (dragSource) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const finishDrop = (nextBoard: KlondikeBoardState | null) => {
    if (nextBoard) {
      setBoard(nextBoard);
      registerSuccessfulMove();
    }
    handleDragEnd();
  };

  const handleTableauDrop = (
    columnIndex: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    finishDrop(boardAfterTableauMove(dragSource, columnIndex));
  };

  const handleFoundationDrop = (
    foundationIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    finishDrop(boardAfterFoundationMove(dragSource, foundationIndex));
  };

  const resetInteractions = () => {
    setMoveCount(0);
    setHasStarted(false);
    setElapsedSeconds(0);
    setSelectedCardId(null);
    setSelectedTableauCard(null);
    setSelectedFoundationIndex(null);
    setDragSource(null);
    setFlippedCardId(null);

    previousFaceUpState.current = null;
  };

  return {
    moveCount,
    elapsedSeconds,

    selectedCardId,
    setSelectedCardId,

    selectedTableauCard,
    setSelectedTableauCard,

    selectedFoundationIndex,
    setSelectedFoundationIndex,

    dragSource,
    handleDragEnd,

    flippedCardId,

    handleStockClick,
    handleTableauClick,
    handleFoundationClick,
    handleTableauCardClick,
    isValidTableauTarget,
    isValidFoundationTarget,

    handleTableauDragStart,
    handleTableauDragOver: handleDragOver,
    handleTableauDrop,

    handleWasteDragStart,
    handleFoundationDragOver: handleDragOver,
    handleFoundationDragStart,
    handleFoundationDrop,
    resetInteractions,
  };
}
