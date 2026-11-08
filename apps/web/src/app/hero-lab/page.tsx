import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroLabClient } from "@/components/hero/hero-lab-client";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";
import { getFeaturedHeroAchievements } from "@/lib/services/achievement-service-server";
import { getVisitorTodaysClaim } from "@/lib/services/todays-claim-service-server";
import type { ShareImageInput } from "@/lib/share-image";

// A development-only workbench for tuning the hero animation.
export const metadata: Metadata = {
  title: "Hero lab - Useless Achievements",
  robots: { index: false, follow: false },
};

export default async function HeroLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  // A mix of rarities, so the focus peek shows variety.
  // Whether this visitor already claimed today, from anywhere, so the hero
  // can open on the collapsed deck instead of the stream.
  const [featured, visitor] = await Promise.all([
    getFeaturedHeroAchievements(12),
    getVisitorTodaysClaim(),
  ]);
  const samples: ShareImageInput[] = featured.map((achievement) => ({
    title: achievement.title,
    description: achievement.description,
    type: achievement.type,
    emoji: achievement.emoji,
    iconUrl: getAchievementIconUrl(achievement.icon_path),
  }));

  return (
    <HeroLabClient
      samples={samples}
      signedIn={visitor.signedIn}
      linked={visitor.linked}
      todaysClaim={visitor.achievement}
      mustSignIn={visitor.mustSignIn}
    />
  );
}
