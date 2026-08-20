"use server";

import { cookies } from "next/headers";

import { Achievement } from "@/lib/supabase";

import {
  getAuthenticatedUser,
  unlockAchievementForCurrentUser,
  claimDailyAchievementForAnonymousUser,
  claimDailyAchievementForAuthenticatedUser,
  getAnonymousAchievementCount,
} from "@/lib/achievement-service-server";

import { createAnonymousUser } from "@/lib/anonymous-user";
import { getRandomAchievement } from "@/lib/achievement-generator";

const ANONYMOUS_COOKIE = "anonymous_user_id";
const FREE_ANONYMOUS_LIMIT = 5;

export interface ClaimResult {
  achievement: Achievement | null;
  paywalled: boolean;
  remaining: number;
}

/*
 * Existing action.
 *
 * Keep this for the current dashboard until we replace
 * the button with the new daily claim flow.
 */
export async function unlockRandomAchievementAction(): Promise<Achievement | null> {
  const achievement = getRandomAchievement();

  return await unlockAchievementForCurrentUser(achievement);
}

/**
 * Claim a daily achievement from the database.
 *
 * - Authenticated users: claim directly (no paywall).
 * - Anonymous users: 5 free claims, then a paywall prompts sign-up.
 */
export async function claimDailyAchievementAction(): Promise<ClaimResult> {
  const user = await getAuthenticatedUser();

  // --------------------------------------------------
  // Authenticated user — no paywall
  // --------------------------------------------------

  if (user) {
    const achievement = await claimDailyAchievementForAuthenticatedUser();

    return {
      achievement,
      paywalled: false,
      remaining: Infinity,
    };
  }

  // --------------------------------------------------
  // Anonymous user
  // --------------------------------------------------

  const cookieStore = await cookies();

  const existingAnonymousId = cookieStore.get(ANONYMOUS_COOKIE)?.value;

  let anonymousId: string;

  if (existingAnonymousId) {
    anonymousId = existingAnonymousId;
  } else {
    const anonymousUser = await createAnonymousUser();

    anonymousId = anonymousUser.anonymous_id;

    cookieStore.set({
      name: ANONYMOUS_COOKIE,
      value: anonymousId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // Paywall: enforce the free limit
  const count = await getAnonymousAchievementCount(anonymousId);

  if (count >= FREE_ANONYMOUS_LIMIT) {
    return {
      achievement: null,
      paywalled: true,
      remaining: 0,
    };
  }

  const achievement = await claimDailyAchievementForAnonymousUser(anonymousId);

  return {
    achievement,
    paywalled: false,
    remaining: FREE_ANONYMOUS_LIMIT - (count + (achievement ? 1 : 0)),
  };
}

/**
 * Get the number of free achievements remaining for the current visitor.
 * Authenticated users get Infinity; anonymous users get 5 minus claimed.
 */
export async function getFreeAchievementsRemainingAction(): Promise<number> {
  const user = await getAuthenticatedUser();

  if (user) {
    return Infinity;
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(ANONYMOUS_COOKIE)?.value;

  if (!anonymousId) {
    return FREE_ANONYMOUS_LIMIT;
  }

  const count = await getAnonymousAchievementCount(anonymousId);

  return Math.max(0, FREE_ANONYMOUS_LIMIT - count);
}
