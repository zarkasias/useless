import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import { shuffleAchievements } from "./utils/game-utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export type GameType = "memory" | "solitaire";

export type GameResult = "win" | "loss" | "abandoned";

interface RecordGameSessionInput {
  gameType: GameType;
  result: GameResult;

  score?: number | null;
  moves?: number | null;
  mistakes?: number | null;
  durationSeconds?: number | null;

  metadata?: Record<string, unknown>;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  result: GameResult;

  score: number | null;
  moves: number | null;
  mistakes: number | null;
  duration_seconds: number | null;

  metadata: Record<string, unknown>;

  started_at: string;
  completed_at: string | null;
}

export interface GameAchievement {
  id: string;
  title: string;
  emoji: string;
  icon_path: string | null;
  type: string;
}

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

  const completedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_type: gameType,
      result,

      score,
      moves,
      mistakes,
      duration_seconds: durationSeconds,

      metadata,

      completed_at: completedAt,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to record game session:", error);

    throw new Error("Failed to record game session");
  }

  return data as GameSession;
}
