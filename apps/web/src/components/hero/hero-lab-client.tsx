"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Download, LoaderCircle, Share2 } from "lucide-react";

import styles from "@/components/home/home-styles";
import { toShareInput } from "@/components/home-preview/use-card-face";
import { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import { useAchievementShare } from "@/components/use-achievement-share";
import type { ShareImageInput } from "@/lib/share-image";
import type { Achievement } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { createHeroConfig } from "./hero-config";
import { createHeroMotion } from "./hero-motion";
import type { HeroClaim } from "./hero-scene";
import { HeroStaticCard } from "./hero-static-card";
import { SceneBoundary } from "./scene-boundary";
import { useReducedMotion } from "./use-reduced-motion";

// The scene is lazy: the page, headline and Claim button never wait for it.
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
});

// The tuning panel only exists in development builds.
const HeroLeva =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("./hero-leva"), { ssr: false });

const EMPTY_SHARE_INPUT: ShareImageInput = {
  title: "",
  description: "",
  type: "COMMON",
  emoji: "",
  iconUrl: null,
};

interface HeroLabClientProps {
  /** Sample achievements for the focus peek. */
  samples: ShareImageInput[];
  /** True when the visitor is signed in. */
  signedIn?: boolean;
  /** Not signed in, but this browser belongs to an account. */
  linked?: boolean;
  /** What the server says this visitor claimed today, from anywhere. */
  todaysClaim?: Achievement | null;
  /** This browser can only claim after signing in. */
  mustSignIn?: boolean;
}

