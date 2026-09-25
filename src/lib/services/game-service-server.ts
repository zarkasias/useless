import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import { shuffleAchievements } from "./utils/game-utils";
import {
  GameAchievement,
  RecordGameSessionInput,
  GameSession,
  GameType,
  UserGameStats,
} from "../types/games";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function getAuthenticatedMemoryAchievements(
  limit = 6,
): Promise<GameAchievement[]> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      achievement_id,
      achievements!inner (
        id,
        title,
        emoji,
        icon_path,
        type
      )
    `,
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load achievements for Memory:", error);

    throw new Error("Failed to load Memory achievements");
  }

  const achievements = (data ?? [])
    .map((row) => {
      const achievement = Array.isArray(row.achievements)
        ? row.achievements[0]
        : row.achievements;

      if (!achievement) return null;

      return {
        id: achievement.id,
        title: achievement.title,
        emoji: achievement.emoji,
        icon_path: achievement.icon_path,
        type: achievement.type,
      };
    })
    .filter(
      (achievement): achievement is GameAchievement => achievement !== null,
    );

  if (achievements.length < limit) {
    return [];
  }

  return shuffleAchievements(achievements).slice(0, limit);
}

export async function recordAuthenticatedGameSession({
  gameType,
  result,
  score = null,
  moves = null,
  mistakes = null,
  durationSeconds = null,
  metadata = {},
}: RecordGameSessionInput): Promise<GameSession> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { data: sessionId, error } = await supabaseAdmin.rpc(
    "record_game_result",
    {
      p_user_id: user.id,
      p_game_type: gameType,
      p_result: result,
      p_score: score,
      p_moves: moves,
      p_mistakes: mistakes,
      p_duration_seconds: durationSeconds,
      p_metadata: metadata,
    },
  );

  if (error) {
    console.error("Failed to record game result:", error);

    throw new Error("Failed to record game result");
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    console.error(
      "Game result recorded but session could not be loaded:",
      sessionError,
    );

    throw new Error("Failed to load recorded game session");
  }

  return session as GameSession;
}

export async function getAuthenticatedGameStats(
  gameType: GameType,
): Promise<UserGameStats | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { data, error } = await supabaseAdmin
    .from("user_game_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_type", gameType)
    .maybeSingle();

  if (error) {
    console.error("Failed to load game stats:", error);

    throw new Error("Failed to load game stats");
  }

  return data as UserGameStats | null;
}
