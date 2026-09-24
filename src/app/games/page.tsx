import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import GamesClient from "./games-client";

export default async function GamesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getUserEntitlements(user.id),
  ]);

  if (!profile) {
    redirect("/");
  }

  return (
    <GamesClient initialProfile={profile} initialEntitlements={entitlements} />
  );
}
