import "server-only";

import { getUserEntitlements } from "./entitlement-service-server";
import { getAnonymousUser } from "@/lib/anonymous-user";
import { getAchievementPackFilter } from "./achievement-access-service-server";
import { Achievement, UserProfile } from "@/lib/supabase";
import { getAuthenticatedUser, getToday } from "./utils/achievement-utils";
import { isDailyAchievementEligible } from "./utils/daily-claim-eligible";

import { getUserStreakData } from "./streak-service-server";
import { supabaseAdmin, isFreeLimitError } from "./utils/trigger-context";

import { evaluateAccountAgeAchievements } from "./triggers/account-age-trigger";
import { evaluateStreakAchievements } from "./triggers/streak-trigger";
import { evaluateCollectionCountAchievements } from "./triggers/collection-count-trigger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const DAILY_CLAIM_HOURS = 20;
const DAILY_CLAIM_COOLDOWN_MS = DAILY_CLAIM_HOURS * 60 * 60 * 1000;

export type DailyClaimResult =
  | {
      status: "claimed";
      achievement: Achievement;
      triggeredAchievements: Achievement[];
    }
  | {
      status: "already_claimed";
      achievement: null;
      triggeredAchievements?: never;
    }
  | {
      status: "subscription_required";
      achievement: null;
      triggeredAchievements?: never;
    }
  | {
      status: "unavailable";
      achievement: null;
      triggeredAchievements?: never;
    };

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

// --------------------------------------------------
// TRIGGERED ACHIEVEMENT SYSTEM
// Evaluates automatic achievement milestones.
// --------------------------------------------------

export async function evaluateTriggeredAchievementsForAuthenticatedUser(): Promise<
  Achievement[]
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const unlockedAchievements: Achievement[] = [];

  const streakData = await getUserStreakData(user.id);

  const accountAgeAchievements = await evaluateAccountAgeAchievements({
    userId: user.id,
  });

  unlockedAchievements.push(...accountAgeAchievements);

  const streakAchievements = await evaluateStreakAchievements({
    userId: user.id,
    currentStreak: streakData.currentStreak,
  });

  unlockedAchievements.push(...streakAchievements);

  const collectionCountAchievements = await evaluateCollectionCountAchievements(
    {
      userId: user.id,
    },
  );

  unlockedAchievements.push(...collectionCountAchievements);

  return unlockedAchievements;
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

  const packFilter = await getAchievementPackFilter(user.id);

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      id,
      user_id,
      achievement_id,
      created_at,
      achievement_date,
      achievements!inner (
        id,
        title,
        description,
        type,
        emoji,
        icon_path,
        created_at,
        trigger_type,
        trigger_config,
        is_daily,
        is_secret,
        pack_id,
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .or(packFilter, { referencedTable: "achievements" })
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
        icon_path: achievement.icon_path,
        created_at: record.created_at,
        is_daily: achievement.is_daily,
        is_secret: achievement.is_secret,
        pack_id: achievement.pack_id,
        trigger_type: achievement.trigger_type,
        trigger_config: achievement.trigger_config,
        status: achievement.status,
      };
    });
}

/**
 * Get a random daily achievement from the database
 * that this user has NOT already unlocked.
 */
