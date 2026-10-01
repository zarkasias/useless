"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  moveTableauSequence,
  dealFromStock,
} from "@/lib/games/solitaire/spider/spider-moves";
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

  const isComplete = isSpiderComplete(board);

  const canDeal = !isComplete && canDealFromStock(board);

  const handleStockClick = () => {
    if (!canDeal) {
      return;
    }

    const nextBoard = dealFromStock(board);

    if (nextBoard) {
      setBoard(nextBoard);
      setSelectedTableauCard(null);
      setMoveCount((count) => count + 1);
    }
  };

  const handleTableauClick = (columnIndex: number) => {
    if (isComplete || !selectedTableauCard) {
      return;
    }

    const nextBoard = moveTableauSequence(
      board,
      selectedTableauCard.columnIndex,
      selectedTableauCard.cardIndex,
      columnIndex,
    );

    if (nextBoard) {
      setBoard(nextBoard);
      setSelectedTableauCard(null);
      setMoveCount((count) => count + 1);
    }
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
    if (
      isComplete ||
      !selectedTableauCard ||
      selectedTableauCard.columnIndex === columnIndex
    ) {
      return false;
    }

    const source = board.tableau[selectedTableauCard.columnIndex];
    const target = board.tableau[columnIndex];

    return Boolean(
      source &&
      target &&
      canMoveTableauSequence(
        source.slice(selectedTableauCard.cardIndex),
        target,
      ),
    );
  };

  const resetInteractions = () => {
    setSelectedTableauCard(null);
    setMoveCount(0);
  };

  return {
    moveCount,
    canDeal,
    handleStockClick,
    selectedTableauCard,
    handleTableauClick,
    handleTableauCardClick,
    isValidTableauTarget,
    resetInteractions,
  };
}
