"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Download, LoaderCircle, Share2 } from "lucide-react";

import styles from "@/components/home/home-styles";
import { useAchievementShare } from "@/components/use-achievement-share";
import type { Achievement } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CardFeed } from "./card-feed";
import { toShareInput } from "./use-card-face";

const EMPTY_INPUT = toShareInput({
  id: "",
  title: "",
  description: "",
  type: "COMMON",
  emoji: "",
  created_at: "",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
  status: "published",
});

interface PreviewHeroProps {
  claimed: Achievement | null;
  /** True when `claimed` was saved on an earlier visit today. */
  restored: boolean;
  /** False until the saved claim, if any, has been read. */
  ready: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  isLoggedIn: boolean;
}

export function PreviewHero({
  claimed,
  restored,
  ready,
  isClaiming,
  onClaim,
  isLoggedIn,
}: PreviewHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const revealed = claimed;

  const shareInput = useMemo(
    () => (claimed ? toShareInput(claimed) : EMPTY_INPUT),
    [claimed],
  );
  const { share, canShareFiles, isBusy, canTapShare } = useAchievementShare({
    input: shareInput,
    enabled: claimed !== null,
    waitForVisible: false,
    targetRef: heroRef,
  });

  // On phones the card sits below the button, so bring the reveal into view.
  useEffect(() => {
    if (!claimed || restored) return;

    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();

    if (!stage || !rect || rect.bottom <= window.innerHeight) return;

    stage.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [claimed, restored]);

  const ShareIcon = canShareFiles ? Share2 : Download;

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative overflow-clip bg-[radial-gradient(ellipse_at_70%_40%,#ddd6fe_0%,transparent_55%),linear-gradient(180deg,#f5f3ff_0%,#eff6ff_60%,#ffffff_100%)] px-5 pt-10 pb-16 md:px-8 md:pt-16 md:pb-24"
    >
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <div className="relative z-10 text-center md:text-left" data-hero-enter>
          <p className={cn(styles.eyebrow, "mb-4 text-emerald-700")}>
            Achievements nobody asked for.
          </p>

          <h1 className="m-0 text-[clamp(40px,10.5vw,84px)] font-black leading-[0.95] tracking-[-0.07em] text-gray-800 md:text-[clamp(52px,6.2vw,84px)]">
            Accomplish absolutely{" "}
            <span className="inline-block -rotate-2 bg-[linear-gradient(100deg,#7c3aed_10%,#3b82f6_55%,#0891b2_100%)] bg-clip-text pb-[0.12em] text-transparent">
              nothing useful.
            </span>
          </h1>

          <p
            className="mx-auto mt-5 mb-7 max-w-[440px] text-base leading-relaxed text-slate-600 md:mx-0 md:text-lg"
            aria-live="polite"
          >
            {revealed ? (
              <>
                You unlocked{" "}
                <strong className="text-gray-800">{revealed.title}</strong>. Now
                tell everyone.
              </>
            ) : (
              "Tap the button. Get a pointless achievement. Feel weirdly proud."
            )}
          </p>

          <div className="flex flex-col items-center gap-3 md:items-start">
            {claimed ? (
              <button
                type="button"
                className={cn(styles.primaryButton, "min-w-[240px]")}
                onClick={share}
                disabled={!canTapShare}
                aria-busy={isBusy}
              >
                {isBusy ? (
                  <LoaderCircle
                    className="size-5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <ShareIcon className="size-5" aria-hidden="true" />
                )}
                {canShareFiles ? "Share it" : "Download it"}
              </button>
            ) : (
              <button
                type="button"
                className={cn(styles.primaryButton, "min-w-[240px]")}
                onClick={onClaim}
                disabled={isClaiming}
                aria-busy={isClaiming}
              >
                {isClaiming ? "Claiming…" : "Claim my useless achievement"}
                <span aria-hidden="true">↗</span>
              </button>
            )}

            {claimed ? (
              <Link
                className={styles.textLink}
                href={isLoggedIn ? "/collection" : "/signup?next=/collection"}
              >
                {isLoggedIn
                  ? "See my collection ↗"
                  : "Create a free account to keep it ↗"}
              </Link>
            ) : (
              !isLoggedIn && (
                <p className="m-0 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                  <span aria-hidden="true">✓</span> No account needed
                </p>
              )
            )}
          </div>
        </div>

        {/* On desktop the feed reaches left, underneath the headline. */}
        <div
          ref={stageRef}
          className="-mx-5 h-[380px] md:mx-0 md:-ml-[70%] md:h-[480px]"
          data-hero-enter
        >
          <CardFeed
            revealed={revealed}
            restored={restored}
            ready={ready}
            label={
              revealed
                ? `Your achievement: ${revealed.title}`
                : "Achievement cards drifting past until you claim one"
            }
            className="size-full"
          />
        </div>
      </div>
    </section>
  );
}
