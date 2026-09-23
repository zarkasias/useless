import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getAuthenticatedMemoryAchievements } from "@/lib/services/game-service-server";
import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import MemoryClient from "./memory-client";

export default async function MemoryGamePage() {
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

  if (!entitlements.isSubscribed) {
    redirect("/games");
  }

  if (memoryAchievements.length < 6) {
    redirect("/games");
  }

  return (
    <MemoryClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialAchievements={memoryAchievements}
    />
  );
}
