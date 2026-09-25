import "server-only";

import type {
  GameSession,
  GameTriggerConfig,
  UserGameStats,
} from "@/lib/types/games";

import type { Achievement } from "@/lib/supabase";

import { supabaseAdmin } from "../utils/trigger-context";

function compareMetric(
  actual: number,
  operator: GameTriggerConfig["operator"],
  expected: number,
): boolean {
  switch (operator) {
    case "=":
      return actual === expected;

    case ">=":
      return actual >= expected;

    case "<=":
      return actual <= expected;

    case ">":
      return actual > expected;

    case "<":
      return actual < expected;

    default:
      return false;
  }
}

function getSessionMetric(
  session: GameSession,
  metric: GameTriggerConfig["metric"],
): number | null {
  switch (metric) {
    case "score":
      return session.score;

    case "moves":
      return session.moves;

    case "mistakes":
      return session.mistakes;

    case "duration_seconds":
      return session.duration_seconds;

    default:
      return null;
  }
}

function getStatsMetric(
  stats: UserGameStats,
  metric: GameTriggerConfig["metric"],
): number | null {
  switch (metric) {
    case "games_played":
      return stats.games_played;

    case "games_completed":
      return stats.games_completed;

    case "wins":
      return stats.wins;

    case "losses":
      return stats.losses;

    case "abandoned":
      return stats.abandoned;

    case "best_score":
      return stats.best_score;

    case "current_win_streak":
      return stats.current_win_streak;

    case "best_win_streak":
      return stats.best_win_streak;

    case "total_score":
      return stats.total_score;

    case "total_duration_seconds":
      return stats.total_duration_seconds;

    default:
      return null;
  }
}

export async function evaluateGameAchievements({
  userId,
  session,
  stats,
}: {
  userId: string;
  session: GameSession;
  stats: UserGameStats;
}): Promise<Achievement[]> {
  const { data: achievements, error } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .in("trigger_type", ["game_session", "game_stat"])
    .eq("status", "published");

  if (error) {
    console.error("Failed to load game achievements:", error);

    throw new Error("Failed to evaluate game achievements");
  }

  if (!achievements?.length) {
    return [];
  }

  const { data: existingAwards, error: existingAwardsError } =
    await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

  if (existingAwardsError) {
    console.error("Failed to load existing game awards:", existingAwardsError);

    throw new Error("Failed to evaluate game achievements");
  }

  const existingIds = new Set(
    (existingAwards ?? []).map((award) => award.achievement_id),
  );

  const unlocked: Achievement[] = [];

  for (const achievement of achievements) {
    if (existingIds.has(achievement.id)) {
      continue;
    }

    const config = achievement.trigger_config as GameTriggerConfig | null;

    if (!config) {
      continue;
    }

    if (config.game !== "all" && config.game !== session.game_type) {
      continue;
    }

    let actualValue: number | null = null;

    if (achievement.trigger_type === "game_session") {
      actualValue = getSessionMetric(session, config.metric);
    }

    if (achievement.trigger_type === "game_stat") {
      actualValue = getStatsMetric(stats, config.metric);
    }

    if (actualValue === null) {
      continue;
    }

    const qualifies = compareMetric(actualValue, config.operator, config.value);

    if (!qualifies) {
      continue;
    }

    const { error: awardError } = await supabaseAdmin
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

    if (awardError) {
      console.error(
        `Failed to award game achievement ${achievement.id}:`,
        awardError,
      );

      continue;
    }
    unlocked.push(achievement as Achievement);
  }

  return unlocked;
}
