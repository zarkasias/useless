"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { renderCardFace, type ShareImageInput } from "@/lib/share-image";
import { cn } from "@/lib/utils";
import {
  CARD_TEXTURE_HEIGHT,
  CARD_TEXTURE_WIDTH,
  renderCardBack,
} from "./card-canvas";

// Long enough to read as a change of card, short enough not to be motion.
const CROSSFADE_MS = 450;

function toImageUrl(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null));
  });
}

/** Draws a canvas once and keeps it as an image URL until unmount. */
function useCanvasImage(draw: (() => Promise<HTMLCanvasElement>) | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!draw) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    let made: string | null = null;

    draw()
      .then(toImageUrl)
      .then((drawn) => {
        made = drawn;
        if (cancelled && drawn) URL.revokeObjectURL(drawn);
        else setUrl(drawn);
      })
      .catch((error: unknown) => {
        console.error("Could not draw the hero card:", error);
      });

    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [draw]);

  return url;
}

interface HeroStaticCardProps {
  /** The claimed achievement, once there is one. */
  achievement: ShareImageInput | null;
  /** Claimed on an earlier visit: show it at once, with no crossfade. */
  restored: boolean;
  /** Called once the claimed card is showing. */
  onSettled?: () => void;
  /** Shown under the card, for the Share button. */
  children?: ReactNode;
}

/**
 * The hero for visitors who ask for reduced motion: one still card back,
 * which crossfades to the claimed achievement. No three.js, no stream.
 */
export function HeroStaticCard({
  achievement,
  restored,
  onSettled,
  children,
}: HeroStaticCardProps) {
  const back = useCanvasImage(renderCardBack);
  const [drawFront, setDrawFront] = useState<
    (() => Promise<HTMLCanvasElement>) | null
  >(null);
  const front = useCanvasImage(drawFront);
  const onSettledNow = useRef(onSettled);

  onSettledNow.current = onSettled;

  useEffect(() => {
    setDrawFront(() =>
      achievement
        ? () =>
            renderCardFace(achievement, CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT)
        : null,
    );
  }, [achievement]);

  // Share appears once the result is showing: at once for a returning
  // visitor, after the crossfade otherwise.
  useEffect(() => {
    if (!front) return;

    const timer = window.setTimeout(
      () => onSettledNow.current?.(),
      restored ? 0 : CROSSFADE_MS,
    );

    return () => window.clearTimeout(timer);
  }, [front, restored]);

  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 py-4">
      <div
        className="relative aspect-[4/5] h-[270px] overflow-hidden rounded-[22px] shadow-[0_24px_60px_-20px_rgba(76,29,149,0.45)] md:h-[min(62%,440px)] md:rounded-[30px]"
        aria-hidden="true"
      >
        {back && (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
          <img src={back} alt="" className="absolute inset-0 size-full" />
        )}
        {front && (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
          <img
            src={front}
            alt=""
            className="absolute inset-0 size-full"
            style={
              restored
                ? undefined
                : {
                    animation: `hero-crossfade ${CROSSFADE_MS}ms ease-out both`,
                  }
            }
          />
        )}
      </div>

      <div className={cn(!achievement && "invisible")}>{children}</div>

      <style>{`@keyframes hero-crossfade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
