"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import { cn } from "@/lib/utils";

/** The design's primary button, shared by every Claim button on the page. */
export const claimButtonClass =
  "pointer-events-auto inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full border-0 bg-[linear-gradient(100deg,#6d28d9,#2563eb)] px-[30px] text-[17px] font-extrabold max-[720px]:gap-2 max-[720px]:px-5 max-[720px]:text-[15px] text-white no-underline shadow-[0_12px_30px_rgba(109,40,217,0.30)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-white disabled:translate-y-0 disabled:opacity-70 motion-reduce:transition-none";

export interface ClaimButtonProps {
  claimState: ReturnType<typeof useDailyClaim>;
  /** This browser can only claim after signing in. */
  mustSignIn?: boolean;
  /** Claim, or reopen today's card when it's already claimed. */
  onClaim: (button: HTMLButtonElement) => void;
  label?: string;
}

/**
 * The Claim button. It only calls the existing claim flow; the rules (one a
 * day, the free limit, sign-in for linked browsers) all stay in that flow.
 */
export function ClaimButton({
  claimState,
  mustSignIn = false,
  onClaim,
  label = "Claim my useless achievement",
}: ClaimButtonProps) {
  const { claimed, isClaiming } = claimState;

  if (mustSignIn && !claimed) {
    return (
      <Link className={claimButtonClass} href="/login?next=%2F">
        Sign in to claim today&apos;s achievement
        <ArrowUpRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={claimButtonClass}
      onClick={(event) => onClaim(event.currentTarget)}
      disabled={isClaiming}
      aria-busy={isClaiming}
    >
      {isClaiming
        ? "Claiming…"
        : claimed
          ? "Open today's achievement"
          : label}
      <ArrowUpRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

/**
 * A white panel over the wall. The page column ignores the pointer so wall
 * cards in the gaps stay clickable; panels take it back.
 */
export const panelClass =
  "pointer-events-auto box-border w-full max-w-[1040px] rounded-[32px] border border-[#e4e0f7] bg-white p-14 shadow-[0_24px_60px_rgba(76,29,149,0.10)] max-[720px]:rounded-[26px] max-[720px]:px-[22px] max-[720px]:py-8";

/** A soft light glow, so text stays readable over the wall. */
export const glowClass =
  "bg-[radial-gradient(closest-side,rgba(246,244,255,0.98)_58%,rgba(246,244,255,0)_100%)] max-[720px]:bg-[radial-gradient(ellipse_at_center,rgba(246,244,255,0.97)_55%,rgba(246,244,255,0)_78%)]";

export interface WallHeroProps extends ClaimButtonProps {
  signedIn: boolean;
}

/** The homepage hero: centred text only, over the wall. */
export function WallHero({ signedIn, ...claim }: WallHeroProps) {
  return (
    <section
      id="top"
      className={cn(
        glowClass,
        "box-border flex min-h-[min(780px,calc(100svh-4rem))] w-full max-w-[980px] scroll-mt-20 flex-col items-center justify-center gap-[26px] px-6 pt-16 pb-24 text-center max-[720px]:gap-5 max-[720px]:pt-10",
      )}
    >
      <p className="m-0 text-[13px] font-extrabold tracking-[0.16em] text-[#5b21b6] uppercase max-[720px]:text-xs max-[720px]:tracking-[0.1em]">
        Achievements nobody asked for.
      </p>
      <h1 className="m-0 text-[clamp(44px,7.4vw,92px)] leading-[0.95] font-black tracking-[-0.05em] text-gray-800">
        Accomplish absolutely{" "}
        <span className="bg-[linear-gradient(100deg,#7c3aed,#2563eb)] bg-clip-text pb-[0.08em] text-transparent">
          nothing useful.
        </span>
      </h1>
      <p className="m-0 max-w-[520px] text-[19px] leading-normal text-gray-600 max-[720px]:text-[17px]">
        Tap the button. Get a pointless achievement. Feel weirdly proud.
      </p>
      <ClaimButton {...claim} />
      <p className="m-0 max-w-[420px] text-[15px] leading-normal text-gray-600">
        {signedIn ? "" : "No account needed. "}One new achievement a day. Your
        first 10 are free; Pro keeps them coming.
      </p>
      <p className="m-0 mt-3.5 text-[13px] font-bold text-[#5b5578]">
        Move around the wall. Tap any card to open it.
      </p>
    </section>
  );
}
