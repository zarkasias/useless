"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Achievement } from "@/lib/supabase";
import {
  isLockedOnWall,
  isLockedWhenZoomed,
  type CardLockState,
} from "./card-lock";
import { CardWall } from "./card-wall";
import { CardZoom, type ZoomTarget } from "./card-zoom";
import { ZoomShare } from "./zoom-share";

type PreviewAs = "visitor" | "collector";

/**
 * /wall-lab: the wall on its own, with a switch between a logged-out visitor
 * and a pretend signed-in collector (every third card unlocked). Preview
 * data only; nothing here touches real unlocks.
 */
export function WallLabClient({ catalog }: { catalog: Achievement[] }) {
  const [previewAs, setPreviewAs] = useState<PreviewAs>("visitor");

  // ?as=collector opens straight on the signed-in preview.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("as") === "collector") {
      setPreviewAs("collector");
    }
  }, []);

  const lockState = useMemo<CardLockState>(
    () => ({
      signedIn: previewAs === "collector",
      unlockedIds: new Set(
        previewAs === "collector"
          ? catalog.filter((_, index) => index % 3 === 0).map((a) => a.id)
          : [],
      ),
      claimedId: null,
    }),
    [catalog, previewAs],
  );

  const isLocked = useCallback(
    (achievement: Achievement) => isLockedOnWall(lockState, achievement.id),
    [lockState],
  );

  const [zoom, setZoom] = useState<(ZoomTarget & { key: number }) | null>(null);
  const openCard = useCallback(
    (achievement: Achievement, source: HTMLElement) =>
      setZoom((current) =>
        current
          ? current
          : { achievement, source, hideSource: true, key: Date.now() },
      ),
    [],
  );

  return (
    <>
      <CardWall
        catalog={catalog}
        isLocked={isLocked}
        onOpen={openCard}
        paused={zoom !== null}
      />
      {zoom && (
        <CardZoom
          key={zoom.key}
          target={zoom}
          locked={isLockedWhenZoomed(lockState, zoom.achievement.id)}
          actions={<ZoomShare achievement={zoom.achievement} source="wall" />}
          onClosed={() => setZoom(null)}
        />
      )}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-white/95 p-1.5 text-sm font-bold shadow-lg">
        <span className="px-2 text-gray-500">{catalog.length} cards ·</span>
        {(["visitor", "collector"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPreviewAs(option)}
            className={`rounded-full px-3 py-1.5 ${
              previewAs === option
                ? "bg-violet-600 text-white"
                : "text-gray-700"
            }`}
          >
            {option === "visitor" ? "Logged out" : "Signed-in collector"}
          </button>
        ))}
      </div>
    </>
  );
}
