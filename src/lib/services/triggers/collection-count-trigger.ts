import "server-only";

import { Achievement } from "@/lib/supabase";
import { getAchievementPackFilter } from "../achievement-access-service-server";

import { supabaseAdmin, isFreeLimitError } from "../utils/trigger-context";

interface EvaluateCollectionCountAchievementsParams {
  userId: string;
}

export async function evaluateCollectionCountAchievements({
  userId,
}: EvaluateCollectionCountAchievementsParams): Promise<Achievement[]> {
  // ----------------------------------------
  // Get achievements the user already owns.
  // ----------------------------------------

  const { data: ownedAchievements, error: ownedError } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  if (ownedError) {
    console.error(
      "Error loading owned achievements for collection count triggers:",
      ownedError,
    );

    return [];
  }

  const ownedAchievementIds = new Set(
    (ownedAchievements ?? []).map((achievement) => achievement.achievement_id),
  );

  const collectionCount = ownedAchievementIds.size;

  const packFilter = await getAchievementPackFilter(userId);

  // ----------------------------------------
  // Get collection-count achievements.
  // ----------------------------------------

  const { data: collectionCountAchievements, error: achievementsError } =
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
      .eq("trigger_type", "collection_count")
      .eq("is_daily", false);

  if (achievementsError) {
    console.error(
      "Error loading collection count achievements:",
      achievementsError,
    );

    return [];
  }

  if (
    !collectionCountAchievements ||
    collectionCountAchievements.length === 0
  ) {
    return [];
  }

  const unlockedAchievements: Achievement[] = [];

  // ----------------------------------------
  // Evaluate collection milestones.
  // ----------------------------------------

  for (const achievement of collectionCountAchievements) {
    if (ownedAchievementIds.has(achievement.id)) {
      continue;
    }

    const config = achievement.trigger_config as {
      count?: number | null;
    } | null;

    const requiredCount = config?.count;

    if (typeof requiredCount !== "number" || requiredCount <= 0) {
      console.error(
        `Invalid collection_count trigger config for achievement: ${achievement.title}`,
      );

      continue;
    }

    if (collectionCount < requiredCount) {
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
        `Error awarding collection count achievement ${achievement.title}:`,
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
      status: achievement.status,
    });
  }

  return unlockedAchievements;
}
