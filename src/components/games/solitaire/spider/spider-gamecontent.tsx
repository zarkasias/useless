"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { RotateCcw, ChevronDown } from "lucide-react";

import GameButton from "../../system/game-button";
import GameMetric from "../../game-metric";
import { GameTable } from "../../system/game-table";
import { SpiderBoard } from "./spider-board";
import { createInitialBoard } from "./spider-helper";
import { useSpiderInteractions } from "./use-spider-interactions";

import type {
  SpiderBoardState,
  SpiderDifficulty,
} from "@/lib/games/solitaire/spider/spider-types";

interface SpiderGameContentProps {
  board: SpiderBoardState;
  setBoard: Dispatch<SetStateAction<SpiderBoardState | null>>;
}

export function SpiderGameContent({ board, setBoard }: SpiderGameContentProps) {
  const [nextDifficulty, setNextDifficulty] = useState<SpiderDifficulty>(
    board.difficulty,
  );

  const interactions = useSpiderInteractions({ board, setBoard });

  const startNewGame = () => {
    const nextBoard = createInitialBoard(nextDifficulty);

    interactions.resetInteractions();
    setBoard(nextBoard);
  };

  return (
    <GameTable>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-center justify-between">
        <div className="flex sm:flex-wrap gap-2 sm:gap-6 text-sm font-semibold text-amber-100">
          <GameMetric label="Moves" value={interactions.moveCount} />
          <GameMetric label="Suits" value={board.difficulty} />
          <GameMetric label="Deals remaining" value={board.stock.length / 10} />
          <GameMetric
            label="Completed runs"
            value={`${board.completedRuns.length} / 8`}
          />
        </div>

        <div className="flex sm:flex-wrap items-center gap-2 sm:gap-4">
          <label className="flex items-center gap-2 text-[10px] sm:text-sm font-semibold text-amber-100">
            Suits for next game
            <div className="relative inline-block">
              <select
                value={nextDifficulty}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (value === 1 || value === 2 || value === 4) {
                    setNextDifficulty(value);
                  }
                }}
                className="
      appearance-none
      rounded-md
      border
      border-amber-300/40
      bg-black/25
      px-2
      py-2
      pr-9
      text-amber-100
      shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.18)]
      backdrop-blur-sm
    "
              >
                <option value={1}>1 suit</option>
                <option value={2}>2 suits</option>
                <option value={4}>4 suits</option>
              </select>

              <span
                className="
      pointer-events-none
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      text-amber-200
    "
              >
                <ChevronDown className="size-4" />
              </span>
            </div>
          </label>

          <GameButton
            onClick={startNewGame}
            icon={<RotateCcw className="size-4" />}
          >
            New Game
          </GameButton>
        </div>
      </div>

      <SpiderBoard board={board} interactions={interactions} />
    </GameTable>
  );
}
