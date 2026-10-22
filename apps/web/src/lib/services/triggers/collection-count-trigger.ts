import "server-only";

import { Achievement } from "@/lib/supabase";
import type { TriggerDefinition } from "@/lib/types/triggers";
import { getAchievementPackFilter } from "../achievement-access-service-server";

import { supabaseAdmin, isFreeLimitError } from "../utils/trigger-context";

interface EvaluateCollectionCountAchievementsParams {
  userId: string;
  definitions?: TriggerDefinition[];
}

export async function evaluateCollectionCountAchievements({
  userId,
  definitions,
}: EvaluateCollectionCountAchievementsParams): Promise<Achievement[]> {
  // ----------------------------------------
  // Get achievements the user already owns.
  // ----------------------------------------

  const [{ data: ownedAchievements, error: ownedError }, packFilter] =
    await Promise.all([
      supabaseAdmin
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),

      definitions === undefined
        ? getAchievementPackFilter(userId)
        : Promise.resolve(null),
    ]);

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

  // ----------------------------------------
  // Get collection-count achievements.
  // ----------------------------------------

  let collectionCountAchievements: TriggerDefinition[];

  if (definitions !== undefined) {
    collectionCountAchievements = definitions.filter(
      (achievement) => achievement.trigger_type === "collection_count",
    );
  } else {
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
      .or(packFilter!)
      .eq("trigger_type", "collection_count")
      .eq("is_daily", false);

    if (error) {
      console.error("Error loading collection count achievements:", error);

      return [];
    }

    collectionCountAchievements = data ?? [];
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
      is_secret: achievement.is_secret,
      trigger_type: achievement.trigger_type,
      trigger_config: achievement.trigger_config,
      status: achievement.status,
    });
  }

  return unlockedAchievements;
}
