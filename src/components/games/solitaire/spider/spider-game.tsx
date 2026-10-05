"use client";

import { useEffect, useState } from "react";

import { GameTable } from "../../system/game-table";
import { SpiderGameContent } from "./spider-gamecontent";
import { createInitialBoard } from "./spider-helper";

import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";

interface SpiderGameProps {
  onGameRecorded?: () => void;
}

export function SpiderGame({ onGameRecorded }: SpiderGameProps) {
  const [board, setBoard] = useState<SpiderBoardState | null>(null);

  useEffect(() => {
    setBoard(createInitialBoard());
  }, []);

  if (!board) {
    return (
      <GameTable>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-sm font-semibold text-amber-100">
            Shuffling cards...
          </div>
        </div>
      </GameTable>
    );
  }

  return (
    <SpiderGameContent
      board={board}
      setBoard={setBoard}
      onGameRecorded={onGameRecorded}
    />
  );
}
