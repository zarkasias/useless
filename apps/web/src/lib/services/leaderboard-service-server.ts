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
  const uniqueDates = Array.from(new Set(achievementDates)).sort();

  if (uniqueDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(uniqueDates);

  const yesterday = addDays(today, -1);

  let currentDate: string | null = null;

  // User already claimed today.
  if (dateSet.has(today)) {
    currentDate = today;
  }
  // User has not claimed today yet, but yesterday's
  // streak is still active.
  else if (dateSet.has(yesterday)) {
    currentDate = yesterday;
  }
  // User missed at least one full calendar day.
  else {
    return 0;
  }

  let currentStreak = 0;

  while (currentDate && dateSet.has(currentDate)) {
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
export async function getLeaderboardUsers(): Promise<LeaderboardUser[]> {
  // Fetch in batches so the API row cap does not silently exclude users.
  const batchSize = 200;
  const users: (UserProfile & {
    achievement_count?: number;
    achievementCount?: number;
  })[] = [];
  let afterUserId: string | undefined;

  while (true) {
    // SQL LIMIT NULL removes the RPC's default top-ten cutoff.
    let query = supabaseAdmin
      .rpc("get_leaderboard_users", { limit_count: null })
      .order("id", { ascending: true })
      .limit(batchSize);
    if (afterUserId) query = query.gt("id", afterUserId);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching leaderboard users:", error);
      return [];
    }
    if (!data?.length) break;
    users.push(...data);
    afterUserId = data[data.length - 1].id;
  }

  if (!users.length) return [];

  // Batch both the user filter and history rows: either can exceed API limits.
  const achievementRows: { user_id: string; achievement_date: string | null }[] = [];
  for (let start = 0; start < users.length; start += batchSize) {
    const userIds = users.slice(start, start + batchSize).map((user) => user.id);
    let afterClaimId: string | undefined;
    while (true) {
      let query = supabaseAdmin
        .from("user_achievements")
        .select("id, user_id, achievement_date")
        .in("user_id", userIds)
        .order("id", { ascending: true })
        .limit(batchSize);
      if (afterClaimId) query = query.gt("id", afterClaimId);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching leaderboard achievement history:", error);
        return [];
      }
      if (!data?.length) break;
      achievementRows.push(...data);
      afterClaimId = data[data.length - 1].id;
    }
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
