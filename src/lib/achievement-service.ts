import { supabase, Achievement, UserAchievement, UserProfile, AchievementType } from './supabase';
import { getRandomAchievement, getDailyAchievement, getAllPossibleAchievements } from './achievement-generator';
import { differenceInDays, isSameDay } from 'date-fns';

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data as UserAchievement[];
}

/**
 * Get a user's profile information
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Unlock a new achievement for a user
 */
export async function unlockAchievement(userId: string, achievement: Achievement): Promise<UserAchievement | null> {
  // First, store the achievement in the achievements table (if it doesn't exist)
  const { error: achievementError } = await supabase
    .from('achievements')
    .upsert({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      type: achievement.type,
      emoji: achievement.emoji,
      created_at: achievement.created_at,
      is_daily: achievement.is_daily || false,
    });

  if (achievementError) {
    console.error('Error creating achievement:', achievementError);
    return null;
  }

  // Then, create a user achievement record
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievement.id,
      unlocked_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error('Error unlocking achievement:', error);
    return null;
  }

  return {
    ...data,
    achievement,
  } as UserAchievement;
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

  // Generate and unlock the daily achievement
  const dailyAchievement = getDailyAchievement();
  const unlockedAchievement = await unlockAchievement(userId, dailyAchievement);

  // Update the user's profile with the new streak count and last daily claim date
  if (streakUpdated || unlockedAchievement) {
    await supabase
      .from('profiles')
      .update({
        streak_count: newStreak,
        last_daily_achievement: now.toISOString(),
      })
      .eq('id', userId);
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
export async function getLeaderboardUsers(limit = 10): Promise<Array<UserProfile & { achievementCount: number }>> {
  // Get users with their achievement counts
  const { data, error } = await supabase
    .rpc('get_leaderboard_users', { limit_count: limit });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
}

/**
 * Unlock a random achievement for a user (for testing purposes)
 */
export async function unlockRandomAchievement(userId: string, type?: AchievementType): Promise<Achievement | null> {
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
export async function unlockSpecificAchievement(userId: string, achievementIndex: number, type?: AchievementType): Promise<Achievement | null> {
  // Get all achievements
  const allAchievements = await getPossibleAchievements();
  
  // Filter by type if specified
  const filteredAchievements = type 
    ? allAchievements.filter(a => a.type === type) 
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