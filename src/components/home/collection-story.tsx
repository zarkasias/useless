"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { HeroAchievementCard } from "./hero-achievement-card";
import { useIsDesktop } from "../utils/isDesktop";
import { SharingIllustration } from "./sharing-illustration";
import type { ShowcaseAchievement } from "./home-data";
import styles from "./home.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CollectionStoryProps {
  achievements: ShowcaseAchievement[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isLoggedIn: boolean;
}

export function CollectionStory({
  achievements,
  selectedIndex,
  onSelect,
  isLoggedIn,
}: CollectionStoryProps) {
  const isDesktop = useIsDesktop();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const cards = gsap.utils.toArray<HTMLElement>(
            "[data-collection-card]",
            sectionRef.current,
          );

          if (cards.length < 2) return;

          const center = (cards.length - 1) / 2;

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: stageRef.current,
              start: "top 20%",
              end: "+=600",
              pin: stageRef.current,
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          });

          cards.forEach((card, index) => {
            timeline.fromTo(
              card,
              {
                xPercent: -50,
                x: (index - center) * 28,
                y: index * 5,
                rotation: (index - center) * 5,
              },
              {
                xPercent: -50,
                x: () =>
                  (index - center) *
                  Math.min(
                    320,
                    Math.max(
                      0,
                      (sectionRef.current?.clientWidth ?? 1024) - 400,
                    ) / Math.max(1, cards.length - 1),
                  ),
                y: index % 2 === 0 ? 0 : 24,
                rotation: (index - center) * 8,
                ease: "none",
                duration: 1,
              },
              0,
            );
          });
        },
      );

      return () => media.revert();
    },
    {
      scope: sectionRef,
      dependencies: [achievements],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="collection"
      className={`${styles.section} ${styles.collectionSection}`}
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>01 / Collect &amp; share</p>
        <h2 className="text-gray-700">
          Collect ridiculous things.
          <br />
          Share your finest moments.
        </h2>
        <p>
          From Common to Legendary, every achievement adds another ridiculous
          chapter to your collection. Then take your pointless glory beyond the
          site.
        </p>
      </div>

      <div ref={stageRef} className={styles.collectionStage}>
        {achievements.map((achievement, index) => (
          <button
            key={achievement.id}
            type="button"
            data-collection-card
            className={styles.collectionCard}
            style={
              {
                "--position": index,
                "--count": achievements.length,
              } as CSSProperties
            }
            aria-label={`Preview ${achievement.title}`}
            aria-pressed={selectedIndex === index}
            onClick={() => onSelect(index)}
          >
            <HeroAchievementCard
              achievement={achievement}
              variant={isDesktop ? "enlarged" : "compact"}
            />
          </button>
        ))}
      </div>

      <p className={styles.collectionHint}>
        Common through Legendary. Every card is another reason to brag.
      </p>
      <SharingIllustration
        achievement={achievements[0]}
        isLoggedIn={isLoggedIn}
      />
    </section>
  );
}
