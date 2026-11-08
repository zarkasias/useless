import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HomePreviewClient from "@/app/home-preview/home-preview-client";
import {
  getAuthenticatedUserProfile,
  getFeaturedHeroAchievements,
} from "@/lib/services/achievement-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";
import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

// A side-by-side candidate for the homepage, for development only. Not
// linked or indexed, and a 404 in production builds.
export const metadata: Metadata = {
  title: "Homepage preview - Useless Achievements",
  robots: { index: false, follow: false },
};

export default async function HomePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const user = await getAuthenticatedUser();

  const [profile, entitlements, packs, featuredAchievements] =
    await Promise.all([
      user ? getAuthenticatedUserProfile() : Promise.resolve(null),
      user ? getUserEntitlements(user.id) : Promise.resolve(null),
      getStoreAchievementPacks(),
      getFeaturedHeroAchievements(),
    ]);

  return (
    <HomePreviewClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      initialPacks={packs.filter((pack) => pack.status !== "draft")}
      featuredAchievements={featuredAchievements}
    />
  );
}
