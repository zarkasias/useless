"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { Navbar } from "@/components/navbar";
import styles from "@/components/home/home-styles";
import { getShowcaseAchievements } from "@/components/home/home-data";
import { FinalCta } from "@/components/home-preview/final-cta";
import { GamesStrip } from "@/components/home-preview/games-strip";
import { GoFurther } from "@/components/home-preview/go-further";
import { HowItWorks } from "@/components/home-preview/how-it-works";
import { PreviewHero } from "@/components/home-preview/preview-hero";
import {
  pickLadder,
  RarityLadder,
} from "@/components/home-preview/rarity-ladder";
import { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import type { Achievement, UserProfile } from "@/lib/supabase";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HomePreviewClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
  initialPacks: StoreAchievementPack[];
  featuredAchievements?: Achievement[];
}

export default function HomePreviewClient({
  initialProfile,
  initialEntitlements,
  initialPacks,
  featuredAchievements,
}: HomePreviewClientProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { claimed, restored, checkedStorage, isClaiming, claim } =
    useDailyClaim();
  const isLoggedIn = initialProfile !== null;
  const isSubscribed = initialEntitlements?.isSubscribed ?? false;

  const showcase = useMemo(
    () => getShowcaseAchievements(featuredAchievements, 0, 12),
    [featuredAchievements],
  );
  const sample = showcase[0];
  const ladder = useMemo(
    () => pickLadder(showcase, sample),
    [showcase, sample],
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-enter]", {
          y: 28,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });

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
      <Navbar
        user={initialProfile}
        isSubscribed={isSubscribed}
        subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
      />

      <PreviewHero
        claimed={claimed}
        restored={restored}
        ready={checkedStorage}
        isClaiming={isClaiming}
        onClaim={claim}
        isLoggedIn={isLoggedIn}
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
        onClaim={claim}
      />
    </div>
  );
}
