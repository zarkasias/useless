"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { RotateCcw, Lightbulb } from "lucide-react";

import GameButton from "../../system/game-button";
import GameMetric from "../../game-metric";

import { GameTable } from "../../system/game-table";
import { SpiderBoard } from "./spider-board";
import { SpiderSettings } from "./spider-settings";
import { SpiderMobileBoard } from "./spider-mobile-board";

import GameResult from "../../system/game-result";
import GameResultOverlay from "../../system/game-result-overlay";
import { recordSpiderGameResultAction } from "@/app/actions/game-actions";

import {
  getNextSpiderHint,
  type SpiderHint,
} from "@/lib/games/solitaire/spider/spider-hint";
import { isSpiderComplete } from "@/lib/games/solitaire/spider/spider-state";
import type { Achievement } from "@/lib/supabase";

import { createInitialBoard } from "./spider-helper";
import { useSpiderInteractions } from "./use-spider-interactions";

import GameAchievements from "../../system/game-achievements";

import type {
  SpiderBoardState,
  SpiderDifficulty,
} from "@/lib/games/solitaire/spider/spider-types";

interface SpiderGameContentProps {
  board: SpiderBoardState;
  setBoard: Dispatch<SetStateAction<SpiderBoardState | null>>;
  onGameRecorded?: () => void;
}

