import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import AchievementsClient from "./achievements-client";

export default async function AchievementsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, achievements, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getAuthenticatedUserAchievements(),
    getUserEntitlements(user.id),
  ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <AchievementsClient
      initialProfile={profile}
      initialAchievements={achievements}
      initialEntitlements={entitlements}
    />
  );
}
