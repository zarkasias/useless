"use client";

import { useEffect, useState } from "react";

import { getAchievementIconUrl } from "@/lib/achievement-icon-url";
import { renderShareImage, type ShareImageInput } from "@/lib/share-image";
import type { Achievement } from "@/lib/supabase";

export function toShareInput(achievement: Achievement): ShareImageInput {
  return {
    title: achievement.title,
    description: achievement.description,
    type: achievement.type,
    emoji: achievement.emoji,
    iconUrl: getAchievementIconUrl(achievement.icon_path),
  };
}

// Drawing a share image takes a moment, so each is drawn once per visit.
const faces = new Map<string, Promise<string>>();

function getFaceUrl(achievement: Achievement): Promise<string> {
  let face = faces.get(achievement.id);

  if (!face) {
    face = renderShareImage(toShareInput(achievement)).then((blob) =>
      URL.createObjectURL(blob),
    );
    face.catch(() => faces.delete(achievement.id));
    faces.set(achievement.id, face);
  }

  return face;
}

export interface CardFace {
  id: string;
  url: string;
}

/**
 * Returns the latest drawn share image. While a new achievement is drawing,
 * the previous face is kept so a card never goes blank mid-reveal.
 */
export function useCardFace(
  achievement: Achievement | null | undefined,
): CardFace | null {
  const [face, setFace] = useState<CardFace | null>(null);

  useEffect(() => {
    if (!achievement) return;

    let cancelled = false;

    getFaceUrl(achievement)
      .then((url) => {
        if (!cancelled) setFace({ id: achievement.id, url });
      })
      .catch((error: unknown) => {
        console.error("Could not draw achievement card:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [achievement]);

  return face;
}
