"use client";

import { useEffect, useState } from "react";
import { AchievementCard } from "@/components/achievement-card-updated";
import { Button } from "@/components/ui/button";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";
import {
  renderShareImage,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImageInput,
} from "@/lib/share-image";
import type { Achievement } from "@/lib/supabase";

// The .dev.tsx extension keeps this page out of production builds.
// See pageExtensions in next.config.ts.

const ICON_URL = getAchievementIconUrl(
  "/achievement_icons/webp/cookie-quality.webp",
);

const COPY = {
  title: "Successfully Did Nothing",
  description: "You sat perfectly still and achieved absolutely nothing today.",
};

const LONG_COPY = {
  title: "Refreshed the Same Page Forty-Seven Times Before Lunch on a Tuesday",
  description:
    "Nothing changed on any of the forty-seven attempts, and yet you persisted with a level of optimism that medical science is still struggling to explain. Your browser has asked for some time apart, and honestly it has a point about all of this.",
};

const SAMPLES: { label: string; input: ShareImageInput }[] = [
  ...(["COMMON", "EPIC", "LEGENDARY"] as const).flatMap((type) => [
    {
      label: `${type} with icon`,
      input: { ...COPY, type, emoji: "🏆", iconUrl: ICON_URL },
    },
    {
      label: `${type} with emoji`,
      input: { ...COPY, type, emoji: "🛋️", iconUrl: null },
    },
  ]),
  {
    label: "Long text with icon",
    input: { ...LONG_COPY, type: "EPIC", emoji: "🔄", iconUrl: ICON_URL },
  },
  {
    label: "Unbroken long title",
    input: {
      ...COPY,
      title: "Supercalifragilisticexpialidociousnessfulnesslessness",
      type: "COMMON",
      emoji: "🔤",
      iconUrl: null,
    },
  },
  {
    label: "Icon fails to load",
    input: {
      ...COPY,
      type: "LEGENDARY",
      emoji: "🏆",
      iconUrl: "/icons/does-not-exist.png",
    },
  },
];

function Sample({ label, input }: { label: string; input: ShareImageInput }) {
  const [image, setImage] = useState<{ url: string; size: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;

    renderShareImage(input)
      .then((blob) => {
        if (cancelled) return;

        url = URL.createObjectURL(blob);
        setImage({ url, size: blob.size });
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(String(reason));
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [input]);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">
        {label}
        {image && (
          <span
            className="block text-xs font-normal text-gray-500"
            data-testid="sample-size"
          >
            {SHARE_IMAGE_WIDTH}×{SHARE_IMAGE_HEIGHT} ·{" "}
            {Math.round(image.size / 1024)} KB ·{" "}
            <a href={image.url} download={`${label}.png`} className="underline">
              download
            </a>
          </span>
        )}
      </figcaption>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={label}
          className="w-full rounded-lg border"
          style={{ aspectRatio: `${SHARE_IMAGE_WIDTH} / ${SHARE_IMAGE_HEIGHT}` }}
        />
      ) : (
        !error && (
          <div
            className="w-full animate-pulse rounded-lg bg-gray-200"
            style={{
              aspectRatio: `${SHARE_IMAGE_WIDTH} / ${SHARE_IMAGE_HEIGHT}`,
            }}
          />
        )
      )}
    </figure>
  );
}

const LIVE_CARD: Achievement = {
  id: "live-share-test",
  title: "Cookie Quality Inspector",
  description:
    "You tested every cookie on the plate, purely for quality control.",
  type: "LEGENDARY",
  emoji: "🍪",
  icon_path: "/achievement_icons/webp/cookie-quality.webp",
  created_at: "2026-11-01T12:00:00.000Z",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
  status: "published",
};

export default function SharePreviewPage() {
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Share image preview</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Try the Share button</h2>
        <p className="text-sm text-gray-500">
          These are the live cards: unlock pop-up on the left, grid on the right.
        </p>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <AchievementCard
            achievement={LIVE_CARD}
            isCollected
            showShareButton
            variant="stacked"
          />
          <AchievementCard
            achievement={LIVE_CARD}
            isCollected
            ingrid
            showShareButton
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["first", "second", "third"].map((id) => (
            <AchievementCard
              key={id}
              achievement={{ ...LIVE_CARD, id }}
              isCollected
              ingrid
              showShareButton
              variant="compact"
            />
          ))}
        </div>
        <Button type="button" onClick={() => setIsUnlockOpen(true)}>
          Open the unlock pop-up
        </Button>
        <UnlockAchievement
          achievement={LIVE_CARD}
          isOpen={isUnlockOpen}
          onClose={() => setIsUnlockOpen(false)}
        />
      </section>

      <h2 className="text-lg font-semibold">All samples</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLES.map((sample) => (
          <Sample key={sample.label} {...sample} />
        ))}
      </div>
    </div>
  );
}
