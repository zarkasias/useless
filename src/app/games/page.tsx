import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getAuthenticatedMemoryAchievements } from "@/lib/services/game-service-server";

import GamesClient from "./games-client";

export default async function GamesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, entitlements, memoryAchievements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getUserEntitlements(user.id),
    getAuthenticatedMemoryAchievements(6),
  ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <GamesClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialMemoryAchievements={memoryAchievements}
    />
  );
}
