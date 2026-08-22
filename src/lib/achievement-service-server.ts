import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAnonymousUser } from "@/lib/anonymous-user";
import { Achievement, UserProfile } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export interface AchievementStreakData {
  currentStreak: number;
  longestStreak: number;
  achievementDates: string[];
  claimedToday: boolean;
}

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

  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, amount: number): string {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().split("T")[0];
}

/**
 * Get the currently authenticated Supabase user.
 */
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

/**
 * Get the profile belonging to the authenticated user.
 */
export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabaseAdmin
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

/**
 * Get all achievements belonging to the authenticated user.
 */
export async function getAuthenticatedUserAchievements(): Promise<
  Achievement[]
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      id,
      user_id,
      achievement_id,
      created_at,
      achievement_date,
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
    .filter((record) => record.achievements)
    .map((record) => {
      const achievement = Array.isArray(record.achievements)
        ? record.achievements[0]
        : record.achievements;

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

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select("achievement_date")
    .eq("user_id", user.id)
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

  const today = getToday();
  const claimedToday = dateSet.has(today);

  // ----------------------------------------
  // Current streak
  // ----------------------------------------

  // ----------------------------------------
  // Current streak
  // ----------------------------------------

  let currentStreak = 0;

  const yesterday = addDays(today, -1);

  let streakStartDate: string | null = null;

  // If the user already claimed today, count backward from today.
  if (dateSet.has(today)) {
    streakStartDate = today;
  }
  // If they have not claimed today yet, yesterday's streak is still active.
  else if (dateSet.has(yesterday)) {
    streakStartDate = yesterday;
  }

  // Only count the streak if it is still active.
  if (streakStartDate) {
    let currentDate = streakStartDate;

    while (dateSet.has(currentDate)) {
      currentStreak++;
      currentDate = addDays(currentDate, -1);
    }
  }

  // ----------------------------------------
  // Longest streak
  // ----------------------------------------

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

/**
 * Get a random daily achievement from the database
 * that this user has NOT already unlocked.
 */
async function getRandomAvailableDailyAchievement(
  previousAchievementIds: string[],
): Promise<Achievement | null> {
  const { data: achievements, error } = await supabaseAdmin
    .from("achievements")
    .select(
      `
      id,
      title,
      description,
      type,
      emoji,
      created_at,
      is_daily
      `,
    )
    .eq("is_daily", true);

  if (error) {
    console.error("Error fetching daily achievements:", error);

    return null;
  }

  if (!achievements || achievements.length === 0) {
    console.error("No daily achievements exist in the database.");

    return null;
  }

  const availableAchievements = achievements.filter(
    (achievement) => !previousAchievementIds.includes(achievement.id),
  );

  if (availableAchievements.length === 0) {
    console.error(
      "User has already unlocked every available daily achievement.",
    );

    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableAchievements.length);

  return availableAchievements[randomIndex] as Achievement;
}

/**
 * Claim today's achievement for an authenticated user.
 *
 * Rules:
 * - One achievement per user per day.
 * - Achievement comes from the database.
 * - Achievement must be marked is_daily = true.
 * - The same daily achievement will not be given twice.
 */
export async function claimDailyAchievementForAuthenticatedUser(): Promise<Achievement | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const today = getToday();

  // --------------------------------------------------
  // Check whether the user already claimed today.
  // --------------------------------------------------

  const { data: existingClaim, error: existingClaimError } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
        id,
        achievement_id,
        achievement_date,
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
    .eq("achievement_date", today)
    .maybeSingle();

  if (existingClaimError) {
    console.error("Error checking today's achievement:", existingClaimError);

    return null;
  }

  // User already has today's achievement.
  if (existingClaim) {
    return null;
  }

  // --------------------------------------------------
  // Get achievements this user has already unlocked.
  // --------------------------------------------------

  const { data: previousClaims, error: previousClaimsError } =
    await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

  if (previousClaimsError) {
    console.error("Error fetching previous achievements:", previousClaimsError);

    return null;
  }

  const previousAchievementIds =
    previousClaims?.map((claim) => claim.achievement_id) ?? [];

  // --------------------------------------------------
  // Select a random unused DAILY achievement.
  // --------------------------------------------------

  const achievement = await getRandomAvailableDailyAchievement(
    previousAchievementIds,
  );

  if (!achievement) {
    return null;
  }

  // --------------------------------------------------
  // Record today's claim.
  // --------------------------------------------------

  const { data: claim, error: claimError } = await supabaseAdmin
    .from("user_achievements")
    .insert({
      user_id: user.id,
      achievement_id: achievement.id,
      achievement_date: today,
    })
    .select("created_at, achievement_date")
    .single();

  if (claimError) {
    console.error(
      "Error recording authenticated daily achievement:",
      claimError,
    );

    return null;
  }

  return {
    ...achievement,
    user_id: user.id,
    created_at: claim.created_at,
    is_daily: true,
  };
}

/**
 * Claim today's achievement for an anonymous user.
 *
 * Rules:
 * - One achievement per anonymous user per day.
 * - Achievement comes from the database.
 * - Achievement must be marked is_daily = true.
 * - The same daily achievement will not be given twice.
 */
export async function claimDailyAchievementForAnonymousUser(
  anonymousId: string,
): Promise<Achievement | null> {
  const anonymousUser = await getAnonymousUser(anonymousId);

  if (!anonymousUser) {
    return null;
  }

  // This browser has previously been linked to an account.
  // Do not allow it to start a fresh anonymous achievement history.
  if (anonymousUser.linked_user_id) {
    return null;
  }

  const today = getToday();

  // --------------------------------------------------
  // Check whether anonymous user already claimed today.
  // --------------------------------------------------

  const { data: existingClaim, error: existingClaimError } = await supabaseAdmin
    .from("anonymous_achievements")
    .select("id")
    .eq("anonymous_user_id", anonymousUser.id)
    .eq("achievement_date", today)
    .maybeSingle();

  if (existingClaimError) {
    console.error(
      "Error checking anonymous daily achievement:",
      existingClaimError,
    );

    return null;
  }

  if (existingClaim) {
    return null;
  }

  // --------------------------------------------------
  // Get previous anonymous achievements.
  // --------------------------------------------------

  const { data: previousClaims, error: previousClaimsError } =
    await supabaseAdmin
      .from("anonymous_achievements")
      .select("achievement_id")
      .eq("anonymous_user_id", anonymousUser.id);

  if (previousClaimsError) {
    console.error(
      "Error fetching anonymous achievements:",
      previousClaimsError,
    );

    return null;
  }

  const previousAchievementIds =
    previousClaims?.map((claim) => claim.achievement_id) ?? [];

  // --------------------------------------------------
  // Select random unused daily achievement.
  // --------------------------------------------------

  const achievement = await getRandomAvailableDailyAchievement(
    previousAchievementIds,
  );

  if (!achievement) {
    return null;
  }

  // --------------------------------------------------
  // Record today's anonymous claim.
  // --------------------------------------------------

  const { data: claim, error: claimError } = await supabaseAdmin
    .from("anonymous_achievements")
    .insert({
      anonymous_user_id: anonymousUser.id,
      achievement_id: achievement.id,
      achievement_date: today,
    })
    .select("created_at, achievement_date")
    .single();

  if (claimError) {
    console.error("Error claiming anonymous achievement:", claimError);

    return null;
  }

  return {
    ...achievement,
    created_at: claim.created_at,
    is_daily: true,
  };
}

/**
 * Legacy achievement unlock.
 *
 * Keep this temporarily because other existing UI/code may
 * still call it. The new dashboard should use
 * claimDailyAchievementAction() instead.
 */
export async function unlockAchievementForCurrentUser(
  achievement: Achievement,
): Promise<Achievement | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .insert({
      user_id: user.id,
      achievement_id: achievement.id,
      created_at: new Date().toISOString(),
      achievement_date: getToday(),
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

// --------------------------------------------------
// Merge anonymous acheivements into your user achievements on login
// --------------------------------------------------

export async function mergeAnonymousAchievementsIntoCurrentUser(
  anonymousId: string,
): Promise<{
  migrated: number;
  skipped: number;
}> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error(
      "User must be authenticated before migrating achievements.",
    );
  }

  const anonymousUser = await getAnonymousUser(anonymousId);

  if (!anonymousUser) {
    return {
      migrated: 0,
      skipped: 0,
    };
  }

  // Get all achievements earned while anonymous.
  const { data: anonymousClaims, error: anonymousClaimsError } =
    await supabaseAdmin
      .from("anonymous_achievements")
      .select(
        `
        id,
        achievement_id,
        achievement_date,
        created_at
        `,
      )
      .eq("anonymous_user_id", anonymousUser.id)
      .order("achievement_date", { ascending: true });

  if (anonymousClaimsError) {
    console.error(
      "Error fetching anonymous achievements for migration:",
      anonymousClaimsError,
    );

    throw new Error("Unable to migrate anonymous achievements.");
  }

  let migrated = 0;
  let skipped = 0;

  for (const claim of anonymousClaims ?? []) {
    // Check for either type of conflict:
    //
    // 1. User already has an achievement for this date.
    // 2. User already owns this exact achievement.
    const { data: existingClaims, error: existingClaimError } =
      await supabaseAdmin
        .from("user_achievements")
        .select("id, achievement_id, achievement_date")
        .eq("user_id", user.id)
        .or(
          `achievement_date.eq.${claim.achievement_date},achievement_id.eq.${claim.achievement_id}`,
        );

    if (existingClaimError) {
      console.error(
        "Error checking existing user achievements during migration:",
        existingClaimError,
      );

      throw new Error("Unable to migrate anonymous achievements.");
    }

    if (existingClaims && existingClaims.length > 0) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_achievements")
      .insert({
        user_id: user.id,
        achievement_id: claim.achievement_id,
        achievement_date: claim.achievement_date,

        // Preserve when the anonymous achievement was originally earned.
        created_at: claim.created_at,
      });

    if (insertError) {
      console.error("Error migrating anonymous achievement:", insertError);

      throw new Error("Unable to migrate anonymous achievements.");
    }

    migrated++;
  }

  // Migration completed successfully.
  // Remove the temporary anonymous achievement rows now that
  // they have been processed.
  const { error: deleteClaimsError } = await supabaseAdmin
    .from("anonymous_achievements")
    .delete()
    .eq("anonymous_user_id", anonymousUser.id);

  if (deleteClaimsError) {
    console.error(
      "Error cleaning up anonymous achievements:",
      deleteClaimsError,
    );

    throw new Error(
      "Achievements migrated, but anonymous claim cleanup failed.",
    );
  }

  // Keep the anonymous browser identity, but permanently associate
  // it with the authenticated account.
  const { error: linkError } = await supabaseAdmin
    .from("anonymous_users")
    .update({
      linked_user_id: user.id,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", anonymousUser.id);

  if (linkError) {
    console.error(
      "Error linking anonymous user to authenticated user:",
      linkError,
    );

    throw new Error(
      "Achievements migrated, but browser identity linking failed.",
    );
  }

  return {
    migrated,
    skipped,
  };
}
