"use client";

import { AchievementCard } from "@/components/achievement-card-updated";
import type { ShowcaseAchievement } from "./home-data";
import styles from "./home.module.css";

interface HeroAchievementCardProps {
  achievement: ShowcaseAchievement;
  variant?: "default" | "compact" | "enlarged";
  className?: string;
}

export function HeroAchievementCard({
  achievement,
  variant = "default",
  className = "",
}: HeroAchievementCardProps) {
  return (
    <div className={`${styles.siteCard} ${className}`}>
      <AchievementCard
        key={achievement.id}
        achievement={achievement}
        variant={variant}
        ingrid
        showShareButton={false}
      />
    </div>
  );
}
