"use client";

import { useCallback, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { Navbar } from "@/components/navbar";
import { CardWall } from "@/components/card-wall/card-wall";
import {
  isLockedOnWall,
  type CardLockState,
} from "@/components/card-wall/card-lock";
import styles from "@/components/home/home-styles";
import { getShowcaseAchievements } from "@/components/home/home-data";
import { CardStreamHero } from "@/components/hero/card-stream-hero";
import { FinalCta } from "@/components/home-preview/final-cta";
import { GamesStrip } from "@/components/home-preview/games-strip";
import { GoFurther } from "@/components/home-preview/go-further";
import { HowItWorks } from "@/components/home-preview/how-it-works";
import {
  pickLadder,
  RarityLadder,
} from "@/components/home-preview/rarity-ladder";
import { toShareInput } from "@/components/home-preview/use-card-face";
import { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import type { VisitorClaim } from "@/lib/services/todays-claim-service-server";
import type { Achievement, UserProfile } from "@/lib/supabase";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const NO_CLAIM: VisitorClaim = {
  signedIn: false,
  linked: false,
  achievement: null,
  mustSignIn: false,
};

interface HomePageClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
  initialPacks: StoreAchievementPack[];
  featuredAchievements?: Achievement[];
  /** What the server knows about this visitor's claim today. */
  visitor?: VisitorClaim;
  /** Every achievement on the card wall. */
  catalog?: Achievement[];
  /** Ids of the wall achievements this user has unlocked. */
  unlockedIds?: string[];
}

/**
 * The homepage: the card stream hero, then a short story (how it works, the
 * rarities, games, going further) and a final Claim.
 */
export default function HomePageClient({
  initialProfile,
  initialEntitlements,
  initialPacks,
  featuredAchievements,
  visitor = NO_CLAIM,
  catalog = [],
  unlockedIds = [],
}: HomePageClientProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const claimState = useDailyClaim({
    signedIn: visitor.signedIn,
    todaysClaim: visitor.achievement,
  });
  const { claimed, isClaiming, claim } = claimState;
  const isLoggedIn = initialProfile !== null;
  const isSubscribed = initialEntitlements?.isSubscribed ?? false;

  // Locked or unlocked, from the existing unlock records and today's claim.
  const lockState = useMemo<CardLockState>(
    () => ({
      signedIn: visitor.signedIn,
      unlockedIds: new Set(unlockedIds),
      claimedId: claimed?.id ?? null,
    }),
    [visitor.signedIn, unlockedIds, claimed],
  );
  const isLockedOnWallCard = useCallback(
    (achievement: Achievement) => isLockedOnWall(lockState, achievement.id),
    [lockState],
  );

  const showcase = useMemo(
    () => getShowcaseAchievements(featuredAchievements, 0, 12),
    [featuredAchievements],
  );
  const sample = showcase[0];
  const ladder = useMemo(
    () => pickLadder(showcase, sample),
    [showcase, sample],
  );
  // Faces for the hero's sample peeks.
  const samples = useMemo(
    () => (featuredAchievements ?? []).map(toShareInput),
    [featuredAchievements],
  );

  // The final Claim button scrolls back up first, so the reveal is seen.
  const claimFromBottom = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document
      .getElementById("top")
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    void claim();
  };

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils
          .toArray<HTMLElement>("[data-story-reveal]", rootRef.current)
          .forEach((section) => {
            gsap.from(section.children, {
              y: 32,
              autoAlpha: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 85%", once: true },
            });
          });
      });

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={styles.home}>
      <CardWall catalog={catalog} isLocked={isLockedOnWallCard} />

      <div className="relative z-10">
        <Navbar
          user={initialProfile}
          isSubscribed={isSubscribed}
          subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
        />

        <CardStreamHero
          claimState={claimState}
          samples={samples}
          signedIn={visitor.signedIn}
          linked={visitor.linked}
          mustSignIn={visitor.mustSignIn}
        />

        <HowItWorks sample={sample} />
        <RarityLadder achievements={ladder} />
        <GamesStrip isLoggedIn={isLoggedIn} isSubscribed={isSubscribed} />
        <GoFurther
          packs={initialPacks}
          isLoggedIn={isLoggedIn}
          isSubscribed={isSubscribed}
        />
        <FinalCta
          hasClaimed={claimed !== null}
          isClaiming={isClaiming}
          mustSignIn={visitor.mustSignIn}
          onClaim={claimFromBottom}
        />
      </div>
    </div>
  );
}
