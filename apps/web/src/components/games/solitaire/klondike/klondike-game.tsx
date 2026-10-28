"use client";

import { useState, useEffect } from "react";

import { GameTable } from "../../system/game-table";
import { KlondikeGameContent } from "./klondike-gamecontent";

import { createInitialBoard } from "./klondike-helper";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

interface KlondikeGameProps {
  onGameRecorded?: () => void;
}

export function KlondikeGame({ onGameRecorded }: KlondikeGameProps) {
  const [board, setBoard] = useState<KlondikeBoardState | null>(null);

  useEffect(() => {
    setBoard(createInitialBoard());
  }, []);

  if (!board) {
    return (
      <GameTable>
        <div className="flex min-h-100 items-center justify-center">
          <div className="text-sm font-semibold text-amber-100">
            Shuffling cards...
          </div>
        </div>
      </GameTable>
    );
  }

  return (
    <KlondikeGameContent
      board={board}
      setBoard={setBoard}
      onGameRecorded={onGameRecorded}
    />
  );
}