async function getRandomAvailableDailyAchievement(
  previousAchievementIds: string[],
  timezone: string,
  userId?: string,
): Promise<Achievement | null> {
  const packFilter = await getAchievementPackFilter(userId);

  const { data: achievements, error } = await supabaseAdmin
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
      trigger_type,
      trigger_config,
      is_daily,
      is_secret,
      pack_id
      `,
    )
    .eq("is_daily", true)
    .or(packFilter)
    .eq("status", "published");

  if (error) {
    console.error("Error fetching daily achievements:", error);

    return null;
  }

  if (!achievements || achievements.length === 0) {
    console.error("No daily achievements exist in the database.");

    return null;
  }

  const availableAchievements = achievements.filter(
    (achievement) =>
      !previousAchievementIds.includes(achievement.id) &&
      isDailyAchievementEligible(achievement as Achievement, timezone),
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
export async function claimDailyAchievementForAuthenticatedUser(): Promise<DailyClaimResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      status: "unavailable",
      achievement: null,
    };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone ?? "UTC";

  const today = getToday(timezone);

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
          icon_path,
          created_at,
          trigger_type,
          trigger_config,
          is_daily,
          is_secret,
          pack_id
        )
        `,
    )
    .eq("user_id", user.id)
    .eq("achievement_date", today)
    .maybeSingle();

  if (existingClaimError) {
    console.error("Error checking today's achievement:", existingClaimError);

    return {
      status: "unavailable",
      achievement: null,
    };
  }

  // User already has today's achievement.
  if (existingClaim) {
    return {
      status: "already_claimed",
      achievement: null,
    };
  }

  // Prevent timezone hopping.
  //
  // A normal rollover into a new calendar day in the
  // same timezone is allowed immediately after midnight.
  //
  // If the user's timezone changed since their previous
  // daily claim, require a reasonable amount of real
  // elapsed time before allowing another claim.

  const { data: lastDailyClaim, error: lastDailyClaimError } =
    await supabaseAdmin
      .from("user_achievements")
      .select(
        `
  created_at,
  claim_timezone,
  achievements!inner (
  is_daily
  )
  `,
      )
      .eq("user_id", user.id)
      .eq("achievements.is_daily", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (lastDailyClaimError) {
    console.error("Error checking previous daily claim:", lastDailyClaimError);

    return {
      status: "unavailable",
      achievement: null,
    };
  }

  if (
    lastDailyClaim?.created_at &&
    lastDailyClaim.claim_timezone &&
    lastDailyClaim.claim_timezone !== timezone
  ) {
    const lastClaimTime = new Date(lastDailyClaim.created_at).getTime();
    const elapsed = Date.now() - lastClaimTime;

    if (elapsed < DAILY_CLAIM_COOLDOWN_MS) {
      return {
        status: "already_claimed",
        achievement: null,
      };
    }
  }

  // --------------------------------------------------
  // Check whether the user can earn another achievement.
  // --------------------------------------------------

  const entitlements = await getUserEntitlements(user.id);

  if (!entitlements.canClaimAchievement) {
    return {
      status: "subscription_required",
      achievement: null,
    };
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

    return {
      status: "unavailable",
      achievement: null,
    };
  }

  const previousAchievementIds =
    previousClaims?.map((claim) => claim.achievement_id) ?? [];

  // --------------------------------------------------
  // Select a random unused DAILY achievement.
  // --------------------------------------------------

  const achievement = await getRandomAvailableDailyAchievement(
    previousAchievementIds,
    timezone,
    user.id,
  );

  if (!achievement) {
    return {
      status: "unavailable",
      achievement: null,
    };
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
      claim_timezone: timezone,
    })
    .select("created_at, achievement_date")
    .single();

  if (claimError) {
    if (isFreeLimitError(claimError)) {
      return { status: "subscription_required", achievement: null };
    }
    console.error(
      "Error recording authenticated daily achievement:",
      claimError,
    );

    return {
      status: "unavailable",
      achievement: null,
    };
  }

  // --------------------------------------------------
  // Evaluate triggered achievements after today's
  // daily achievement has been recorded.
  // --------------------------------------------------

  const triggeredAchievements =
    await evaluateTriggeredAchievementsForAuthenticatedUser();

  return {
    status: "claimed",
    achievement: {
      ...achievement,
      user_id: user.id,
      created_at: claim.created_at,
      is_daily: true,
    },
    triggeredAchievements,
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

  const timezone = anonymousUser.timezone ?? "UTC";

  const today = getToday(timezone);

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

  const { data: lastDailyClaim, error: lastDailyClaimError } =
    await supabaseAdmin
      .from("anonymous_achievements")
      .select(
        `
    created_at,
    claim_timezone,
    achievements!inner (
    is_daily
    )
    `,
      )
      .eq("anonymous_user_id", anonymousUser.id)
      .eq("achievements.is_daily", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (lastDailyClaimError) {
    console.error(
      "Error checking previous anonymous daily claim:",
      lastDailyClaimError,
    );

    return null;
  }

  if (
    lastDailyClaim?.created_at &&
    lastDailyClaim.claim_timezone &&
    lastDailyClaim.claim_timezone !== timezone
  ) {
    const lastClaimTime = new Date(lastDailyClaim.created_at).getTime();
    const elapsed = Date.now() - lastClaimTime;

    if (elapsed < DAILY_CLAIM_COOLDOWN_MS) {
      return null;
    }
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
    timezone,
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
      claim_timezone: timezone,
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
        claim_timezone,
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

  const entitlements = await getUserEntitlements(user.id);
  const migrationLimit = entitlements.isSubscribed
    ? Number.POSITIVE_INFINITY
    : entitlements.remainingFreeAchievements;

  let migrated = 0;
  let skipped = 0;

  for (const claim of anonymousClaims ?? []) {
    // Migration must obey the same free limit as a normal claim, including
    // awards already added by this batch.
    if (migrated >= migrationLimit) {
      skipped++;
      continue;
    }

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
        claim_timezone: claim.claim_timezone,

        // Preserve when the anonymous achievement was originally earned.
        created_at: claim.created_at,
      });

    if (insertError) {
      if (isFreeLimitError(insertError)) {
        skipped++;
        continue;
      }
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

export async function getCollectionAchievements(
  userId: string,
): Promise<Achievement[]> {
  const packFilter = await getAchievementPackFilter(userId);

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .or(packFilter)
    .eq("status", "published")
    .eq("is_secret", false)
    .order("type")
    .order("title");

  if (error) {
    console.error("Error loading achievement catalog:", error);

    throw new Error("Unable to load achievement catalog");
  }

  return data ?? [];
}

export async function getLatestMetaAchievement(
  userId: string,
): Promise<Achievement | null> {
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      created_at,
      achievements!inner (
        id,
        title,
        description,
        type,
        emoji,
        icon_path,
        created_at,
        trigger_type,
        trigger_config,
        is_daily,
        is_secret,
        pack_id,
        status
      )
    `,
    )
    .eq("user_id", userId)
    .not("achievements.trigger_type", "is", null)
    .neq("achievements.trigger_type", "daily_claim")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest meta achievement:", error);
    return null;
  }

  if (!data?.achievements) {
    return null;
  }

  const achievement = Array.isArray(data.achievements)
    ? data.achievements[0]
    : data.achievements;

  if (!achievement) {
    return null;
  }

  return {
    ...achievement,
    user_id: userId,
    created_at: data.created_at,
  } as Achievement;
}
