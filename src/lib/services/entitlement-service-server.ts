import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

const FREE_ACHIEVMENT_LIMIT = 5;

export interface UserEntitlements {
  achievementCount: number;
  freeAchievementLimit: number;
  remainingFreeAchievements: number;

  isSubscribed: boolean;
  subscriptionStatus: string | null;
  billingInterval: string | null;

  hasReachedFreeLimit: boolean;
  canClaimAchievement: boolean;
}

export async function getUserEntitlements(
  userId: string,
): Promise<UserEntitlements> {
  const [
    { count: achievmentCount, error: achievementCountError },
    { data: subscription, error: subscriptionError },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_achievements")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),

    supabaseAdmin
      .from("subscriptions")
      .select(
        `
            status,
            billing_interval
        `,
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (achievementCountError) {
    console.error(
      "Error fetching achievement count for entitlements:",
      achievementCountError,
    );

    throw new Error("Unable to determine user entitlements.");
  }

  if (subscriptionError) {
    console.error(
      "Error fetching subscription for entitlements",
      subscriptionError,
    );

    throw new Error("Unable to determine user entitlements.");
  }

  const count = achievmentCount ?? 0;

  const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

  const isSubscribed =
    subscription != null &&
    ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);

  const hasReachedFreeLimit = count >= FREE_ACHIEVMENT_LIMIT && !isSubscribed;

  return {
    achievementCount: count,

    freeAchievementLimit: FREE_ACHIEVMENT_LIMIT,

    remainingFreeAchievements: isSubscribed
      ? 0
      : Math.max(FREE_ACHIEVMENT_LIMIT - count, 0),

    isSubscribed,

    subscriptionStatus: subscription?.status ?? null,

    billingInterval: subscription?.billing_interval ?? null,

    hasReachedFreeLimit,

    canClaimAchievement: count < FREE_ACHIEVMENT_LIMIT || isSubscribed,
  };
}
