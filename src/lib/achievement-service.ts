import { supabase, Achievement, UserProfile } from "./supabase";

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(
  userId: string,
): Promise<Achievement[]> {
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data
    .filter((record) => record.achievements !== null)
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

/**
 * Get a user's profile information
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Unlock a new achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievement: Achievement,
): Promise<Achievement | null> {
  // Record that this user unlocked the existing achievement.
  const { data, error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: userId,
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
    user_id: data.user_id,
    created_at: data.created_at,
  };
}

/**
 * Get top users for the leaderboard
 */
export async function getLeaderboardUsers(
  limit = 10,
): Promise<Array<UserProfile & { achievementCount: number }>> {
  // Get users with their achievement counts
  const { data, error } = await supabase.rpc("get_leaderboard_users", {
    limit_count: limit,
  });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return data || [];
}
