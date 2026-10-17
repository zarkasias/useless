import "server-only";

import { supabaseAdmin } from "./utils/trigger-context";
import {
  getToday,
  addDays,
  getAuthenticatedUser,
} from "./utils/achievement-utils";

export interface AchievementStreakData {
  currentStreak: number;
  longestStreak: number;
  achievementDates: string[];
  claimedToday: boolean;
}

export async function getUserStreakData(
  userId: string,
): Promise<AchievementStreakData> {
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_date")
    .eq("user_id", userId)
    .order("achievement_date", { ascending: true });

  if (error) {
    console.error("Error fetching achievement dates:", error);

    return {
      currentStreak: 0,
      longestStreak: 0,
      achievementDates: [],
      claimedToday: false,
    };
  }

  const achievementDates = Array.from(
    new Set(
      (data ?? [])
        .map((record) => record.achievement_date)
        .filter((date): date is string => Boolean(date)),
    ),
  ).sort();

  if (achievementDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      achievementDates: [],
      claimedToday: false,
    };
  }

  const dateSet = new Set(achievementDates);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();

  const timezone = profile?.timezone ?? "UTC";

  const today = getToday(timezone);
  const claimedToday = dateSet.has(today);

  let currentStreak = 0;

  const yesterday = addDays(today, -1);

  let streakStartDate: string | null = null;

  if (dateSet.has(today)) {
    streakStartDate = today;
  } else if (dateSet.has(yesterday)) {
    streakStartDate = yesterday;
  }

  if (streakStartDate) {
    let currentDate = streakStartDate;

    while (dateSet.has(currentDate)) {
      currentStreak++;
      currentDate = addDays(currentDate, -1);
    }
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;

  for (const date of achievementDates) {
    if (previousDate && date === addDays(previousDate, 1)) {
      runningStreak++;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);

    previousDate = date;
  }

  return {
    currentStreak,
    longestStreak,
    achievementDates,
    claimedToday,
  };
}

export async function getAuthenticatedUserStreakData(): Promise<AchievementStreakData> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      achievementDates: [],
      claimedToday: false,
    };
  }

  return getUserStreakData(user.id);
}
