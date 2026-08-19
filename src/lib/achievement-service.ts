import {
  supabase,
  Achievement,
  UserProfile,
  AchievementType,
} from "./supabase";
import {
  getRandomAchievement,
  getAllPossibleAchievements,
} from "./achievement-generator";
import { differenceInDays, isSameDay } from "date-fns";

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

async function getAvailableDailyAchievement(
  userId: string,
): Promise<Achievement | null> {
  // Get all daily achievements from the database
  const { data: dailyAchievements, error: dailyError } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_daily", true);

  if (dailyError) {
    console.error("Error fetching daily achievements:", dailyError);
    return null;
  }

  if (!dailyAchievements || dailyAchievements.length === 0) {
    console.error("No daily achievements found in database.");
    return null;
  }

  // Get the daily achievements this user has already unlocked
  const { data: userAchievements, error: userError } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  if (userError) {
    console.error("Error fetching user's unlocked achievements:", userError);
    return null;
  }

  const unlockedIds = new Set(
    userAchievements?.map((achievement) => achievement.achievement_id) ?? [],
  );

  // Remove achievements this user has already unlocked
  const availableAchievements = dailyAchievements.filter(
    (achievement) => !unlockedIds.has(achievement.id),
  );

  if (availableAchievements.length === 0) {
    console.log("User has unlocked all available daily achievements.");
    return null;
  }

  // Pick a random unused daily achievement
  const randomIndex = Math.floor(Math.random() * availableAchievements.length);

  return availableAchievements[randomIndex] as Achievement;
}

/**
 * Handle the user's daily achievement and streak updates
 */
export async function checkAndUnlockDailyAchievement(userId: string): Promise<{
  achievement: Achievement | null;
  streakUpdated: boolean;
  newStreak: number;
}> {
  // Get the user's profile to check their last daily achievement and streak
  const profile = await getUserProfile(userId);

  if (!profile) {
    return { achievement: null, streakUpdated: false, newStreak: 0 };
  }

  const now = new Date();
  let streakUpdated = false;
  let newStreak = profile.streak_count;

  // Check if the user already claimed a daily achievement today
  if (profile.last_daily_achievement) {
    const lastClaimDate = new Date(profile.last_daily_achievement);
    if (isSameDay(lastClaimDate, now)) {
      // Already claimed today
      return { achievement: null, streakUpdated: false, newStreak };
    }

    // Check if streak should be incremented or reset
    const daysSinceLastClaim = differenceInDays(now, lastClaimDate);

    if (daysSinceLastClaim === 1) {
      // Consecutive day, increment streak
      newStreak = profile.streak_count + 1;
      streakUpdated = true;
    } else if (daysSinceLastClaim > 1) {
      // Streak broken, reset to 1
      newStreak = 1;
      streakUpdated = true;
    }
  } else {
    // First time claiming a daily achievement
    newStreak = 1;
    streakUpdated = true;
  }

  const dailyAchievement = await getAvailableDailyAchievement(userId);

  // No daily achievements remain.
  if (!dailyAchievement) {
    return {
      achievement: null,
      streakUpdated: false,
      newStreak,
    };
  }

  // Unlock the new daily achievement.
  const unlockedAchievement = await unlockAchievement(userId, dailyAchievement);

  // Update the user's profile.
  if (streakUpdated || unlockedAchievement) {
    await supabase
      .from("profiles")
      .update({
        streak_count: newStreak,
        last_daily_achievement: now.toISOString(),
      })
      .eq("id", userId);
  }

  return {
    achievement: unlockedAchievement ? dailyAchievement : null,
    streakUpdated,
    newStreak,
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

/**
 * Unlock a random achievement for a user (for testing purposes)
 */
export async function unlockRandomAchievement(
  userId: string,
  type?: AchievementType,
): Promise<Achievement | null> {
  const achievement = getRandomAchievement(type);
  const result = await unlockAchievement(userId, achievement);
  return result ? achievement : null;
}

/**
 * Get all possible achievements that a user can unlock
 */
export async function getPossibleAchievements(): Promise<Achievement[]> {
  // Get all possible achievements from the generator
  return getAllPossibleAchievements();
}

/**
 * Unlock a specific achievement for a user
 */
export async function unlockSpecificAchievement(
  userId: string,
  achievementIndex: number,
  type?: AchievementType,
): Promise<Achievement | null> {
  // Get all achievements
  const allAchievements = await getPossibleAchievements();

  // Filter by type if specified
  const filteredAchievements = type
    ? allAchievements.filter((a) => a.type === type)
    : allAchievements;

  // Use modulo to ensure the index is within bounds
  const safeIndex = achievementIndex % filteredAchievements.length;
  const selectedAchievement = filteredAchievements[safeIndex];

  if (!selectedAchievement) {
    return null;
  }

  const result = await unlockAchievement(userId, selectedAchievement);
  return result ? selectedAchievement : null;
}
