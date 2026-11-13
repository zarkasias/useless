"use client";

import { useCallback, useEffect, useRef } from "react";

import type { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { Achievement } from "@/lib/supabase";

export const CLAIM_HEADING = "You unlocked this. Now tell everyone.";

const COME_BACK = "Come back tomorrow for the next one.";

/**
 * The line under a claimed card. Signed-in free users see their real count
 * from the existing entitlements; Pro users have no count; logged-out
 * visitors, whose count the app doesn't track, see the general rule.
 */
export function freeClaimLine({
  signedIn,
  entitlements,
  includesThisClaim,
}: {
  signedIn: boolean;
  entitlements: UserEntitlements | null;
  /** False when the entitlements were read before today's claim. */
  includesThisClaim: boolean;
}): string {
  if (entitlements?.isSubscribed) return COME_BACK;

  if (signedIn && entitlements) {
    const limit = entitlements.freeAchievementLimit;
    const used = Math.min(
      limit,
      limit -
        entitlements.remainingFreeAchievements +
        (includesThisClaim ? 0 : 1),
    );

    return `${used} of ${limit} free. ${COME_BACK}`;
  }

  return `Your first 10 are free. ${COME_BACK}`;
}

/**
 * Claim, then reveal. Pressing a Claim button runs the existing claim flow;
 * when it succeeds, the claimed card zooms from that button. Once today's
 * achievement is claimed, the button reopens it instead of claiming again.
 * No claim rules live here.
 */
export function useClaimReveal({
  claimState,
  reveal,
}: {
  claimState: ReturnType<typeof useDailyClaim>;
  reveal: (achievement: Achievement, button: HTMLElement) => void;
}) {
  const { claimed, isClaiming, claim } = claimState;
  const pendingButton = useRef<HTMLElement | null>(null);

  const onClaim = useCallback(
    (button: HTMLButtonElement) => {
      if (claimed) {
        reveal(claimed, button);
        return;
      }

      pendingButton.current = button;
      void claim();
    },
    [claim, claimed, reveal],
  );

  // When the claim settles: reveal on success; on failure the claim flow
  // has already said why (a toast, or the Pro page), so just forget it.
  useEffect(() => {
    if (isClaiming || !pendingButton.current) return;

    const button = pendingButton.current;

    pendingButton.current = null;

    if (claimed && button.isConnected) reveal(claimed, button);
  }, [claimed, isClaiming, reveal]);

  return onClaim;
}
