import "server-only";

import { getAchievementPackFilter } from "../achievement-access-service-server";
import type { TriggerDefinition } from "@/lib/types/triggers";
import { Achievement } from "@/lib/supabase";

import { supabaseAdmin, isFreeLimitError } from "../utils/trigger-context";

interface EvaluateStreakAchievementsParams {
  userId: string;
  currentStreak: number;
  definitions?: TriggerDefinition[];
}

export async function evaluateStreakAchievements({
  userId,
  currentStreak,
  definitions,
}: EvaluateStreakAchievementsParams): Promise<Achievement[]> {
  if (currentStreak <= 0) {
    return [];
  }

  let streakAchievements: TriggerDefinition[];

  if (definitions !== undefined) {
    // Already loaded and access-filtered by the trusted server helper.
    streakAchievements = definitions.filter(
      (achievement) => achievement.trigger_type === "streak",
    );
  } else {
    // Preserve the existing standalone lookup.
    const packFilter = await getAchievementPackFilter(userId);

    const { data, error } = await supabaseAdmin
      .from("achievements")
      .select(
        `
      id,
      title,
      description,
      type,
      emoji,
      icon_path,
      created_at,
      is_daily,
      is_secret,
      status,
      trigger_type,
      trigger_config
      `,
      )
      .eq("status", "published")
      .or(packFilter)
      .eq("trigger_type", "streak")
      .eq("is_daily", false);

    if (error) {
      console.error("Error loading streak achievements:", error);
      return [];
    }

    streakAchievements = data ?? [];
  }

  if (streakAchievements.length === 0) {
    return [];
  }

  // ----------------------------------------
  // Get achievements the user already owns.
  // ----------------------------------------

  const { data: ownedAchievements, error: ownedError } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  if (ownedError) {
    console.error(
      "Error loading owned achievements for streak triggers:",
      ownedError,
    );

    return [];
  }

  const ownedAchievementIds = new Set(
    (ownedAchievements ?? []).map((achievement) => achievement.achievement_id),
  );

  const unlockedAchievements: Achievement[] = [];

  // ----------------------------------------
  // Evaluate each streak achievement.
  // ----------------------------------------

  for (const achievement of streakAchievements) {
    if (ownedAchievementIds.has(achievement.id)) {
      continue;
    }

    const config = achievement.trigger_config as {
      days?: number | null;
    } | null;

    const requiredDays = config?.days;

    if (typeof requiredDays !== "number" || requiredDays <= 0) {
      console.error(
        `Invalid streak trigger config for achievement: ${achievement.title}`,
      );

      continue;
    }

    if (currentStreak < requiredDays) {
      continue;
    }

    const { data: insertedAchievement, error: insertError } =
      await supabaseAdmin
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        })
        .select("created_at")
        .single();

    if (insertError) {
      if (isFreeLimitError(insertError)) {
        break;
      }

      console.error(
        `Error awarding streak achievement ${achievement.title}:`,
        insertError,
      );

      continue;
    }

    unlockedAchievements.push({
      id: achievement.id,
      user_id: userId,
      title: achievement.title,
      description: achievement.description,
      type: achievement.type,
      emoji: achievement.emoji,
      icon_path: achievement.icon_path,
      created_at: insertedAchievement.created_at,
      is_daily: false,
      is_secret: achievement.is_secret,
      trigger_type: achievement.trigger_type,
      trigger_config: achievement.trigger_config,
      status: achievement.status,
    });
  }

  return unlockedAchievements;
}
