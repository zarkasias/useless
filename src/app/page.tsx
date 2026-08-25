import HomeClient from "@/app/home/home-client";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  const profile = user ? await getAuthenticatedUserProfile() : null;

  const entitlements = user ? await getUserEntitlements(user.id) : null;

  return (
    <HomeClient initialProfile={profile} initialEntitlements={entitlements} />
  );
}
