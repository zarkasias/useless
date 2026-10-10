"use client";

import { useState, type PointerEvent } from "react";

import { CanvasAtmosphere } from "./canvas-atmosphere";
import { HeroAchievementCard } from "./hero-achievement-card";
import type { ShowcaseAchievement } from "./home-data";

import styles from "./home-styles";

interface HeroAchievementSceneProps {
  achievements: ShowcaseAchievement[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function HeroAchievementScene({
  achievements,
  selectedIndex,
  onSelect,
}: HeroAchievementSceneProps) {
  const [pulse, setPulse] = useState(0);
  const achievement = achievements[selectedIndex] ?? achievements[0];

  const select = (index: number) => {
    onSelect(index);
    setPulse((current) => current + 1);
  };

  const tilt = (event: PointerEvent<HTMLButtonElement>) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    event.currentTarget.style.setProperty("--tilt-x", `${-y * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 12}deg`);
  };

  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  if (!achievement) return null;

  return (
    <div className={styles.scene}>
      <CanvasAtmosphere pulse={pulse} />

      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.orbitInner} aria-hidden="true" />

      <span className={`${styles.sceneNote} ${styles.noteLeft}`}>
        100% unnecessary.
      </span>
      <span className={`${styles.sceneNote} ${styles.noteRight}`}>
        Somehow, still satisfying.
      </span>

      <button
        type="button"
        className={styles.heroObject}
        onPointerMove={tilt}
        onPointerLeave={resetTilt}
        onClick={() => select((selectedIndex + 1) % achievements.length)}
        aria-label={`Preview: ${achievement.title}. Show the next achievement.`}
      >
        <div key={achievement.id} className={styles.objectReveal}>
          <HeroAchievementCard achievement={achievement} variant={"enlarged"} />
        </div>

        <span
          className="
      pointer-events-none
      absolute
      -bottom-16
       -right-4 md:-right-12
      z-20
      flex
      size-24
      rotate-6
      items-center
      justify-center
      rounded-full
      bg-gradient-to-br
      from-yellow-300
      via-orange-400
      to-orange-600
      px-5
      text-center
      text-[10px]
      font-black
      uppercase
      leading-tight
      tracking-wide
      text-white
      shadow-2xl
      ring-4
      ring-white/50
    "
        >
          Click for another achievement
        </span>
      </button>

      <div className={styles.sceneControls}>
        <div className={styles.dots} aria-label="Choose an achievement">
          {achievements.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={styles.dot}
              aria-label={`Preview ${item.title}`}
              aria-pressed={selectedIndex === index}
              onClick={() => select(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
