import "server-only";

import { getAchievementPackFilter } from "../achievement-access-service-server";
import { Achievement } from "@/lib/supabase";

import { supabaseAdmin, isFreeLimitError } from "../utils/trigger-context";

interface EvaluateStreakAchievementsParams {
  userId: string;
  currentStreak: number;
}

export async function evaluateStreakAchievements({
  userId,
  currentStreak,
}: EvaluateStreakAchievementsParams): Promise<Achievement[]> {
  if (currentStreak <= 0) {
    return [];
  }

  const packFilter = await getAchievementPackFilter(userId);

  // ----------------------------------------
  // Get published streak achievements.
  // ----------------------------------------

  const { data: streakAchievements, error: achievementsError } =
    await supabaseAdmin
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
      status,
      trigger_type,
      trigger_config
    `,
      )
      .eq("status", "published")
      .or(packFilter)
      .eq("trigger_type", "streak")
      .eq("is_daily", false);

  if (achievementsError) {
    console.error("Error loading streak achievements:", achievementsError);

    return [];
  }

  if (!streakAchievements || streakAchievements.length === 0) {
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
      trigger_type: achievement.trigger_type,
      trigger_config: achievement.trigger_config,
      status: achievement.status,
    });
  }

  return unlockedAchievements;
}
