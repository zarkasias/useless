import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserStreakData,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, achievements, streakData, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getAuthenticatedUserAchievements(),
    getAuthenticatedUserStreakData(),
    getUserEntitlements(user.id),
  ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <DashboardClient
      initialProfile={profile}
      initialAchievements={achievements}
      initialStreakData={streakData}
      initialEntitlements={entitlements}
    />
  );
}
