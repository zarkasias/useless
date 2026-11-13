"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { Navbar } from "@/components/navbar";
import { CardWall } from "@/components/card-wall/card-wall";
import {
  isLockedOnWall,
  isLockedWhenZoomed,
  type CardLockState,
} from "@/components/card-wall/card-lock";
import { CardZoom, type ZoomTarget } from "@/components/card-wall/card-zoom";
import styles from "@/components/home/home-styles";
import { getShowcaseAchievements } from "@/components/home/home-data";
import { FinalCta } from "@/components/home-preview/final-cta";
import { GamesStrip } from "@/components/home-preview/games-strip";
import { GoFurther } from "@/components/home-preview/go-further";
import { HowItWorks } from "@/components/home-preview/how-it-works";
import { RarityTiers } from "@/components/card-wall/rarity-tiers";
import { panelClass, WallHero } from "@/components/card-wall/wall-hero";
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
 * The homepage: a moving wall of achievement cards behind everything, with a
 * centred hero and a column of white panels (how it works, the rarities,
 * games, Pro and the featured pack) and a final Claim over it.
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

  // The zoomed card, if any. The wall holds still while one is open.
  const [zoom, setZoom] = useState<(ZoomTarget & { key: number }) | null>(
    null,
  );
  const openCard = useCallback(
    (achievement: Achievement, source: HTMLElement) =>
      setZoom((current) =>
        current
          ? current
          : { achievement, source, hideSource: true, key: Date.now() },
      ),
    [],
  );
  const closeZoom = useCallback(() => setZoom(null), []);

  const showcase = useMemo(
    () => getShowcaseAchievements(featuredAchievements, 0, 12),
    [featuredAchievements],
  );
  const sample = showcase[0];

  // Claim through the existing flow. Reopening today's card is wired up
  // with the zoom (build steps 4 and 5).
  const onClaim = () => {
    if (!claimed) void claim();
  };

  // The final Claim button scrolls back up first, so the result is seen.
  const claimFromBottom = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document
      .getElementById("top")
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    onClaim();
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
      <CardWall
        catalog={catalog}
        isLocked={isLockedOnWallCard}
        onOpen={openCard}
        paused={zoom !== null}
      />

      {zoom && (
        <CardZoom
          key={zoom.key}
          target={zoom}
          locked={isLockedWhenZoomed(lockState, zoom.achievement.id)}
          onClosed={closeZoom}
        />
      )}

      <div className="relative z-10">
        <Navbar
          user={initialProfile}
          isSubscribed={isSubscribed}
          subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
        />

        {/* The page column ignores the pointer, so wall cards in the gaps
            stay clickable; panels, links and buttons take it back. */}
        <div className="pointer-events-none flex flex-col items-center gap-[160px] px-5 pt-6 pb-[160px] max-[720px]:gap-[110px] max-[720px]:pb-[110px]">
          <WallHero
            signedIn={visitor.signedIn}
            claimState={claimState}
            mustSignIn={visitor.mustSignIn}
            onClaim={onClaim}
          />
          <HowItWorks sample={sample} />
          <RarityTiers catalog={catalog} className={panelClass} />
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
    </div>
  );
}
