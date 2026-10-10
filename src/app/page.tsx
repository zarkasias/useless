import type { Metadata } from "next";
import HomeClient from "@/app/home/home-client";

import {
  getAuthenticatedUserProfile,
  getFeaturedHeroAchievements,
} from "@/lib/services/achievement-service-server";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";

export const metadata: Metadata = {
  title: "Useless Achievements - Collect Ridiculously Pointless Achievements",
  description:
    "Collect hilariously useless achievements, build your collection, keep a streak, and compete on the leaderboard.",
};

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  const [profile, entitlements, packs, featureAchievements] = await Promise.all(
    [
      user ? getAuthenticatedUserProfile() : Promise.resolve(null),
      user ? getUserEntitlements(user.id) : Promise.resolve(null),

      // Always load packs, logged in or not
      getStoreAchievementPacks(),
      getFeaturedHeroAchievements(),
    ],
  );
  const initialPacks = packs.filter((pack) => pack.status !== "draft");

  return (
    <HomeClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialPacks={initialPacks}
      featuredAchievements={featureAchievements}
    />
  );
}
