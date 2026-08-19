import "server-only";

import { createClient } from "@/lib/supabase/server";
import { Achievement, UserProfile } from "@/lib/supabase";

export async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching authenticated user profile:", error);
    return null;
  }

  return profile as UserProfile;
}

export async function getAuthenticatedUserAchievements(): Promise<
  Achievement[]
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_achievements")
    .select(
      `
      id,
      user_id,
      achievement_id,
      created_at,
      achievements (
        id,
        title,
        description,
        type,
        emoji,
        created_at,
        is_daily
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching authenticated user achievements:", error);

    return [];
  }

  if (!data) {
    return [];
  }

  return data
    .filter((record) => record.achievements.length > 0)
    .map((record) => {
      const achievement = record.achievements[0];

      return {
        id: achievement.id,
        user_id: record.user_id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        emoji: achievement.emoji,
        created_at: record.created_at,
        is_daily: achievement.is_daily,
      };
    });
}

export async function unlockAchievementForCurrentUser(
  achievement: Achievement,
): Promise<Achievement | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  // Make sure the achievement definition exists.
  const { error: achievementError } = await supabase
    .from("achievements")
    .upsert(
      {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        emoji: achievement.emoji,
        created_at: achievement.created_at,
        is_daily: achievement.is_daily ?? false,
      },
      {
        onConflict: "id",
      },
    );

  if (achievementError) {
    console.error("Error creating achievement definition:", achievementError);

    return null;
  }

  // Record that the authenticated user unlocked the achievement.
  const { data, error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: user.id,
      achievement_id: achievement.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error unlocking achievement:", error);
    return null;
  }

  return {
    ...achievement,
    user_id: user.id,
    created_at: data.created_at,
  };
}
