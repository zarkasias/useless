import type { Achievement } from "@/lib/supabase";

// Keep the full record so the homepage renders the shared site card.
export type ShowcaseAchievement = Achievement;

export function getShowcaseAchievements(
  achievements: Achievement[] = [],
  start = 0,
  end = 4,
): ShowcaseAchievement[] {
  return achievements
    .filter(
      (achievement) =>
        achievement.status === "published" &&
        achievement.is_secret === false &&
        typeof achievement.icon_path === "string" &&
        achievement.icon_path.trim().length > 0,
    )
    .slice(start, end);
}
