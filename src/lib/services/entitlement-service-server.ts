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

const FREE_ACHIEVMENT_LIMIT = 10;

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
    { count: achievementCount, error: achievementCountError },
    { data: subscription, error: subscriptionError },
    { data: complimentarySubscription, error: complimentarySubscriptionError },
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

    supabaseAdmin
      .from("complimentary_subscriptions")
      .select(
        `
        id,
        expires_at,
        revoked_at
      `,
      )
      .eq("user_id", userId)
      .is("revoked_at", null)
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

  if (complimentarySubscriptionError) {
    console.error(
      "Error fetching complimentary subscription for entitlements",
      complimentarySubscriptionError,
    );

    throw new Error("Unable to determine user entitlements");
  }

  const count = achievementCount ?? 0;

  const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

  const hasActivePaidSubscription =
    subscription != null &&
    ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);

  const hasComplimentarySubscription =
    complimentarySubscription != null &&
    (complimentarySubscription.expires_at === null ||
      new Date(complimentarySubscription.expires_at) > new Date());

  const isSubscribed =
    hasActivePaidSubscription || hasComplimentarySubscription;

  const hasReachedFreeLimit = count >= FREE_ACHIEVMENT_LIMIT && !isSubscribed;

  return {
    achievementCount: count,

    freeAchievementLimit: FREE_ACHIEVMENT_LIMIT,

    remainingFreeAchievements: isSubscribed
      ? 0
      : Math.max(FREE_ACHIEVMENT_LIMIT - count, 0),

    isSubscribed,

    subscriptionStatus: hasComplimentarySubscription
      ? "complimentary"
      : (subscription?.status ?? null),

    billingInterval: hasComplimentarySubscription
      ? null
      : (subscription?.billing_interval ?? null),

    hasReachedFreeLimit,

    canClaimAchievement: count < FREE_ACHIEVMENT_LIMIT || isSubscribed,
  };
}
