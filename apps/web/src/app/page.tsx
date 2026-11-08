import type { Metadata } from "next";
import HomePageClient from "@/app/home/home-page-client";

import {
  getAuthenticatedUserProfile,
  getFeaturedHeroAchievements,
} from "@/lib/services/achievement-service-server";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";
import { getVisitorTodaysClaim } from "@/lib/services/todays-claim-service-server";

export const metadata: Metadata = {
  title: "Useless Achievements - Collect Ridiculously Pointless Achievements",
  description:
    "Collect hilariously useless achievements, build your collection, keep a streak, and compete on the leaderboard.",
};

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  const [profile, entitlements, packs, featureAchievements, visitor] =
    await Promise.all([
      user ? getAuthenticatedUserProfile() : Promise.resolve(null),
      user ? getUserEntitlements(user.id) : Promise.resolve(null),

      // Always load packs, logged in or not
      getStoreAchievementPacks(),
      getFeaturedHeroAchievements(),
      // Whether this visitor already claimed today, from anywhere, so the
      // hero can open on their card instead of the stream.
      getVisitorTodaysClaim(),
    ]);
  const initialPacks = packs.filter((pack) => pack.status !== "draft");

  return (
    <HomePageClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialPacks={initialPacks}
      featuredAchievements={featureAchievements}
      visitor={visitor}
    />
  );
}
