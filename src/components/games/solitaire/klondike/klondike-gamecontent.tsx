"use client";
import { useRef, useEffect, useState, Dispatch, SetStateAction } from "react";
import { RotateCcw } from "lucide-react";
import GameButton from "../../system/game-button";
import GameMetric from "../../game-metric";
import GameResult from "../../system/game-result";
import GameResultOverlay from "../../system/game-result-overlay";
import { AchievementCard } from "@/components/achievement-card-updated";

import { recordKlondikeGameResultAction } from "@/app/actions/game-actions";
import { calculateKlondikeScore } from "@/lib/games/solitaire/klondike/klondike-scoring";
import type { Achievement } from "@/lib/supabase";

import { GameTable } from "../../system/game-table";

import { isKlondikeComplete } from "@/lib/games/solitaire/klondike/klondike-state";
import { useKlondikeInteractions } from "./use-klondike-interactions";
import {
  canAutoFinishKlondike,
  getNextAutoFinishMove,
} from "@/lib/games/solitaire/klondike/klondike-autofinish";
import { isKlondikeStalemate } from "@/lib/games/solitaire/klondike/klondike-stalemate";

import { KlondikeBoard } from "./klondike-board";
import { createInitialBoard } from "./klondike-helper";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

interface KlondikeGameContentProps {
  board: KlondikeBoardState;
  setBoard: Dispatch<SetStateAction<KlondikeBoardState | null>>;
  onGameRecorded?: () => void;
}

export function KlondikeGameContent({
  board,
  setBoard,
  onGameRecorded,
}: KlondikeGameContentProps) {
  const hasRecordedResult = useRef(false);

  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Achievement[]
  >([]);
  const [wasAutoFinished, setWasAutoFinished] = useState(false);

  const isComplete = isKlondikeComplete(board);

  const [isAutoFinishing, setIsAutoFinishing] = useState(false);

  const [autoFinishDismissed, setAutoFinishDismissed] = useState(false);

  const canAutoFinish = !isComplete && canAutoFinishKlondike(board);
  const isStalemate =
    !isComplete && !canAutoFinish && isKlondikeStalemate(board);

  const showAutoFinishOffer =
    canAutoFinish && !isComplete && !isAutoFinishing && !autoFinishDismissed;

  const showStalemate = isStalemate && !isComplete && !isAutoFinishing;
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
    hasRecordedResult.current = false;
    setFinalScore(null);
    setUnlockedAchievements([]);
    setWasAutoFinished(false);
    resetInteractions();
    setBoard(createInitialBoard());
  };

  const handleAutoFinish = async () => {
    setWasAutoFinished(true);
    setIsAutoFinishing(true);

    let currentBoard = board;

    while (!isKlondikeComplete(currentBoard)) {
      const nextBoard = getNextAutoFinishMove(currentBoard);

      if (!nextBoard) {
        break;
      }

      currentBoard = nextBoard;

      setBoard(nextBoard);

      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }

    setIsAutoFinishing(false);
  };

  useEffect(() => {
    const result = isComplete ? "win" : isStalemate ? "loss" : null;

    if (!result || hasRecordedResult.current) {
      return;
    }

    hasRecordedResult.current = true;

    const score = calculateKlondikeScore({
      result,
      moves: moveCount,
      durationSeconds: elapsedSeconds,
      autoFinished: wasAutoFinished,
    });

    setFinalScore(score);

    void (async () => {
      const response = await recordKlondikeGameResultAction({
        result,
        moves: moveCount,
        durationSeconds: elapsedSeconds,
        score,
        autoFinished: wasAutoFinished,
      });

      if (response.success) {
        setUnlockedAchievements(response.unlockedAchievements ?? []);
        onGameRecorded?.();
      }
    })();
  }, [isComplete, isStalemate, moveCount, elapsedSeconds, wasAutoFinished]);

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

      {showStalemate && (
        <GameResultOverlay>
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
            <GameResult
              eyebrow="Game over"
              title="No moves left"
              description="There are no remaining moves that can advance this game."
              actionLabel="New game"
              onAction={resetGame}
              stats={
                <>
                  <GameMetric label="Score" value={finalScore ?? "—"} />

                  <GameMetric label="Moves" value={moveCount} />

                  <GameMetric label="Time" value={formattedTime} />
                </>
              }
            />
          </div>
        </GameResultOverlay>
      )}

      {showAutoFinishOffer && (
        <GameResultOverlay>
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
            <GameResult
              eyebrow="Victory in sight"
              title="This game can finish itself"
              description="Every remaining card can safely move to the foundations."
              actionLabel="Finish game"
              onAction={handleAutoFinish}
              secondaryActionLabel="Keep playing"
              onSecondaryAction={() => setAutoFinishDismissed(true)}
            />
          </div>
        </GameResultOverlay>
      )}

      {isAutoFinishing && (
        <GameResultOverlay>
          <div className="w-full max-w-xl">
            <GameResult
              eyebrow="Finishing up"
              title="Putting everything away..."
              description="The remaining cards are moving to their foundations."
            />
          </div>
        </GameResultOverlay>
      )}

      {isComplete && !isAutoFinishing && (
        <GameResultOverlay>
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
            <GameResult
              eyebrow="Completely unnecessary victory"
              title="You won Useless Solitaire!"
              actionLabel="New game"
              onAction={resetGame}
              stats={
                <>
                  <GameMetric label="Score" value={finalScore ?? "—"} />
                  <GameMetric label="Moves" value={moveCount} />
                  <GameMetric label="Time" value={formattedTime} />
                </>
              }
            />
            {unlockedAchievements.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="text-center text-xs font-black uppercase tracking-[0.2em] text-amber-200/70">
                  Achievement Unlocked
                </div>

                <div className="flex justify-center">
                  <div className="w-full max-w-xs">
                    {unlockedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        ingrid={true}
                        isCollected={true}
                        showShareButton={false}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </GameResultOverlay>
      )}
    </GameTable>
  );
}
