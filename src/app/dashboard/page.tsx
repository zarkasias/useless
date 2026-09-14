import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserStreakData,
  evaluateTriggeredAchievementsForAuthenticatedUser,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";

import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  // Evaluate non-daily triggered achievements first.
  const triggeredAchievements =
    await evaluateTriggeredAchievementsForAuthenticatedUser();

  const [profile, achievements, streakData, entitlements, packs] =
    await Promise.all([
      getAuthenticatedUserProfile(),
      getAuthenticatedUserAchievements(),
      getAuthenticatedUserStreakData(),
      getUserEntitlements(user.id),
      getStoreAchievementPacks(),
    ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <DashboardClient
      initialProfile={profile}
      initialPacks={packs}
      initialAchievements={achievements}
      initialStreakData={streakData}
      initialEntitlements={entitlements}
      initialTriggeredAchievements={triggeredAchievements}
    />
  );
}
