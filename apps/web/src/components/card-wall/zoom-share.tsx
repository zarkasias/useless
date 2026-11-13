"use client";

import { useMemo, useRef } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";

import { toShareInput } from "@/components/home-preview/use-card-face";
import { useAchievementShare } from "@/components/use-achievement-share";
import { trackEvent } from "@/lib/analytics";
import type { Achievement } from "@/lib/supabase";
import { claimButtonClass } from "./wall-hero";

/**
 * Share for an unlocked, zoomed card. It only calls the existing native
 * share (or its download fallback); the image is prepared as soon as the
 * card opens, so the tap can open the share sheet straight away.
 */
export function ZoomShare({
  achievement,
  source,
}: {
  achievement: Achievement;
  /** Where the card was opened from, for analytics. */
  source: "wall" | "claim";
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const input = useMemo(() => toShareInput(achievement), [achievement]);
  const { share, canShareFiles, isBusy, canTapShare } = useAchievementShare({
    input,
    enabled: true,
    waitForVisible: false,
    targetRef: anchor,
  });
  const Icon = canShareFiles ? Share2 : Download;

  // Tracking stays synchronous, so the tap still opens the share sheet.
  const onShare = () => {
    trackEvent("wall_share_tap", {
      method: canShareFiles ? "share" : "download",
      rarity: achievement.type,
      source,
    });
    share();
  };

  return (
    <div ref={anchor} className="flex flex-wrap justify-center gap-3">
      <button
        type="button"
        className={claimButtonClass}
        onClick={onShare}
        disabled={!canTapShare}
        aria-busy={isBusy}
      >
        {isBusy ? (
          <LoaderCircle className="size-[18px] animate-spin" aria-hidden />
        ) : (
          <Icon className="size-[18px]" strokeWidth={2.5} aria-hidden />
        )}
        {canShareFiles ? "Share" : "Download"}
      </button>
    </div>
  );
}
