import "server-only";

import type { Achievement, AchievementType } from "@/lib/supabase";
import { getAchievementPackFilter } from "./achievement-access-service-server";
import { getAuthenticatedUserAchievements } from "./achievement-service-server";
import { supabaseAdmin } from "./utils/trigger-context";

/** The rarities the wall draws. Secret and game cards stay off it. */
export const WALL_RARITIES = [
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
] as const satisfies readonly AchievementType[];

/**
 * Every achievement on the homepage wall. Read-only: published, not secret,
 * has an icon, and in the packs everyone gets (core packs and unassigned
 * legacy achievements, the same rule the claim uses). Seasonal and paid packs
 * stay off. Publishing an achievement adds its card with no code change. The
 * order is fixed so the wall tiles the same way on every visit.
 */
export async function getWallCatalog(): Promise<Achievement[]> {
  const packFilter = await getAchievementPackFilter();
  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .in("type", WALL_RARITIES)
    .eq("status", "published")
    .eq("is_secret", false)
    .or(packFilter)
    .not("icon_path", "is", null)
    .neq("icon_path", "")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Error loading the wall catalog:", error);
    return [];
  }

  return ((data ?? []) as Achievement[]).flatMap((achievement) => {
    const iconPath = achievement.icon_path?.trim();

    return iconPath ? [{ ...achievement, icon_path: iconPath }] : [];
  });
}

/**
 * Ids of the achievements the signed-in user has unlocked, from the existing
 * unlock records. Empty for logged-out visitors; their claim today is known
 * from getVisitorTodaysClaim instead.
 */
export async function getWallUnlockedIds(signedIn: boolean): Promise<string[]> {
  if (!signedIn) return [];

  const achievements = await getAuthenticatedUserAchievements();

  return [...new Set(achievements.map((achievement) => achievement.id))];
}
