import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getAuthenticatedGameStats } from "@/lib/services/game-service-server";

import SpiderClient from "./spider-client";

export default async function SpiderPage() {
  const profile = await getAuthenticatedUserProfile();

  if (!profile) {
    redirect("/login?next=/games/spider");
  }

  const [entitlements, spiderStats] = await Promise.all([
    getUserEntitlements(profile.id),
    getAuthenticatedGameStats("spider"),
  ]);

  if (!entitlements.isSubscribed) {
    redirect("/games");
  }

  return (
    <SpiderClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialStats={spiderStats}
    />
  );
}
