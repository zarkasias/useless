"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  CLAIM_HEADING,
  freeClaimLine,
  useClaimReveal,
} from "@/components/card-wall/claim-reveal";
import { ZoomShare } from "@/components/card-wall/zoom-share";
import styles from "@/components/home/home-styles";
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
  visitor = NO_CLAIM,
  catalog = [],
  unlockedIds = [],
}: HomePageClientProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const claimState = useDailyClaim({
    signedIn: visitor.signedIn,
    todaysClaim: visitor.achievement,
  });
  const { claimed, restored } = claimState;
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
  const [zoom, setZoom] = useState<
    (ZoomTarget & { key: number; fromClaim: boolean }) | null
  >(null);
  const open = useCallback(
    (achievement: Achievement, source: HTMLElement, fromClaim: boolean) =>
      setZoom(
        (current) =>
          current ?? {
            achievement,
            source,
            // A wall card hides while zoomed; a Claim button stays put.
            hideSource: !fromClaim,
            fromClaim,
            key: Date.now(),
          },
      ),
    [],
  );
  const openCard = useCallback(
    (achievement: Achievement, card: HTMLElement) =>
      open(achievement, card, false),
    [open],
  );
  const revealClaim = useCallback(
    (achievement: Achievement, button: HTMLElement) =>
      open(achievement, button, true),
    [open],
  );
  const closeZoom = useCallback(() => setZoom(null), []);

  // Every Claim button claims through the existing flow, then reveals the
  // card from that button; once claimed, it reopens today's card.
  const onClaim = useClaimReveal({ claimState, reveal: revealClaim });

  // A claim made just now refreshes the page's entitlements a moment later.
  // Until they arrive, the free count shown must include this claim.
  const entitlementsBeforeClaim = useRef<UserEntitlements | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (claimed && !restored && entitlementsBeforeClaim.current === undefined) {
      entitlementsBeforeClaim.current = initialEntitlements;
    }
  }, [claimed, restored, initialEntitlements]);

  // The "How it works" share preview uses the first card on the wall.
  const sample = catalog[0];

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups = gsap.utils
          .toArray<HTMLElement>("[data-story-reveal]", rootRef.current)
          .map((section) => {
            // Opacity only: autoAlpha would also hide the content from
            // keyboard focus until it's scrolled to, so Tab skipped it.
            const reveal = gsap.from(section.children, {
              y: 32,
              opacity: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 85%", once: true },
            });
            // Tabbing into a section shows it at once, so focus never lands
            // on something still invisible.
            const showNow = () => reveal.progress(1);

            section.addEventListener("focusin", showNow);

            return () => section.removeEventListener("focusin", showNow);
          });

        return () => cleanups.forEach((cleanup) => cleanup());
      });

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={styles.home}>
      {zoom && (
        <CardZoom
          key={zoom.key}
          target={zoom}
          locked={isLockedWhenZoomed(lockState, zoom.achievement.id)}
          actions={
            <ZoomShare
              achievement={zoom.achievement}
              source={zoom.fromClaim ? "claim" : "wall"}
            />
          }
          heading={zoom.fromClaim ? CLAIM_HEADING : undefined}
          footnote={
            zoom.fromClaim
              ? freeClaimLine({
                  signedIn: visitor.signedIn,
                  entitlements: initialEntitlements,
                  includesThisClaim:
                    restored ||
                    initialEntitlements !== entitlementsBeforeClaim.current,
                })
              : undefined
          }
          onClosed={closeZoom}
        />
      )}

      {/* Above the wall but transparent to the pointer, so wall cards
          anywhere outside the panels and buttons can be clicked. The navbar
          (its <header>) takes the pointer back. */}
      <div className="pointer-events-none relative z-10 [&>header]:pointer-events-auto">
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
            claimState={claimState}
            mustSignIn={visitor.mustSignIn}
            onClaim={onClaim}
          />
        </div>
      </div>

      {/* Last in reading order, so screen readers reach the page before
          the wall's many repeating cards. It still sits behind everything:
          it's fixed at z-index 0. */}
      <CardWall
        catalog={catalog}
        isLocked={isLockedOnWallCard}
        onOpen={openCard}
        paused={zoom !== null}
      />
    </div>
  );
}
