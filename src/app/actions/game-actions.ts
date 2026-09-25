"use server";

import { recordAuthenticatedGameSession } from "@/lib/services/game-service-server";
import type { GameSession, UserGameStats } from "@/lib/types/games";
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

interface RecordMemoryGameResultResponse {
  success: boolean;
  session?: GameSession;
  stats?: UserGameStats;
  unlockedAchievements?: Achievement[];
  error?: string;
}

export async function recordMemoryGameResultAction(
  input: RecordMemoryGameResultInput,
): Promise<RecordMemoryGameResultResponse> {
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
