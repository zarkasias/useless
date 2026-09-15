import "server-only";

import { Achievement } from "@/lib/supabase";
import { getAchievementPackFilter } from "../achievement-access-service-server";

import { supabaseAdmin, isFreeLimitError } from "../utils/trigger-context";

interface EvaluateAccountAgeAchievementsParams {
  userId: string;
}

export async function evaluateAccountAgeAchievements({
  userId,
}: EvaluateAccountAgeAchievementsParams): Promise<Achievement[]> {
  // ----------------------------------------
  // Get the user's profile creation date.
  // ----------------------------------------

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.created_at) {
    console.error(
      "Error loading profile for account age achievements:",
      profileError,
    );

    return [];
  }

  // ----------------------------------------
  // Calculate account age in whole days.
  // ----------------------------------------

  const createdAt = new Date(profile.created_at);
  const now = new Date();

  const accountAgeMs = now.getTime() - createdAt.getTime();

  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

  const packFilter = await getAchievementPackFilter(userId);

  // ----------------------------------------
  // Get published account-age achievements.
  // ----------------------------------------

  const { data: accountAgeAchievements, error: achievementsError } =
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
      .eq("trigger_type", "account_age")
      .eq("is_daily", false);

  if (achievementsError) {
    console.error("Error loading account age achievements:", achievementsError);

    return [];
  }

  if (!accountAgeAchievements || accountAgeAchievements.length === 0) {
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
      "Error loading owned achievements for account age triggers:",
      ownedError,
    );

    return [];
  }

  const ownedAchievementIds = new Set(
    (ownedAchievements ?? []).map((achievement) => achievement.achievement_id),
  );

  const unlockedAchievements: Achievement[] = [];

  // ----------------------------------------
  // Evaluate account-age achievements.
  // ----------------------------------------

  for (const achievement of accountAgeAchievements) {
    if (ownedAchievementIds.has(achievement.id)) {
      continue;
    }

    const config = achievement.trigger_config as {
      days?: number | null;
    } | null;

    const requiredDays = config?.days;

    if (typeof requiredDays !== "number" || requiredDays <= 0) {
      console.error(
        `Invalid account_age trigger config for achievement: ${achievement.title}`,
      );

      continue;
    }

    if (accountAgeDays < requiredDays) {
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
        `Error awarding account age achievement ${achievement.title}:`,
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
