import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import SolitaireClient from "./solitaire-client";

export default async function SolitairePage() {
  const profile = await getAuthenticatedUserProfile();

  if (!profile) {
    redirect("/login?next=/games/solitaire");
  }

  const entitlements = await getUserEntitlements(profile.id);

  if (!entitlements.isSubscribed) {
    redirect("/games");
  }

  return (
    <SolitaireClient
      initialProfile={profile}
      initialEntitlements={entitlements}
    />
  );
}
