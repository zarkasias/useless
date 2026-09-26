"use client";

import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { GameTable } from "../../system/game-table";
import GameButton from "../../system/game-button";
import GameMetric from "../../game-metric";

import { createStandardDeck } from "@/lib/games/solitaire/core/deck";
import { shuffleDeck } from "@/lib/games/solitaire/core/shuffle";
import { createKlondikeBoard } from "@/lib/games/solitaire/klondike/klondike-setup";
import { isKlondikeComplete } from "@/lib/games/solitaire/klondike/klondike-state";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

import { KlondikeBoard } from "./klondike-board";

function createInitialBoard(): KlondikeBoardState {
  const deck = createStandardDeck();
  const shuffledDeck = shuffleDeck(deck);

  return createKlondikeBoard(shuffledDeck);
}

export function KlondikeGame() {
  const [board, setBoard] = useState<KlondikeBoardState | null>(null);

  useEffect(() => {
    setBoard(createInitialBoard());
  }, []);

  const resetGame = () => {
    setBoard(createInitialBoard());
  };

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

  const isComplete = isKlondikeComplete(board);

  return (
    <GameTable className="space-y-5">
      {/* Game controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <GameMetric label="Stock" value={board.stock.length} />

          <GameMetric label="Waste" value={board.waste.length} />
        </div>

        <GameButton onClick={resetGame} icon={<RotateCcw className="size-4" />}>
          New Game
        </GameButton>
      </div>

      {/* Board */}
      <div className="relative rounded-xl">
        <KlondikeBoard board={board} setBoard={setBoard} />
      </div>

      {isComplete && (
        <div className="rounded-lg border border-amber-300/30 bg-black/30 px-4 py-3 text-center font-semibold text-amber-100">
          You won Useless Solitaire!
        </div>
      )}
    </GameTable>
  );
}
