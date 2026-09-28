"use client";

import { RotateCcw } from "lucide-react";
import GameButton from "../../system/game-button";
import GameMetric from "../../game-metric";

import { GameTable } from "../../system/game-table";

import { isKlondikeComplete } from "@/lib/games/solitaire/klondike/klondike-state";
import { useKlondikeInteractions } from "./use-klondike-interactions";
import { canAutoFinishKlondike } from "@/lib/games/solitaire/klondike/klondike-autofinish";
import { isKlondikeStalemate } from "@/lib/games/solitaire/klondike/klondike-stalemate";

import { KlondikeBoard } from "./klondike-board";
import { createInitialBoard } from "./klondike-helper";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

interface KlondikeGameContentProps {
  board: KlondikeBoardState;
  setBoard: React.Dispatch<React.SetStateAction<KlondikeBoardState | null>>;
}

export function KlondikeGameContent({
  board,
  setBoard,
}: KlondikeGameContentProps) {
  const isComplete = isKlondikeComplete(board);
  const canAutoFinish = !isComplete && canAutoFinishKlondike(board);
  const isStalemate =
    !isComplete && !canAutoFinish && isKlondikeStalemate(board);
  const interactions = useKlondikeInteractions({
    board,
    setBoard,
    isComplete,
  });

  const { moveCount, resetInteractions, elapsedSeconds } = interactions;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const resetGame = () => {
    resetInteractions();
    setBoard(createInitialBoard());
  };

  return (
    <GameTable className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <GameMetric label="Moves" value={moveCount} />
          <GameMetric label="Time" value={formattedTime} />
          <GameMetric label="Stock" value={board.stock.length} />
          <GameMetric label="Waste" value={board.waste.length} />
        </div>

        <GameButton onClick={resetGame} icon={<RotateCcw className="size-4" />}>
          New Game
        </GameButton>
      </div>

      <div className="relative rounded-xl">
        <KlondikeBoard board={board} interactions={interactions} />
      </div>

      {isStalemate && (
        <div className="rounded-lg border border-red-300/30 bg-black/30 px-4 py-3 text-center text-red-100">
          No legal moves remain.
        </div>
      )}

      {canAutoFinish && (
        <div className="rounded-lg border border-amber-300/30 bg-black/30 px-4 py-3 text-center text-amber-100">
          This game can be finished automatically.
        </div>
      )}

      {isComplete && (
        <div className="rounded-lg border border-amber-300/30 bg-black/30 px-4 py-3 text-center font-semibold text-amber-100">
          You won Useless Solitaire!
        </div>
      )}
    </GameTable>
  );
}
