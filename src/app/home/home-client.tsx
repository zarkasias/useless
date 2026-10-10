"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { HeroSection } from "@/components/home/hero-section";
import { CollectionStory } from "@/components/home/collection-story";
import { GamesStory } from "@/components/home/games-story";
import { ProfileStory } from "@/components/home/profile-story";
import { PacksStory } from "@/components/home/packs-story";
import { SubscriptionStory } from "@/components/home/subscription-story";
import { getShowcaseAchievements } from "@/components/home/home-data";

import type { Achievement, UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import { claimDailyAchievementAction } from "@/app/actions/achievement-actions";

import styles from "@/components/home/home-styles";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HomeClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
  initialPacks: StoreAchievementPack[];
  featuredAchievements?: Achievement[];
}

export default function HomeClient({
  initialProfile,
  initialEntitlements,
  initialPacks,
  featuredAchievements,
}: HomeClientProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const claimingRef = useRef(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const achievements = useMemo(
    () => getShowcaseAchievements(featuredAchievements),
    [featuredAchievements],
  );

  const collectionAchievements = useMemo(
    () => getShowcaseAchievements(featuredAchievements, 4, 8),
    [featuredAchievements],
  );

  const profileAchievements = useMemo(
    () => getShowcaseAchievements(featuredAchievements, 8, 12),
    [featuredAchievements],
  );

  const safeSelectedIndex = Math.max(
    0,
    Math.min(selectedIndex, achievements.length - 1),
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const headings = gsap.utils.toArray<HTMLElement>(
          "[data-story-reveal]",
          rootRef.current,
        );

        headings.forEach((heading) => {
          gsap.from(heading, {
            y: 38,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 88%",
              once: true,
            },
          });
        });
      });

      return () => media.revert();
    },
    { scope: rootRef },
  );

  const handleGetDailyAchievement = async () => {
    if (claimingRef.current) return;

    claimingRef.current = true;
    setIsClaiming(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await claimDailyAchievementAction(timezone);

      if (result.status === "already_claimed") {
        toast.info("You've already claimed today's achievement.");
        return;
      }

      if (result.status === "subscription_required") {
        router.push("/pro");
        return;
      }

      if (result.status === "unavailable") {
        toast.error("Today's achievement is unavailable right now.");
        return;
      }

      setUnlockedAchievement(result.achievement);
      setShowAchievementModal(true);
      toast.success("Today's achievement unlocked!");
      router.refresh();
    } catch (error) {
      console.error("Error claiming daily achievement:", error);
      toast.error("Something went wrong.");
    } finally {
      claimingRef.current = false;
      setIsClaiming(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.home}>
      <Navbar
        user={initialProfile}
        isSubscribed={initialEntitlements?.isSubscribed ?? false}
        subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
      />

      <HeroSection
        achievements={achievements}
        selectedIndex={safeSelectedIndex}
        onSelect={setSelectedIndex}
        isClaiming={isClaiming}
        onClaim={handleGetDailyAchievement}
        isLoggedIn={!!initialProfile}
        isSubscribed={initialEntitlements?.isSubscribed ?? false}
      />

      <CollectionStory
        achievements={collectionAchievements}
        selectedIndex={safeSelectedIndex}
        onSelect={setSelectedIndex}
        isLoggedIn={!!initialProfile}
      />

      <div data-story-reveal>
        <GamesStory
          isLoggedIn={!!initialProfile}
          isSubscribed={initialEntitlements?.isSubscribed ?? false}
        />
      </div>

      <div data-story-reveal>
        <ProfileStory
          user={initialProfile}
          achievements={profileAchievements}
        />
      </div>

      <div data-story-reveal>
        <PacksStory packs={initialPacks} isLoggedIn={!!initialProfile} />
      </div>

      <SubscriptionStory
        isLoggedIn={!!initialProfile}
        isSubscribed={initialEntitlements?.isSubscribed ?? false}
        isClaiming={isClaiming}
        onClaim={handleGetDailyAchievement}
      />

      {unlockedAchievement && (
        <UnlockAchievement
          achievement={unlockedAchievement}
          isOpen={showAchievementModal}
          onClose={() => setShowAchievementModal(false)}
          isLoggedIn={!!initialProfile}
        />
      )}
    </div>
  );
}
