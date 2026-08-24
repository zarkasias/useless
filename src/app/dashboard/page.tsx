import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserStreakData,
} from "@/lib/services/achievement-service-server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const profile = await getAuthenticatedUserProfile();

  if (!profile) {
    redirect("/");
  }

  const achievements = await getAuthenticatedUserAchievements();
  const streakData = await getAuthenticatedUserStreakData();

  return (
    <DashboardClient
      initialProfile={profile}
      initialAchievements={achievements}
      initialStreakData={streakData}
    />
  );
}
