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

import {
  canMoveTableauSequence,
  canPlaceOnEmptyTableau,
  canPlaceOnTableau,
  canPlaceOnFoundation,
} from "@/lib/games/solitaire/klondike/klondike-rules";

export interface SelectedTableauCard {
  columnIndex: number;
  cardIndex: number;
}

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

  const [draggedTableauCard, setDraggedTableauCard] =
    useState<SelectedTableauCard | null>(null);

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

  const isValidTableauTarget = (columnIndex: number): boolean => {
    const targetColumn = board.tableau[columnIndex];

    if (selectedFoundationIndex !== null) {
      const foundation = board.foundations[selectedFoundationIndex];
      const movingCard = foundation.cards[foundation.cards.length - 1];

      if (!movingCard) {
        return false;
      }

      if (targetColumn.length === 0) {
        return canPlaceOnEmptyTableau(movingCard);
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      return canPlaceOnTableau(movingCard, targetCard);
    }

    if (selectedTableauCard) {
      const movingCards = board.tableau[selectedTableauCard.columnIndex].slice(
        selectedTableauCard.cardIndex,
      );

      return canMoveTableauSequence(movingCards, targetColumn);
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (selectedCardId && topWasteCard?.id === selectedCardId) {
      if (targetColumn.length === 0) {
        return canPlaceOnEmptyTableau(topWasteCard);
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      return canPlaceOnTableau(topWasteCard, targetCard);
    }

    return false;
  };

  const isValidFoundationTarget = (foundationIndex: number): boolean => {
    const foundation = board.foundations[foundationIndex];

    if (selectedTableauCard) {
      const column = board.tableau[selectedTableauCard.columnIndex];

      const movingCard = column[column.length - 1];

      if (!movingCard) {
        return false;
      }

      // Only the top tableau card can move to foundation
      if (selectedTableauCard.cardIndex !== column.length - 1) {
        return false;
      }

      return canPlaceOnFoundation(movingCard, foundation);
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (selectedCardId && topWasteCard?.id === selectedCardId) {
      return canPlaceOnFoundation(topWasteCard, foundation);
    }

    return false;
  };

  const handleTableauDragStart = (columnIndex: number, cardIndex: number) => {
    setDraggedTableauCard({
      columnIndex,
      cardIndex,
    });
  };

  const handleTableauDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleTableauDrop = (
    targetColumnIndex: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    // Foundation → Tableau
    if (selectedFoundationIndex !== null) {
      const nextBoard = moveFoundationCardToTableau(
        board,
        selectedFoundationIndex,
        targetColumnIndex,
      );

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedFoundationIndex(null);
      return;
    }

    // Waste → Tableau
    if (selectedCardId) {
      const nextBoard = moveWasteCardToTableau(board, targetColumnIndex);

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedCardId(null);
      return;
    }

    // Tableau → Tableau
    if (!draggedTableauCard) {
      return;
    }

    const nextBoard = moveTableauSequence(
      board,
      draggedTableauCard.columnIndex,
      draggedTableauCard.cardIndex,
      targetColumnIndex,
    );

    if (nextBoard) {
      setBoard(nextBoard);
      registerSuccessfulMove();
    }

    setDraggedTableauCard(null);
  };

  const handleWasteDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    const topWasteCard = board.waste[board.waste.length - 1];

    if (!topWasteCard) {
      event.preventDefault();
      return;
    }

    setSelectedCardId(topWasteCard.id);
    setSelectedTableauCard(null);
    setSelectedFoundationIndex(null);
  };

  const handleFoundationDragOver = (
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleFoundationDrop = (
    foundationIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    // Tableau → Foundation
    if (draggedTableauCard) {
      const nextBoard = moveTableauCardToFoundation(
        board,
        draggedTableauCard.columnIndex,
        foundationIndex,
      );

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setDraggedTableauCard(null);
      return;
    }

    // Waste → Foundation
    if (selectedCardId) {
      const nextBoard = moveWasteCardToFoundation(board, foundationIndex);

      if (nextBoard) {
        setBoard(nextBoard);
        registerSuccessfulMove();
      }

      setSelectedCardId(null);
    }
  };

  const handleFoundationDragStart = (
    foundationIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => {
    const foundation = board.foundations[foundationIndex];
    const topCard = foundation.cards[foundation.cards.length - 1];

    if (!topCard) {
      event.preventDefault();
      return;
    }

    setSelectedFoundationIndex(foundationIndex);
    setSelectedCardId(null);
    setSelectedTableauCard(null);
  };

  const resetInteractions = () => {
    setMoveCount(0);
    setHasStarted(false);
    setElapsedSeconds(0);
    setSelectedCardId(null);
    setSelectedTableauCard(null);
    setSelectedFoundationIndex(null);
    setDraggedTableauCard(null);
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

    draggedTableauCard,
    setDraggedTableauCard,

    flippedCardId,

    handleStockClick,
    handleTableauClick,
    handleFoundationClick,
    handleTableauCardClick,
    isValidTableauTarget,
    isValidFoundationTarget,

    handleTableauDragStart,
    handleTableauDragOver,
    handleTableauDrop,

    handleWasteDragStart,
    handleFoundationDragOver,
    handleFoundationDragStart,
    handleFoundationDrop,
    resetInteractions,
  };
}
