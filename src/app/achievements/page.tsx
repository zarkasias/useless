import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import AchievementsClient from "./achievements-client";

export default async function AchievementsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, achievements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getAuthenticatedUserAchievements(),
  ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <AchievementsClient
      initialProfile={profile}
      initialAchievements={achievements}
    />
  );
}