export function SpiderGameContent({
  board,
  setBoard,
  onGameRecorded,
}: SpiderGameContentProps) {
  const interactions = useSpiderInteractions({ board, setBoard });

  const saveAttempt = useRef<object | null>(null);

  const lastRestartedBoard = useRef<SpiderBoardState | null>(null);

  const [abandonSaveError, setAbandonSaveError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Achievement[]
  >([]);

  const [hintRequest, setHintRequest] = useState<{
    board: SpiderBoardState;
    hint: SpiderHint | null;
  } | null>(null);

  const isComplete = isSpiderComplete(board);

  const { isStalemate, elapsedSeconds } = interactions;

  useEffect(() => {
    if ((!isComplete && !isStalemate) || saveAttempt.current) {
      return;
    }

    const attempt = {};
    saveAttempt.current = attempt;

    setSaveStatus("saving");
    setSaveError(null);

    const saveResult = async () => {
      let response;

      try {
        response = await recordSpiderGameResultAction({
          result: isComplete ? "win" : "loss",
          moves: interactions.moveCount,
          durationSeconds: elapsedSeconds,
          difficulty: board.difficulty,
          completedRuns: board.completedRuns.length,
        });
      } catch {
        if (saveAttempt.current === attempt) {
          setSaveStatus("error");
          setSaveError("Unable to confirm that your result was saved.");
        }

        return;
      }

      if (!response.success) {
        if (saveAttempt.current === attempt) {
          setSaveStatus("error");
          setSaveError(response.error ?? "Unable to save your result.");
        }

        return;
      }

      // An older game's response must not update a newer game's overlay.
      if (saveAttempt.current === attempt) {
        setFinalScore(response.session?.score ?? null);
        setUnlockedAchievements(response.unlockedAchievements ?? []);
        setSaveStatus("saved");
      }

      onGameRecorded?.();
    };

    void saveResult();
  }, [
    board,
    isComplete,
    isStalemate,
    interactions.moveCount,
    elapsedSeconds,
    onGameRecorded,
  ]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const [dismissedStalemateBoard, setDismissedStalemateBoard] =
    useState<SpiderBoardState | null>(null);

  const showStalemate = isStalemate && dismissedStalemateBoard !== board;

  // A move, stock deal, or new game makes the previous hint inactive.
  const activeHintRequest = hintRequest?.board === board ? hintRequest : null;

  const hint = activeHintRequest?.hint ?? null;

  const startNewGame = (difficulty: SpiderDifficulty) => {
    // Prevent repeated clicks from recording this board twice.
    if (lastRestartedBoard.current === board) {
      return;
    }

    const nextBoard = createInitialBoard(difficulty);
    lastRestartedBoard.current = board;

    const shouldRecordAbandonment =
      interactions.hasStarted &&
      !isComplete &&
      !isStalemate &&
      saveAttempt.current === null;

    if (shouldRecordAbandonment) {
      // Capture the old game's values before resetting.
      const abandonedResult = {
        result: "abandoned" as const,
        moves: interactions.moveCount,
        durationSeconds: elapsedSeconds,
        difficulty: board.difficulty,
        completedRuns: board.completedRuns.length,
      };

      const saveAbandonedGame = async () => {
        let response;

        try {
          response = await recordSpiderGameResultAction(abandonedResult);
        } catch {
          setAbandonSaveError(
            "Unable to confirm that the previous game's result was saved.",
          );
          return;
        }

        if (!response.success) {
          setAbandonSaveError(
            "Unable to confirm that the previous game's result was saved.",
          );
          return;
        }

        onGameRecorded?.();
      };

      void saveAbandonedGame();
    }

    saveAttempt.current = null;
    setSaveStatus("idle");
    setSaveError(null);
    setFinalScore(null);
    setUnlockedAchievements([]);
    setHintRequest(null);
    setDismissedStalemateBoard(null);

    interactions.resetInteractions();
    setBoard(nextBoard);
  };

  const handleHintClick = () => {
    if (isComplete) {
      return;
    }

    setHintRequest({
      board,
      hint: getNextSpiderHint(board),
    });
  };

  return (
    <>
      <GameTable compactMobile isSpider>
        <div className="grid grid-cols-4 items-center gap-x-2 gap-y-3 md:flex md:flex-wrap md:justify-between md:gap-4">
          <div className="contents md:flex md:flex-wrap md:items-center md:gap-6">
            <GameMetric label="Moves" value={interactions.moveCount} />
            <GameMetric label="Time" value={formattedTime} />
            <GameMetric label="Suits" value={board.difficulty} />
            <GameMetric label="Deals" value={board.stock.length / 10} />
            <GameMetric
              label="Runs"
              value={`${board.completedRuns.length} / 8`}
            />
          </div>

          <div className="col-span-3 flex justify-end gap-1.5">
            <GameButton
              onClick={handleHintClick}
              disabled={isComplete || isStalemate}
              icon={<Lightbulb className="size-4" />}
            >
              <span>Hint</span>
            </GameButton>

            <GameButton
              onClick={() => startNewGame(board.difficulty)}
              icon={<RotateCcw className="size-4" />}
            >
              <span>New Game</span>
            </GameButton>
          </div>
        </div>

        <div className="hidden md:block">
          <SpiderBoard board={board} interactions={interactions} hint={hint} />
        </div>

        <div className="md:hidden">
          <SpiderMobileBoard
            board={board}
            onMove={interactions.applyMove}
            onStockTap={interactions.handleStockClick}
            canDeal={interactions.canDeal}
            hint={hint}
          />
        </div>

        {abandonSaveError && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300/30 bg-black/20 p-3">
            <p role="alert" className="text-sm text-amber-100">
              {abandonSaveError}
            </p>

            <GameButton onClick={() => setAbandonSaveError(null)}>
              Dismiss
            </GameButton>
          </div>
        )}

        <div className="flex justify-start pt-2">
          <SpiderSettings
            difficulty={board.difficulty}
            onStartGame={startNewGame}
          />
        </div>

        {showStalemate && (
          <GameResultOverlay>
            <GameResult
              eyebrow="No moves remaining"
              title="This game is blocked"
              description="No cards can be moved between columns, and no stock deal is available."
              stats={
                <>
                  <GameMetric label="Moves" value={interactions.moveCount} />
                  <GameMetric
                    label="Completed runs"
                    value={`${board.completedRuns.length} / 8`}
                  />
                </>
              }
              actionLabel="New Game"
              actionIcon={<RotateCcw className="size-4" />}
              onAction={() => startNewGame(board.difficulty)}
              secondaryActionLabel="View Board"
              onSecondaryAction={() => setDismissedStalemateBoard(board)}
            >
              <p role="status" className="text-sm text-amber-100/80">
                {saveStatus === "saving"
                  ? "Saving result..."
                  : saveStatus === "saved"
                    ? "Result saved."
                    : saveStatus === "error"
                      ? saveError
                      : null}
              </p>
            </GameResult>
          </GameResultOverlay>
        )}

        {isComplete && (
          <GameResultOverlay>
            <GameResult
              eyebrow="Completely unnecessary victory"
              title="You won Useless Spider Solitaire!"
              description="All eight runs completed."
              stats={
                <>
                  <GameMetric label="Score" value={finalScore ?? "—"} />
                  <GameMetric label="Moves" value={interactions.moveCount} />
                  <GameMetric label="Suits" value={board.difficulty} />
                  <GameMetric
                    label="Completed runs"
                    value={`${board.completedRuns.length} / 8`}
                  />
                </>
              }
              actionLabel="New Game"
              actionIcon={<RotateCcw className="size-4" />}
              onAction={() => startNewGame(board.difficulty)}
            >
              <p role="status" className="text-sm text-amber-100/80">
                {saveStatus === "saving"
                  ? "Saving result..."
                  : saveStatus === "saved"
                    ? "Result saved."
                    : saveStatus === "error"
                      ? saveError
                      : null}
              </p>
            </GameResult>
            <GameAchievements achievements={unlockedAchievements} />
          </GameResultOverlay>
        )}
      </GameTable>
    </>
  );
}
