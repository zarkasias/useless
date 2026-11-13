"use client";

import { memo } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

import { typeNames } from "@/components/achievement-styles";
import { fredoka, nunito } from "@/components/utils/title-fonts";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";
import type { Achievement, AchievementType } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import styles from "./card-wall.module.css";

const RARITY_CLASS: Partial<Record<AchievementType, string>> = {
  COMMON: styles.common,
  RARE: styles.rare,
  EPIC: styles.epic,
  LEGENDARY: styles.legendary,
};

export function rarityClass(type: AchievementType): string {
  return RARITY_CLASS[type] ?? styles.common;
}

export interface CardFaceProps {
  achievement: Achievement;
  locked: boolean;
  /** Icon size in CSS pixels; the image service picks a matching file. */
  iconSize: number;
  /** Ids for the title and description, so a dialog can point at them. */
  titleId?: string;
  descriptionId?: string;
}

/** What's on a card, shared by the wall card and the zoomed card. */
export function CardFace({
  achievement,
  locked,
  iconSize,
  titleId,
  descriptionId,
}: CardFaceProps) {
  const iconUrl = getAchievementIconUrl(achievement.icon_path);

  return (
    <>
      {iconUrl ? (
        <Image
          className={styles.icon}
          src={iconUrl}
          alt=""
          width={iconSize}
          height={iconSize}
          sizes={`${iconSize}px`}
          draggable={false}
        />
      ) : (
        <span className={styles.icon} aria-hidden="true" />
      )}
      {locked && (
        <span className={styles.lockBadge} aria-hidden="true">
          <Lock className="size-1/2" strokeWidth={2.25} />
        </span>
      )}
      <span className={cn(styles.pill, fredoka.className)}>
        {typeNames[achievement.type]}
      </span>
      <span id={titleId} className={cn(styles.title, fredoka.className)}>
        {achievement.title}
      </span>
      <span
        id={descriptionId}
        className={cn(styles.description, nunito.className)}
      >
        {achievement.description}
      </span>
    </>
  );
}

export interface WallCardProps {
  achievement: Achievement;
  locked: boolean;
  /** Odd columns drop half a cell. */
  odd: boolean;
  onOpen?: (achievement: Achievement, card: HTMLButtonElement) => void;
}

/**
 * One card on the wall. A real button with a label, but kept out of the tab
 * order so keyboard users aren't walked through every repeat.
 */
function WallCardComponent({ achievement, locked, odd, onOpen }: WallCardProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`Open ${achievement.title}${locked ? " (locked)" : ""}`}
      data-wall-card={achievement.id}
      className={cn(
        styles.card,
        rarityClass(achievement.type),
        locked && styles.locked,
        odd && styles.odd,
      )}
      onClick={(event) => onOpen?.(achievement, event.currentTarget)}
    >
      <CardFace achievement={achievement} locked={locked} iconSize={96} />
    </button>
  );
}

export const WallCard = memo(WallCardComponent);
