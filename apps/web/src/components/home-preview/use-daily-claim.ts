"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { claimDailyAchievementAction } from "@/app/actions/achievement-actions";
import { trackEvent } from "@/lib/analytics";
import type { Achievement } from "@/lib/supabase";

export const CLAIM_STORAGE_KEY = "ua:daily-claim";

interface StoredClaim {
  day: string;
  achievement: Achievement;
}

// The visitor's own calendar day, since claims are daily in their timezone.
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

/** Today's claimed achievement from an earlier visit, if any. */
export function readStoredClaim(): Achievement | null {
  try {
    const raw = window.localStorage.getItem(CLAIM_STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as StoredClaim) : null;

    return stored?.day === today() && stored.achievement?.id
      ? stored.achievement
      : null;
  } catch {
    return null;
  }
}

function storeClaim(achievement: Achievement) {
  try {
    const stored: StoredClaim = { day: today(), achievement };

    window.localStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private windows can refuse storage. The claim itself still worked.
  }
}

interface DailyClaimOptions {
  /** True when the visitor is signed in. */
  signedIn?: boolean;
  /**
   * What the server says this visitor claimed today, from anywhere (the
   * dashboard, another device, the old unlock pop-up). Null if nothing.
   */
  todaysClaim?: Achievement | null;
}

// Mirrors the claim handling in app/home/home-client.tsx, but reveals the
// achievement in place instead of opening the unlock pop-up, and remembers
// it for the rest of the day.
export function useDailyClaim({
  signedIn = false,
  todaysClaim = null,
}: DailyClaimOptions = {}) {
  const router = useRouter();
  const claimingRef = useRef(false);
  const [claimed, setClaimed] = useState<Achievement | null>(null);
  /** True when `claimed` came from an earlier visit rather than a new claim. */
  const [restored, setRestored] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Decided once, on arrival. For a signed-in visitor the server knows best,
  // and a claim saved in this browser (an earlier anonymous claim, or
  // another account) doesn't count. Anonymous visitors use the browser's
  // copy first, then the server's, which also catches claims made outside
  // the hero; that one is saved so the two agree from then on.
  const initial = useRef({ signedIn, todaysClaim });

  useEffect(() => {
    const server = initial.current;
    let known: Achievement | null;
    let source = "server";

    if (server.signedIn) {
      known = server.todaysClaim;
    } else {
      known = readStoredClaim();
      source = "browser";

      if (!known && server.todaysClaim) {
        known = server.todaysClaim;
        source = "server";
        storeClaim(known);
      }
    }

    if (known) {
      setClaimed(known);
      setRestored(true);
      // How often visitors come back to a claim, and where we found it.
      trackEvent("daily_claim_restored", {
        source,
        signed_in: server.signedIn,
      });
    }
    setCheckedStorage(true);
  }, []);

  const claim = async () => {
    if (claimingRef.current) return;

    claimingRef.current = true;
    setIsClaiming(true);
    trackEvent("daily_claim_tap", { signed_in: signedIn });

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await claimDailyAchievementAction(timezone);

      trackEvent("daily_claim_result", {
        status: result.status,
        signed_in: signedIn,
        ...(result.status === "claimed"
          ? { rarity: result.achievement.type }
          : {}),
      });

      if (result.status === "already_claimed") {
        toast.info("You've already claimed today's achievement.");
        return;
      }

      if (result.status === "subscription_required") {
        router.push("/pro");
        return;
      }

      if (result.status === "unavailable") {
        toast.error("Today's achievement is unavailable right now.");
        return;
      }

      storeClaim(result.achievement);
      setRestored(false);
      setClaimed(result.achievement);
      router.refresh();
    } catch (error) {
      console.error("Error claiming daily achievement:", error);
      trackEvent("daily_claim_result", {
        status: "error",
        signed_in: signedIn,
      });
      toast.error("Something went wrong.");
    } finally {
      claimingRef.current = false;
      setIsClaiming(false);
    }
  };

  return { claimed, restored, checkedStorage, isClaiming, claim };
}
