"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordGuessGameResultAction } from "@/app/actions/game-actions";
import type { GameResult as SessionResult } from "@/lib/types/games";
import { RotateCcw } from "lucide-react";
import { GameTable } from "../system/game-table";
import GameButton from "../system/game-button";
import GameMetric from "../game-metric";
import GameResult from "../system/game-result";
import GameResultOverlay from "../system/game-result-overlay";
import {
  evaluateGuess,
  getKeyboardStatuses,
  getWordGameStatus,
  MAX_GUESSES,
  submitGuess,
  WORD_LENGTH,
} from "@/lib/games/words/word-rules";
import {
  answerWords,
  chooseAnswer,
  wordDictionary,
} from "@/lib/games/words/word-list";
import { WordBoard } from "./word-board";
import { WordKeyboard } from "./word-keyboard";

interface Round {
  id: number;
  startedAt: number | null;
  answer: string;
  guesses: string[];
  draft: string;
  feedback: string;
}

interface WordGameProps {
  onGameRecorded?: () => void;
}
type SaveState = {
  roundId: number;
  phase: "idle" | "saving" | "saved" | "error";
  error?: string;
};

export function WordGame({ onGameRecorded }: WordGameProps) {
  const [round, setRound] = useState<Round>(() => ({
    id: 0,
    startedAt: null,
    answer: chooseAnswer(answerWords, null),
    guesses: [],
    draft: "",
    feedback: "",
  }));
  const recordedRound = useRef<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ roundId: 0, phase: "idle" });
  const [abandonSaveError, setAbandonSaveError] = useState<string | null>(null);
  const game = useRef<HTMLElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const status = getWordGameStatus(round.guesses, round.answer);
  const evaluations = round.guesses.map((guess) =>
    evaluateGuess(guess, round.answer),
  );
  const keyboard = getKeyboardStatuses(evaluations);

  const handleInput = useCallback((key: string) => {
    const inputTime = Date.now();
    setRound((current) => {
      if (getWordGameStatus(current.guesses, current.answer) !== "playing") {
        return current;
      }
      if (key === "Backspace") {
        return { ...current, draft: current.draft.slice(0, -1), feedback: "" };
      }
      if (key === "Enter") {
        const submitted = submitGuess({
          guess: current.draft,
          answer: current.answer,
          guesses: current.guesses,
          dictionary: wordDictionary,
        });
        if (!submitted.success) {
          return { ...current, feedback: submitted.message };
        }
        const summary = submitted.evaluation.letters
          .map(({ letter, status }) => `${letter}: ${status}`)
          .join(", ");
        return {
          ...current,
          guesses: submitted.guesses,
          draft: "",
          feedback: `Guess ${submitted.guesses.length}: ${summary}.`,
        };
      }
      if (/^[a-z]$/i.test(key) && current.draft.length < WORD_LENGTH) {
        return {
          ...current,
          draft: current.draft + key.toUpperCase(),
          startedAt: current.startedAt ?? inputTime,
          feedback: "",
        };
      }
      return current;
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey || event.altKey || event.metaKey
      ) return;
      if (!(target instanceof Element) || !game.current?.contains(target)) return;
      if (target.closest(
        "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
      )) return;
      // Keep Enter/Space activation of focused native controls in the browser.
      if (event.key === "Enter" && target.closest("button, a")) return;
      if (
        event.key !== "Enter" && event.key !== "Backspace" &&
        !/^[a-z]$/i.test(event.key)
      ) return;
      event.preventDefault();
      handleInput(event.key);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);

  useEffect(() => {
    if (status === "playing") game.current?.focus({ preventScroll: true });
    else result.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [status]);

  // One attempt per round, even if its outcome is uncertain. The shared RPC has
  // no idempotency key, so rerenders/restarts must never automatically retry it.
  const recordRound = useCallback((snapshot: Round, result: SessionResult) => {
    if (recordedRound.current === snapshot.id) return;
    recordedRound.current = snapshot.id;
    if (result !== "abandoned") {
      setSaveState({ roundId: snapshot.id, phase: "saving" });
    }

    async function saveResult() {
      let response;
      try {
        response = await recordGuessGameResultAction({
          result,
          answer: snapshot.answer,
          guesses: snapshot.guesses,
          durationSeconds: snapshot.startedAt === null ? 0 : Math.max(0, Math.floor((Date.now() - snapshot.startedAt) / 1000)),
        });
      } catch {
        response = { success: false, error: "Unable to confirm that your Guess result was saved." };
      }
      if (result === "abandoned") {
        if (!response.success) setAbandonSaveError("Unable to confirm that the previous game's result was saved.");
      } else {
        // An older response may refresh lifetime stats, but must not replace the
        // current round's saving/error state after Play again.
        setSaveState((current) => current.roundId !== snapshot.id ? current : {
          roundId: snapshot.id,
          phase: response.success ? "saved" : "error",
          error: response.success ? undefined : response.error ?? "Unable to save your result.",
        });
      }
      if (response.success) onGameRecorded?.();
    }
    void saveResult();
  }, [onGameRecorded]);

  useEffect(() => {
    if (status !== "playing") recordRound(round, status === "won" ? "win" : "loss");
  }, [status, round, recordRound]);

  function restart() {
    if (round.startedAt !== null && status === "playing") recordRound(round, "abandoned");
    const answer = chooseAnswer(answerWords, round.answer);
    setRound({ id: round.id + 1, startedAt: null, answer, guesses: [], draft: "", feedback: "" });
    setSaveState({ roundId: round.id + 1, phase: "idle" });
    game.current?.focus();
  }

  let saveMessage = "";
  if (saveState.phase === "saving") saveMessage = "Saving result...";
  else if (saveState.phase === "saved") saveMessage = "Result saved.";
  else if (saveState.phase === "error") saveMessage = saveState.error ?? "Unable to save your result.";

  return (
    <section
      ref={game}
      tabIndex={0}
      aria-label="Useless Guess game"
      aria-describedby="guess-instructions"
      className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      <GameTable compactMobile>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <GameMetric label="Guesses" value={`${round.guesses.length}/${MAX_GUESSES}`} />
          <GameButton onClick={restart} icon={<RotateCcw className="size-4" />}>
            Restart
          </GameButton>
        </div>
        {abandonSaveError && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300/30 bg-black/20 p-3">
            <p role="alert" className="text-sm text-amber-100">{abandonSaveError}</p>
            <GameButton onClick={() => setAbandonSaveError(null)}>Dismiss</GameButton>
          </div>
        )}
        <p
          id="guess-instructions"
          className="mx-auto max-w-lg rounded-md bg-slate-900 px-3 py-2 text-center text-sm text-amber-50"
        >
          Five letters. Six guesses. Type or tap the keys, then Enter.
          Click the board area to return to typing.
        </p>
        <WordBoard
          evaluations={evaluations}
          draft={round.draft}
          playing={status === "playing"}
        />
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="mx-auto min-h-16 max-w-lg rounded-md bg-slate-900 p-3 text-center text-sm leading-5 text-amber-50"
        >
          {round.feedback || `Guess ${Math.min(round.guesses.length + 1, MAX_GUESSES)} of ${MAX_GUESSES}.`}
          {status !== "playing" && ` ${status === "won" ? "You won!" : "No guesses left."} The word was ${round.answer}.`}
        </p>
        <WordKeyboard
          statuses={keyboard}
          disabled={status !== "playing"}
          onInput={handleInput}
        />
        <ul
          aria-label="Letter feedback legend"
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-100"
        >
          <li><span className="font-bold text-emerald-300">Green:</span> correct spot</li>
          <li><span className="font-bold text-amber-200">Gold:</span> wrong spot</li>
          <li><span className="font-bold">Gray:</span> no remaining match</li>
        </ul>
        {status !== "playing" && (
          <GameResultOverlay>
            <div ref={result} className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto px-1 animate-in zoom-in-95 duration-300">
              <GameResult
                eyebrow={status === "won" ? "A completely unnecessary victory" : "Six guesses. Zero productivity."}
                title={status === "won" ? "You've got a way with useless words!" : "That word got the last word."}
                description={`The word was ${round.answer}. You used ${round.guesses.length} of ${MAX_GUESSES} guesses.`}
                actionLabel="Play again"
                actionIcon={<RotateCcw className="size-4" />}
                onAction={restart}
              >
                <p role="status" className="text-sm text-amber-100/80">
                  {saveMessage}
                </p>
              </GameResult>
            </div>
          </GameResultOverlay>
        )}
        <p className="text-center text-xs text-amber-50">
          SCOWL 2020.12.07 · Kevin Atkinson and contributors ·{" "}
          <a
            href="/licenses/scowl-2020.12.07.txt"
            className="rounded underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200"
          >
            Word list credits
          </a>
        </p>
      </GameTable>
    </section>
  );
}
