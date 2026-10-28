import { redirect } from "next/navigation";
import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getAuthenticatedGameStats } from "@/lib/services/game-service-server";
import GuessClient from "./guess-client";

export default async function GuessPage() {
  const profile = await getAuthenticatedUserProfile();
  if (!profile) redirect("/login?next=/games/guess");

  const [entitlements, stats] = await Promise.all([
    getUserEntitlements(profile.id),
    getAuthenticatedGameStats("guess"),
  ]);
  if (!entitlements.isSubscribed) redirect("/games");

  return <GuessClient initialProfile={profile} initialEntitlements={entitlements} initialStats={stats} />;
}
