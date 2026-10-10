"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";

import { HeroAchievementScene } from "./hero-achievement-scene";
import type { ShowcaseAchievement } from "./home-data";
import styles from "./home-styles";

gsap.registerPlugin(useGSAP);

interface HeroSectionProps {
  achievements: ShowcaseAchievement[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isClaiming: boolean;
  onClaim: () => void;
  isLoggedIn: boolean;
  isSubscribed?: boolean;
}

export function HeroSection({
  achievements,
  selectedIndex,
  onSelect,
  isClaiming,
  onClaim,
  isLoggedIn,
  isSubscribed = false,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-enter]", {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        });
      });

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={styles.hero}>
      <p className={cn(styles.eyebrow, "text-emerald-700")} data-hero-enter>
        Achievements nobody asked for.
      </p>

      <h1 className={cn(styles.heroTitle, "text-grey-800")} data-hero-enter>
        Accomplish absolutely
        <br />
        <span className="inline-block -rotate-2">nothing useful.</span>
      </h1>

      <p className={styles.heroDescription} data-hero-enter>
        Collect ridiculous achievements. Play with them. Show them off. Build a
        collection of moments that deserve far too much credit.
      </p>

      <div className={styles.actions} data-hero-enter>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onClaim}
          disabled={isClaiming}
          aria-busy={isClaiming}
        >
          {isClaiming ? "Claiming…" : "Claim my useless achievement"}
          <span aria-hidden="true">↗</span>
        </button>

        <a className={styles.textLink} href="#collection">
          Explore the collection ↓
        </a>
      </div>

      <p className={styles.finePrint}>
        {isLoggedIn
          ? "Your first ten daily achievements are free."
          : "Try without an account. Create one to keep your collection."}
      </p>

      <HeroAchievementScene
        achievements={achievements}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />

      <div className={styles.heroFooter}>
        <span>Collect the completely unnecessary.</span>
        <Link
          href={
            !isLoggedIn
              ? "/login?next=/games"
              : isSubscribed
                ? "/games"
                : "/pro"
          }
        >
          {!isLoggedIn
            ? "Sign in to explore games ↗"
            : isSubscribed
              ? "Explore achievement games ↗"
              : "Unlock games with Pro ↗"}
        </Link>
      </div>
    </section>
  );
}
