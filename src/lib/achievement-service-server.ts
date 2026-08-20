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

function getToday(): string {
  return new Date().toISOString().split("T")[0];
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
 * Get all achievements belonging to an anonymous user.
 */
export async function getAnonymousUserAchievements(
  anonymousId: string,
): Promise<Achievement[]> {
  const anonymousUser = await getAnonymousUser(anonymousId);

  if (!anonymousUser) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("anonymous_achievements")
    .select(
      `
      id,
      anonymous_user_id,
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
    .eq("anonymous_user_id", anonymousUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching anonymous user achievements:", error);

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
 * Count achievements claimed by an anonymous user (for the free-tier paywall).
 */
export async function getAnonymousAchievementCount(
  anonymousId: string,
): Promise<number> {
  const anonymousUser = await getAnonymousUser(anonymousId);

  if (!anonymousUser) {
    return 0;
  }

  const { count, error } = await supabaseAdmin
    .from("anonymous_achievements")
    .select("*", { count: "exact", head: true })
    .eq("anonymous_user_id", anonymousUser.id);

  if (error) {
    console.error("Error counting anonymous achievements:", error);

    return 0;
  }

  return count ?? 0;
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
