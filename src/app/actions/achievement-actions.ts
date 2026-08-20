"use server";

import { cookies } from "next/headers";

import { Achievement } from "@/lib/supabase";

import {
  getAuthenticatedUser,
  unlockAchievementForCurrentUser,
  claimDailyAchievementForAnonymousUser,
} from "@/lib/achievement-service-server";

import { createAnonymousUser } from "@/lib/anonymous-user";
import { getRandomAchievement } from "@/lib/achievement-generator";

const ANONYMOUS_COOKIE = "anonymous_user_id";

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

export async function claimDailyAchievementAction(): Promise<Achievement | null> {
  const user = await getAuthenticatedUser();

  // --------------------------------------------------
  // Authenticated user
  // --------------------------------------------------

  if (user) {
    // We'll add the authenticated daily claim logic next.
    return null;
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
