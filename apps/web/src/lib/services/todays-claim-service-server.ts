import "server-only";

import { cookies } from "next/headers";

import type { Achievement } from "@/lib/supabase";
import { getAuthenticatedUser, getToday } from "./utils/achievement-utils";
import { supabaseAdmin } from "./utils/trigger-context";

// Same cookie the claim action uses to recognise anonymous visitors.
const ANONYMOUS_COOKIE = "anonymous_user_id";

const ACHIEVEMENT_FIELDS = `
  id,
  title,
  description,
  type,
  emoji,
  icon_path,
  trigger_type,
  trigger_config,
  is_daily,
  is_secret,
  pack_id,
  status
`;

interface ClaimRow {
  created_at: string;
  achievements: unknown;
}

/** Today's achievement from claim rows, preferring the daily one. */
function pickClaim(rows: ClaimRow[] | null): Achievement | null {
  const claims = (rows ?? []).flatMap((row) => {
    const achievement = (
      Array.isArray(row.achievements) ? row.achievements[0] : row.achievements
    ) as Achievement | null | undefined;

    return achievement ? [{ ...achievement, created_at: row.created_at }] : [];
  });

  return claims.find((claim) => claim.is_daily) ?? claims[0] ?? null;
}

/**
 * The achievement a signed-in user claimed today, or null if they haven't.
 * Read-only. "Today" follows the same rule as the claim itself: a
 * user_achievements row dated today in the user's profile timezone.
 */
export async function getTodaysClaimForUser(
  userId: string,
): Promise<Achievement | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();

  const today = getToday(profile?.timezone ?? "UTC");

  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(`created_at, achievements!inner (${ACHIEVEMENT_FIELDS})`)
    .eq("user_id", userId)
    .eq("achievement_date", today);

  if (error) {
    console.error("Error checking today's claim:", error);
    return null;
  }

  return pickClaim(data);
}

export interface VisitorClaim {
  signedIn: boolean;
  /** Not signed in, but this browser belongs to an account. */
  linked: boolean;
  /** What this visitor claimed today, according to the server. */
  achievement: Achievement | null;
  /**
   * True when this browser can't claim without signing in: its anonymous
   * history was linked to an account that hasn't claimed today. The claim
   * action would only answer "already claimed".
   */
  mustSignIn: boolean;
}

/**
 * Today's claim for whoever is visiting: a signed-in user, or an anonymous
 * visitor recognised by their cookie. Read-only, and it mirrors the claim
 * action's own rules so the page and the Claim button agree.
 */
export async function getVisitorTodaysClaim(): Promise<VisitorClaim> {
  const user = await getAuthenticatedUser();

  if (user) {
    return {
      signedIn: true,
      linked: false,
      achievement: await getTodaysClaimForUser(user.id),
      mustSignIn: false,
    };
  }

  const anonymousId = (await cookies()).get(ANONYMOUS_COOKIE)?.value;
  const none: VisitorClaim = {
    signedIn: false,
    linked: false,
    achievement: null,
    mustSignIn: false,
  };

  if (!anonymousId) return none;

  const { data: anonymousUser } = await supabaseAdmin
    .from("anonymous_users")
    .select("id, timezone, linked_user_id")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();

  if (!anonymousUser) return none;

  // Once linked, this browser claims through the account only.
  if (anonymousUser.linked_user_id) {
    const achievement = await getTodaysClaimForUser(
      anonymousUser.linked_user_id,
    );

    return { ...none, linked: true, achievement, mustSignIn: !achievement };
  }

  const today = getToday(anonymousUser.timezone ?? "UTC");
  const { data, error } = await supabaseAdmin
    .from("anonymous_achievements")
    .select(`created_at, achievements!inner (${ACHIEVEMENT_FIELDS})`)
    .eq("anonymous_user_id", anonymousUser.id)
    .eq("achievement_date", today);

  if (error) {
    console.error("Error checking today's anonymous claim:", error);
    return none;
  }

  return { ...none, achievement: pickClaim(data) };
}
