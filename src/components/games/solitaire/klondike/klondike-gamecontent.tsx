"use client";
import {
  useRef,
  useEffect,
  useState,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { RotateCcw, Lightbulb } from "lucide-react";
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

import { KlondikeBoard } from "./klondike-board";
import { KlondikeMobileBoard } from "./klondike-mobile-board";
import { createInitialBoard } from "./klondike-helper";

import {
  getKlondikeHints,
  type KlondikeHint,
} from "@/lib/games/solitaire/klondike/klondike-hint";

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
  const [autoFinishCardId, setAutoFinishCardId] = useState<string | null>(null);
  const [isAutoFinishing, setIsAutoFinishing] = useState(false);
  const [autoFinishDismissed, setAutoFinishDismissed] = useState(false);

  const isComplete = isKlondikeComplete(board);

  const canAutoFinish = !isComplete && canAutoFinishKlondike(board);

  const [hintIndex, setHintIndex] = useState(0);

  const [hint, setHint] = useState<KlondikeHint | null>(null);

  const showAutoFinishOffer =
    canAutoFinish && !isComplete && !isAutoFinishing && !autoFinishDismissed;

  const interactions = useKlondikeInteractions({
    board,
    setBoard,
    isComplete,
  });

  const { hasStarted } = interactions;

  const { moveCount, resetInteractions, elapsedSeconds } = interactions;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const showNoHintMessage = hint?.type === "none";

  useEffect(() => {
    setHint(null);
    setHintIndex(0);
  }, [board]);

  const resetGame = async () => {
    if (hasStarted && !isComplete && !hasRecordedResult.current) {
      hasRecordedResult.current = true;

      await recordKlondikeGameResultAction({
        result: "abandoned",
        moves: moveCount,
        durationSeconds: elapsedSeconds,
        score: 0,
        autoFinished: false,
      });

      onGameRecorded?.();
    }

    hasRecordedResult.current = false;

    setFinalScore(null);
    setUnlockedAchievements([]);
    setWasAutoFinished(false);
    setAutoFinishCardId(null);
    setAutoFinishDismissed(false);

    resetInteractions();
    setBoard(createInitialBoard());
  };

  const handleAutoFinish = async () => {
    setWasAutoFinished(true);
    setIsAutoFinishing(true);

    let currentBoard = board;

    let moveIndex = 0;

    while (!isKlondikeComplete(currentBoard)) {
      const move = getNextAutoFinishMove(currentBoard);

      if (!move) {
        break;
      }

      setAutoFinishCardId(move.cardId);

      currentBoard = move.board;
      setBoard(move.board);

      moveIndex += 1;

      const delay = Math.max(90, 180 - moveIndex * 4);

      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    setAutoFinishCardId(null);

    await new Promise((resolve) => window.setTimeout(resolve, 250));

    setIsAutoFinishing(false);
  };

  useEffect(() => {
    const result = isComplete ? "win" : null;

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
  }, [isComplete, moveCount, elapsedSeconds, wasAutoFinished, onGameRecorded]);

  const handleHint = () => {
    const hints = getKlondikeHints(board);

    if (hints.length === 0) {
      setHint({ type: "none" });
      setHintIndex(0);
      return;
    }

    const nextIndex = hintIndex % hints.length;

    setHint(hints[nextIndex]);
    setHintIndex((current) => current + 1);
  };

  return (
    <GameTable compactMobile className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
          <GameMetric label="Moves" value={moveCount} />
          <GameMetric label="Time" value={formattedTime} />
          <GameMetric label="Stock" value={board.stock.length} />
          <GameMetric label="Waste" value={board.waste.length} />
        </div>

        <div className="flex gap-2">
          <GameButton
            onClick={handleHint}
            icon={<Lightbulb className="size-4" />}
          >
            Hint
          </GameButton>

          <GameButton
            onClick={resetGame}
            icon={<RotateCcw className="size-4" />}
          >
            New Game
          </GameButton>
        </div>
      </div>

      {showNoHintMessage && (
        <GameResultOverlay>
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
            <GameResult
              eyebrow="No obvious moves"
              title="No forward moves found"
              description="Try moving a card back from a foundation, or start a new game."
              actionLabel="Keep playing"
              onAction={() => setHint(null)}
              secondaryActionLabel="New game"
              onSecondaryAction={resetGame}
            />
          </div>
        </GameResultOverlay>
      )}

      <div className="relative rounded-xl">
        <div className="hidden md:block">
          <KlondikeBoard
            board={board}
            interactions={interactions}
            autoFinishCardId={autoFinishCardId}
            hint={hint}
          />
        </div>

        <div className="md:hidden">
          <KlondikeMobileBoard
            board={board}
            onStockTap={interactions.handleStockClick}
            onMove={(nextBoard) => {
              setBoard(nextBoard);
              interactions.registerSuccessfulMove();
            }}
            autoFinishCardId={autoFinishCardId}
            hint={hint}
          />
        </div>
      </div>

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
        <GameResultOverlay variant="transparent">
          <div className="w-full max-w-xl">
            <GameResult
              eyebrow="Finishing up"
              title="Putting everything away..."
              description="We're taking care of cleaning up the mess."
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
