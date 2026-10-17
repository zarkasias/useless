import { describe, expect, it } from "vitest";
import { getShowcaseAchievements } from "@/components/home/home-data";
import type { Achievement } from "@/lib/supabase";

const achievement: Achievement = {
  id: "featured",
  title: "A minor victory",
  description: "An unnecessary accomplishment.",
  type: "COMMON",
  emoji: "🏆",
  icon_path: "/icons/trophy.png ",
  created_at: "2026-10-09T00:00:00Z",
  status: "published",
  is_secret: false,
  trigger_type: "daily_claim",
  trigger_config: { days: ["friday"] },
};

describe("homepage showcase", () => {
  it("retains the complete record for the shared achievement card", () => {
    expect(getShowcaseAchievements([achievement])).toEqual([
      { ...achievement, icon_path: "/icons/trophy.png" },
    ]);
  });

  it("excludes unpublished, secret and imageless achievements without fictional fallbacks", () => {
    const invalid: Achievement[] = [
      { ...achievement, status: "draft" },
      { ...achievement, status: "archived" },
      { ...achievement, is_secret: true },
      { ...achievement, icon_path: null },
      { ...achievement, icon_path: "   " },
      { ...achievement, icon_path: undefined },
    ];
    expect(getShowcaseAchievements(invalid)).toEqual([]);
    expect(getShowcaseAchievements()).toEqual([]);
  });
});
