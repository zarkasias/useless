"use server";

import {
  recordAuthenticatedGameSession,
  type GameSession,
} from "@/lib/services/game-service-server";

interface RecordMemoryGameResultInput {
  result: "win" | "loss" | "abandoned";
  moves: number;
  mistakes: number;
  durationSeconds: number;
  achievementIds: string[];
  pairs: number;
}

interface RecordMemoryGameResultResponse {
  success: boolean;
  session?: GameSession;
  error?: string;
}

export async function recordMemoryGameResultAction(
  input: RecordMemoryGameResultInput,
): Promise<RecordMemoryGameResultResponse> {
  try {
    const { result, moves, mistakes, durationSeconds, achievementIds, pairs } =
      input;

    if (moves < 0 || mistakes < 0 || durationSeconds < 0 || pairs <= 0) {
      return {
        success: false,
        error: "Invalid game result",
      };
    }

    const session = await recordAuthenticatedGameSession({
      gameType: "memory",
      result,
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
      session,
    };
  } catch (error) {
    console.error("Failed to record Memory game result:", error);

    return {
      success: false,
      error: "Unable to save game result",
    };
  }
}