export function HeroLabClient({
  samples,
  signedIn = false,
  linked = false,
  todaysClaim = null,
  mustSignIn = false,
}: HeroLabClientProps) {
  const config = useRef(createHeroConfig()).current;
  const motion = useRef(createHeroMotion()).current;
  const [cardCount, setCardCount] = useState(config.stream.cardCount);
  // A claim refreshes the page's server data, which reshuffles the samples;
  // keep the first set so the scene doesn't redraw its faces.
  const [samplePool] = useState(samples);
  const { claimed, restored, checkedStorage, isClaiming, claim } =
    useDailyClaim({ signedIn, todaysClaim });
  const [attempt, setAttempt] = useState(0);
  // Reduced motion gets one still card and never loads three.js.
  const reducedMotion = useReducedMotion();

  // The claim as the scene sees it. A finished attempt with nothing claimed
  // (a failure, or already claimed today) puts the stream back.
  const heroClaim = useMemo<HeroClaim>(
    () => ({
      status: claimed
        ? "revealed"
        : isClaiming
          ? "claiming"
          : attempt > 0
            ? "failed"
            : "idle",
      achievement: claimed ? toShareInput(claimed) : null,
      attempt,
      restored,
    }),
    [claimed, isClaiming, attempt, restored],
  );

  // The Share button fades in under the revealed card once the stack lands.
  const shareAnchor = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);
  const shareInput = useMemo(
    () => (claimed ? toShareInput(claimed) : EMPTY_SHARE_INPUT),
    [claimed],
  );
  const { share, canShareFiles, isBusy, canTapShare } = useAchievementShare({
    input: shareInput,
    // Draw the share image once the deck has landed, when the button shows,
    // so it doesn't compete with the lift and flip.
    enabled: claimed !== null && settled,
    waitForVisible: false,
    targetRef: shareAnchor,
  });
  const ShareIcon = canShareFiles ? Share2 : Download;

  const showShare = settled && claimed !== null;
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Tracking stays synchronous, so the tap still opens the share sheet.
  const onShare = () => {
    trackEvent("hero_share_tap", {
      method: canShareFiles ? "share" : "download",
      rarity: shareInput.type,
      restored,
    });
    share();
  };

  // On short phones the text, card and Share don't all fit on one screen.
  // Once a fresh claim lands, scroll just enough to bring Share into view.
  // Not for returning visitors: scrolling as a page opens would be jarring.
  useEffect(() => {
    if (!showShare || restored) return;

    const frame = requestAnimationFrame(() => {
      const button = shareButtonRef.current;

      if (!button) return;

      const overflow =
        button.getBoundingClientRect().bottom - window.innerHeight + 24;

      if (overflow > 0) {
        window.scrollBy({
          top: overflow,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [showShare, restored, reducedMotion]);

  const shareButton = (
    <button
      ref={shareButtonRef}
      type="button"
      className={cn(
        styles.primaryButton,
        // Smaller than the Claim button: a follow-up action under the card.
        "min-h-10 gap-2 px-5 py-2 text-[13px] transition-[opacity,translate] duration-500 motion-reduce:translate-y-0",
        showShare
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
      onClick={onShare}
      disabled={!canTapShare}
      aria-busy={isBusy}
      aria-hidden={!showShare}
      tabIndex={showShare ? 0 : -1}
    >
      {isBusy ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <ShareIcon className="size-4" aria-hidden="true" />
      )}
      {canShareFiles ? "Share it" : "Download it"}
    </button>
  );

  // Reduced motion, or the fallback if the 3D scene can't start.
  const staticCard = (
    <HeroStaticCard
      achievement={heroClaim.achievement}
      restored={restored}
      onSettled={() => setSettled(true)}
    >
      {shareButton}
    </HeroStaticCard>
  );

  const onClaim = () => {
    setAttempt((count) => count + 1);
    void claim();
  };

  // Lets browser tests and the console inspect the live motion values.
  useEffect(() => {
    (window as unknown as { heroLab?: object }).heroLab = { config, motion };
  }, [config, motion]);

  return (
    <>
      <HeroLeva config={config} onCardCountChange={setCardCount} />

      <section className="relative isolate overflow-clip bg-[radial-gradient(ellipse_at_70%_40%,#ddd6fe_0%,transparent_55%),linear-gradient(180deg,#f5f3ff_0%,#eff6ff_60%,#ffffff_100%)] px-5 pt-10 pb-10 md:min-h-[680px] md:px-8 md:pt-16 md:pb-24">
        {/* Clicks pass through the empty part of this layer to the cards; only
            the text and buttons catch the pointer. */}
        <div className="pointer-events-none relative z-10 mx-auto max-w-[1120px] [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_h1]:pointer-events-auto [&_p]:pointer-events-auto">
          <div className="text-center md:max-w-[560px] md:text-left">
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
              {claimed ? (
                <>
                  You unlocked{" "}
                  <strong className="text-gray-800">{claimed.title}</strong>.
                  Now tell everyone.
                </>
              ) : (
                "Tap the button. Get a pointless achievement. Feel weirdly proud."
              )}
            </p>

            <div className="flex flex-col items-center gap-3 md:items-start">
              {claimed ? (
                // After a claim, Share (under the card) is the one primary
                // action; this is the quieter next step. Visitors with an
                // account already keep it, so they get their collection.
                <Link
                  className={styles.textLink}
                  href={
                    signedIn
                      ? "/collection"
                      : linked
                        ? "/login?next=/collection"
                        : "/signup?next=/collection"
                  }
                >
                  {signedIn
                    ? "See it in your collection ↗"
                    : linked
                      ? "Sign in to see it in your collection ↗"
                      : "Create a free account to keep it ↗"}
                </Link>
              ) : mustSignIn ? (
                // This browser belongs to an account, and the server only
                // lets it claim once signed in. A Claim button here could
                // only say "already claimed".
                <Link
                  className={cn(styles.primaryButton, "min-w-[240px]")}
                  href="/login?next=/hero-lab"
                  onClick={() => trackEvent("hero_sign_in_to_claim_tap")}
                >
                  Sign in to claim today&apos;s achievement
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <>
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
                  <p className="m-0 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                    <span aria-hidden="true">✓</span> No account needed
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The right-hand column on desktop, clear of the headline; its own
            stage below the Claim button on phones. */}
        <div className="relative -mx-5 mt-4 h-[380px] md:absolute md:inset-y-0 md:right-0 md:left-[48%] md:m-0 md:h-auto">
          {/* Wait until we know about a saved claim, so the stream never
              flashes before a returning visitor's deck. */}
          {checkedStorage &&
            (reducedMotion ? (
              staticCard
            ) : (
              <SceneBoundary fallback={staticCard}>
                <HeroScene
                  config={config}
                  motion={motion}
                  cardCount={cardCount}
                  samples={samplePool}
                  claim={heroClaim}
                  shareAnchor={shareAnchor}
                  onSettled={() => setSettled(true)}
                />

                {/* The scene keeps this just under the revealed card. */}
                <div
                  ref={shareAnchor}
                  className="absolute top-0 left-0 z-20 will-change-transform"
                >
                  {shareButton}
                </div>
              </SceneBoundary>
            ))}
        </div>
      </section>
    </>
  );
}
