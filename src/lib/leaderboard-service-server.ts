import "server-only";

import { createClient } from "@supabase/supabase-js";

import { UserProfile } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export interface LeaderboardUser extends UserProfile {
  achievementCount: number;
  currentStreak: number;
}

/**
 * Return today's date using the same application
 * timezone used by the daily achievement claim flow.
 */
function getToday(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine current date");
  }

  return `${year}-${month}-${day}`;
}

/**
 * Move a YYYY-MM-DD calendar date by a number
 * of days without introducing timezone drift.
 */
function addDays(dateString: string, amount: number): string {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().split("T")[0];
}

/**
 * Calculate the user's current streak from their
 * achievement_date history.
 *
 * A current streak only exists if they have claimed
 * an achievement today.
 */
function calculateCurrentStreak(
  achievementDates: string[],
  today: string,
): number {
  const uniqueDates = Array.from(new Set(achievementDates));

  const dateSet = new Set(uniqueDates);

  if (!dateSet.has(today)) {
    return 0;
  }

  let currentStreak = 0;
  let currentDate = today;

  while (dateSet.has(currentDate)) {
    currentStreak++;

    currentDate = addDays(currentDate, -1);
  }

  return currentStreak;
}

/**
 * Get leaderboard users with:
 *
 * - profile information
 * - achievement count
 * - calculated current streak
 */
export async function getLeaderboardUsers(
  limit = 20,
): Promise<LeaderboardUser[]> {
  /**
   * Keep using your existing leaderboard RPC
   * for the base ranking data.
   */
  const { data: users, error: leaderboardError } = await supabaseAdmin.rpc(
    "get_leaderboard_users",
    {
      limit_count: limit,
    },
  );

  if (leaderboardError) {
    console.error("Error fetching leaderboard users:", leaderboardError);

    return [];
  }

  if (!users || users.length === 0) {
    return [];
  }

  const userIds = users.map((user: UserProfile) => user.id);

  /**
   * Fetch all achievement dates for the users in
   * one query instead of making one DB request
   * per leaderboard user.
   */
  const { data: achievementRows, error: achievementError } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      user_id,
      achievement_date
      `,
    )
    .in("user_id", userIds);

  if (achievementError) {
    console.error(
      "Error fetching leaderboard achievement history:",
      achievementError,
    );

    return [];
  }

  /**
   * Group achievement dates by user.
   */
  const datesByUser = new Map<string, string[]>();

  for (const row of achievementRows ?? []) {
    if (!row.achievement_date) {
      continue;
    }

    const existingDates = datesByUser.get(row.user_id) ?? [];

    existingDates.push(row.achievement_date);

    datesByUser.set(row.user_id, existingDates);
  }

  const today = getToday();

  /**
   * Attach the calculated current streak to
   * each leaderboard user.
   */
  return users.map(
    (
      user: UserProfile & {
        achievement_count?: number;
        achievementCount?: number;
      },
    ): LeaderboardUser => {
      const achievementDates = datesByUser.get(user.id) ?? [];

      return {
        ...user,

        achievementCount: user.achievementCount ?? user.achievement_count ?? 0,

        currentStreak: calculateCurrentStreak(achievementDates, today),
      };
    },
  );
}
