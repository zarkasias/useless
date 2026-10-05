"use client";

import { useState, useEffect, useMemo } from "react";
import type { Dispatch, DragEvent, SetStateAction } from "react";

import {
  moveTableauSequence,
  dealFromStock,
} from "@/lib/games/solitaire/spider/spider-moves";

import { isSpiderStalemate } from "@/lib/games/solitaire/spider/spider-stalemate";

import {
  canDealFromStock,
  canMoveTableauSequence,
  isValidTableauSequence,
} from "@/lib/games/solitaire/spider/spider-rules";
import { isSpiderComplete } from "@/lib/games/solitaire/spider/spider-state";
import type {
  SpiderBoardState,
  SpiderMoveSource,
} from "@/lib/games/solitaire/spider/spider-types";

interface UseSpiderInteractionsProps {
  board: SpiderBoardState;
  setBoard: Dispatch<SetStateAction<SpiderBoardState | null>>;
}

export function useSpiderInteractions({
  board,
  setBoard,
}: UseSpiderInteractionsProps) {
  const [selectedTableauCard, setSelectedTableauCard] =
    useState<SpiderMoveSource | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [dragSource, setDragSource] = useState<SpiderMoveSource | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isComplete = isSpiderComplete(board);

  const isStalemate = useMemo(() => isSpiderStalemate(board), [board]);

  useEffect(() => {
    if (!hasStarted || isComplete || isStalemate) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [hasStarted, isComplete, isStalemate]);

  const canDeal = !isComplete && canDealFromStock(board);

  const applyMove = (nextBoard: SpiderBoardState | null): boolean => {
    if (isComplete || !nextBoard) {
      return false;
    }

    setBoard(nextBoard);
    setSelectedTableauCard(null);
    setMoveCount((count) => count + 1);
    setHasStarted(true);
    setDragSource(null);

    return true;
  };

  const handleStockClick = () => {
    if (!canDeal) {
      return;
    }

    applyMove(dealFromStock(board));
  };

  const handleTableauClick = (columnIndex: number) => {
    if (isComplete || !selectedTableauCard) {
      return;
    }

    applyMove(
      moveTableauSequence(
        board,
        selectedTableauCard.columnIndex,
        selectedTableauCard.cardIndex,
        columnIndex,
      ),
    );
  };

  const handleTableauCardClick = (columnIndex: number, cardIndex: number) => {
    if (isComplete) {
      return;
    }

    const isSameSelection =
      selectedTableauCard?.columnIndex === columnIndex &&
      selectedTableauCard.cardIndex === cardIndex;

    if (isSameSelection) {
      setSelectedTableauCard(null);
      return;
    }

    if (
      selectedTableauCard &&
      selectedTableauCard.columnIndex !== columnIndex
    ) {
      handleTableauClick(columnIndex);
      return;
    }

    const column = board.tableau[columnIndex];

    if (
      !column ||
      cardIndex < 0 ||
      !isValidTableauSequence(column.slice(cardIndex))
    ) {
      return;
    }

    setSelectedTableauCard({ columnIndex, cardIndex });
  };

  const isValidTableauTarget = (columnIndex: number): boolean => {
    const activeSource = dragSource ?? selectedTableauCard;

    if (
      isComplete ||
      !activeSource ||
      activeSource.columnIndex === columnIndex
    ) {
      return false;
    }

    const source = board.tableau[activeSource.columnIndex];
    const target = board.tableau[columnIndex];

    return Boolean(
      source &&
      target &&
      canMoveTableauSequence(source.slice(activeSource.cardIndex), target),
    );
  };

  const handleTableauDragStart = (
    columnIndex: number,
    cardIndex: number,
    event: DragEvent<HTMLButtonElement>,
  ) => {
    const column = board.tableau[columnIndex];

    if (
      isComplete ||
      !column ||
      !Number.isInteger(cardIndex) ||
      cardIndex < 0 ||
      !isValidTableauSequence(column.slice(cardIndex))
    ) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "spider-card");

    setSelectedTableauCard(null);
    setDragSource({ columnIndex, cardIndex });
  };

  const handleDragEnd = () => {
    setDragSource(null);
  };

  const handleTableauDragOver = (
    columnIndex: number,
    event: DragEvent<HTMLDivElement>,
  ) => {
    if (!dragSource) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = isValidTableauTarget(columnIndex)
      ? "move"
      : "none";
  };

  const handleTableauDrop = (
    columnIndex: number,
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    if (dragSource && !isComplete) {
      applyMove(
        moveTableauSequence(
          board,
          dragSource.columnIndex,
          dragSource.cardIndex,
          columnIndex,
        ),
      );
    }

    setDragSource(null);
  };

  const resetInteractions = () => {
    setSelectedTableauCard(null);
    setDragSource(null);
    setHasStarted(false);
    setElapsedSeconds(0);
    setMoveCount(0);
  };

  return {
    moveCount,
    canDeal,
    applyMove,
    hasStarted,
    elapsedSeconds,
    isStalemate,
    handleStockClick,
    selectedTableauCard,
    handleTableauClick,
    handleTableauCardClick,
    isValidTableauTarget,
    resetInteractions,
    handleTableauDragStart,
    handleTableauDragOver,
    handleTableauDrop,
    handleDragEnd,
  };
}
