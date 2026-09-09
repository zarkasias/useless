import { redirect } from "next/navigation";

import {
  getCollectionAchievements,
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

  const [profile, allAchievements, collectedAchievements, entitlements] =
    await Promise.all([
      getAuthenticatedUserProfile(),
      getCollectionAchievements(user.id),
      getAuthenticatedUserAchievements(),
      getUserEntitlements(user.id),
    ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <AchievementsClient
      initialProfile={profile}
      allAchievements={allAchievements}
      collectedAchievements={collectedAchievements}
      initialEntitlements={entitlements}
    />
  );
}
