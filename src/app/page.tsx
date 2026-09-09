import HomeClient from "@/app/home/home-client";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  const [profile, entitlements, packs] = await Promise.all([
    user ? getAuthenticatedUserProfile() : Promise.resolve(null),
    user ? getUserEntitlements(user.id) : Promise.resolve(null),

    // Always load packs, logged in or not
    getStoreAchievementPacks(),
  ]);

  // return the home client
  return (
    <HomeClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialPacks={packs}
    />
  );
}
