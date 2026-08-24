"use server";

import { cookies } from "next/headers";

import { Achievement } from "@/lib/supabase";

import {
  getAuthenticatedUser,
  claimDailyAchievementForAuthenticatedUser,
  claimDailyAchievementForAnonymousUser,
  mergeAnonymousAchievementsIntoCurrentUser,
  getAuthenticatedUserStreakData,
} from "@/lib/services/achievement-service-server";

import type { AchievementStreakData } from "@/lib/services/achievement-service-server";

import { createAnonymousUser } from "@/lib/anonymous-user";

const ANONYMOUS_COOKIE = "anonymous_user_id";

export async function claimDailyAchievementAction(): Promise<Achievement | null> {
  const user = await getAuthenticatedUser();

  // --------------------------------------------------
  // Authenticated user
  // --------------------------------------------------

  if (user) {
    return await claimDailyAchievementForAuthenticatedUser();
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

  return await claimDailyAchievementForAnonymousUser(anonymousId);
}

// --------------------------------------------------
// merge achievement actions
// --------------------------------------------------

export async function migrateAnonymousAchievementsAction(): Promise<{
  migrated: number;
  skipped: number;
}> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error(
      "User must be logged in before migrating anonymous achievements.",
    );
  }

  const cookieStore = await cookies();

  const anonymousId = cookieStore.get(ANONYMOUS_COOKIE)?.value;

  if (!anonymousId) {
    return {
      migrated: 0,
      skipped: 0,
    };
  }

  const result = await mergeAnonymousAchievementsIntoCurrentUser(anonymousId);

  return result;
}

export async function getStreakDataAction(): Promise<AchievementStreakData> {
  return await getAuthenticatedUserStreakData();
}
