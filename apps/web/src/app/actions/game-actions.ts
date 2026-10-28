"use server";

import { recordAuthenticatedGameSession } from "@/lib/services/game-service-server";
import type { GameSession, UserGameStats, RecordGuessGameResultInput } from "@/lib/types/games";

import { calculateSpiderScore } from "@/lib/games/solitaire/spider/spider-scoring";
import type { SpiderDifficulty } from "@/lib/games/solitaire/spider/spider-types";

import { answerWords, wordDictionary } from "@/lib/games/words/word-list";
import { getWordGameStatus, MAX_GUESSES, normalizeWord, submitGuess, WORD_LENGTH } from "@/lib/games/words/word-rules";

import type { Achievement } from "@/lib/supabase";

interface RecordMemoryGameResultInput {
  result: "win" | "loss" | "abandoned";
  moves: number;
  mistakes: number;
  durationSeconds: number;
  achievementIds: string[];
  pairs: number;
  score: number;
}

interface RecordKlondikeGameResultInput {
  result: "win" | "loss" | "abandoned";
  moves: number;
  durationSeconds: number;
  score: number;
  autoFinished: boolean;
}

interface RecordGameResultResponse {
  success: boolean;
  session?: GameSession;
  stats?: UserGameStats;
  unlockedAchievements?: Achievement[];
  error?: string;
}

interface RecordSpiderGameResultInput {
  result: "win" | "loss" | "abandoned";
  moves: number;
  durationSeconds: number;
  difficulty: SpiderDifficulty;
  completedRuns: number;
}

export async function recordMemoryGameResultAction(
  input: RecordMemoryGameResultInput,
): Promise<RecordGameResultResponse> {
  try {
    const {
      result,
      moves,
      mistakes,
      durationSeconds,
      achievementIds,
      pairs,
      score,
    } = input;

    if (moves < 0 || mistakes < 0 || durationSeconds < 0 || pairs <= 0) {
      return {
        success: false,
        error: "Invalid game result",
      };
    }

    const gameResult = await recordAuthenticatedGameSession({
      gameType: "memory",
      result,
      score,
      moves,
      mistakes,
      durationSeconds,
      metadata: {
        pairs,
        achievement_ids: achievementIds,
      },
    });

    return {
      success: true,
      session: gameResult.session,
      stats: gameResult.stats,
      unlockedAchievements: gameResult.unlockedAchievements,
    };
  } catch (error) {
    console.error("Failed to record Memory game result:", error);

    return {
      success: false,
      error: "Unable to save game result",
    };
  }
}

export async function recordKlondikeGameResultAction(
  input: RecordKlondikeGameResultInput,
): Promise<RecordGameResultResponse> {
  try {
    const { result, moves, durationSeconds, score, autoFinished } = input;

    if (moves < 0 || durationSeconds < 0 || score < 0) {
      return {
        success: false,
        error: "Invalid game result",
      };
    }

    const gameResult = await recordAuthenticatedGameSession({
      gameType: "solitaire",
      result,
      score,
      moves,
      mistakes: 0,
      durationSeconds,
      metadata: {
        variant: "klondike",
        auto_finished: autoFinished,
      },
    });

    return {
      success: true,
      session: gameResult.session,
      stats: gameResult.stats,
      unlockedAchievements: gameResult.unlockedAchievements,
    };
  } catch (error) {
    console.error("Failed to record Klondike game result:", error);

    return {
      success: false,
      error: "Unable to save game result",
    };
  }
}

export async function recordSpiderGameResultAction(
  input: RecordSpiderGameResultInput,
): Promise<RecordGameResultResponse> {
  try {
    if (
      !input ||
      !["win", "loss", "abandoned"].includes(input.result) ||
      !Number.isSafeInteger(input.moves) ||
      input.moves < 0 ||
      !Number.isSafeInteger(input.durationSeconds) ||
      input.durationSeconds < 0 ||
      ![1, 2, 4].includes(input.difficulty) ||
      !Number.isInteger(input.completedRuns) ||
      input.completedRuns < 0 ||
      input.completedRuns > 8 ||
      (input.result === "win" && input.completedRuns !== 8) ||
      (input.result !== "win" && input.completedRuns === 8)
    ) {
      return {
        success: false,
        error: "Invalid Spider game result",
      };
    }

    const { result, moves, durationSeconds, difficulty, completedRuns } = input;

    const score = calculateSpiderScore({ result, moves });

    const gameResult = await recordAuthenticatedGameSession({
      gameType: "spider",
      result,
      score,
      moves,
      durationSeconds,
      metadata: {
        variant: "spider",
        suits: difficulty,
        completed_runs: completedRuns,
      },
    });

    return {
      success: true,
      session: gameResult.session,
      stats: gameResult.stats,
      unlockedAchievements: gameResult.unlockedAchievements,
    };
  } catch (error) {
    console.error("Failed to record Spider game result:", error);

    return {
      success: false,
      error: "Unable to save Spider game result",
    };
  }
}

export async function recordGuessGameResultAction(
  input: RecordGuessGameResultInput,
): Promise<RecordGameResultResponse> {
  try {
    if (
      !input || !["win", "loss", "abandoned"].includes(input.result) ||
      typeof input.answer !== "string" || !Array.isArray(input.guesses) ||
      input.guesses.length > MAX_GUESSES ||
      input.guesses.some((guess) => typeof guess !== "string") ||
      !Number.isSafeInteger(input.durationSeconds) || input.durationSeconds < 0 ||
      input.durationSeconds > 2147483647
    ) return { success: false, error: "Invalid Guess game result" };

    const answer = normalizeWord(input.answer);
    if (!answerWords.includes(answer)) {
      return { success: false, error: "Invalid Guess game result" };
    }
    let guesses: string[] = [];
    for (const guess of input.guesses) {
      const submission = submitGuess({ guess, answer, guesses, dictionary: wordDictionary });
      if (!submission.success) return { success: false, error: "Invalid Guess game result" };
      guesses = submission.guesses;
    }
    const status = getWordGameStatus(guesses, answer);
    const expectedResult = { playing: "abandoned", won: "win", lost: "loss" }[status];
    if (input.result !== expectedResult) return { success: false, error: "Invalid Guess game result" };

    const recorded = await recordAuthenticatedGameSession({
      gameType: "guess",
      result: input.result,
      moves: guesses.length,
      durationSeconds: input.durationSeconds,
      metadata: { guesses_used: guesses.length, word_length: WORD_LENGTH, max_guesses: MAX_GUESSES },
    });
    return { success: true, ...recorded };
  } catch (error) {
    console.error("Failed to record Guess game result:", error);
    // The existing flow can fail after committing the session. Do not encourage a duplicate retry.
    return { success: false, error: "Unable to confirm that your Guess result was saved." };
  }
}
