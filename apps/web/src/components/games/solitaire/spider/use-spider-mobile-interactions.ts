"use client";

import { useState } from "react";

import { getTableauCardDestinations } from "@/lib/games/solitaire/spider/spider-available-moves";
import { moveTableauSequence } from "@/lib/games/solitaire/spider/spider-moves";
import { isSpiderComplete } from "@/lib/games/solitaire/spider/spider-state";
import type {
  SpiderBoardState,
  SpiderMoveSource,
} from "@/lib/games/solitaire/spider/spider-types";

interface Props {
  board: SpiderBoardState;
  onMove: (board: SpiderBoardState) => boolean;
}

interface PendingMove {
  board: SpiderBoardState;
  source: SpiderMoveSource;
  destinations: number[];
}

export function useSpiderMobileInteractions({ board, onMove }: Props) {
  const [pending, setPending] = useState<PendingMove | null>(null);

  // A stock deal, desktop move, or new game invalidates old selections.
  const active = pending?.board === board ? pending : null;
  const isComplete = isSpiderComplete(board);

  const clearPendingMove = () => {
    setPending(null);
  };

  const executeMove = (
    source: SpiderMoveSource,
    targetColumnIndex: number,
  ): boolean => {
    if (isComplete) {
      return false;
    }

    const nextBoard = moveTableauSequence(
      board,
      source.columnIndex,
      source.cardIndex,
      targetColumnIndex,
    );

    if (!nextBoard || !onMove(nextBoard)) {
      return false;
    }

    clearPendingMove();
    return true;
  };

  const handleDestinationTap = (columnIndex: number): boolean => {
    if (!active || !active.destinations.includes(columnIndex)) {
      return false;
    }

    return executeMove(active.source, columnIndex);
  };

  const handleTableauCardTap = (columnIndex: number, cardIndex: number) => {
    if (isComplete) {
      return;
    }

    const isSameSelection =
      active?.source.columnIndex === columnIndex &&
      active.source.cardIndex === cardIndex;

    if (isSameSelection) {
      clearPendingMove();
      return;
    }

    if (handleDestinationTap(columnIndex)) {
      return;
    }

    const destinations = getTableauCardDestinations(
      board,
      columnIndex,
      cardIndex,
    );

    const source = { columnIndex, cardIndex };

    if (destinations.length === 1) {
      executeMove(source, destinations[0]);
      return;
    }

    if (destinations.length > 1) {
      setPending({ board, source, destinations });
      return;
    }

    clearPendingMove();
  };

  return {
    pendingSource: active?.source ?? null,
    pendingDestinations: active?.destinations ?? [],
    clearPendingMove,
    handleDestinationTap,
    handleTableauCardTap,
  };
}
