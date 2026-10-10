import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Achievement, UserProfile } from "@/lib/supabase";

vi.mock("@/components/home/home.module.css", () => ({ default: {} }));

vi.mock("@/components/home/hero-achievement-card", () => ({
  HeroAchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement("article", null, achievement.title),
}));

import { ProfileStory } from "@/components/home/profile-story";

const user: UserProfile = {
  id: "visitor",
  username: "ActualCollector",
  role: "user",
  created_at: "2026-10-09",
  streak_count: 99,
};
const featured: Achievement = {
  id: "featured",
  title: "Featured but not earned",
  description: "A showcase achievement",
  type: "LEGENDARY",
  emoji: "🏆",
  icon_path: "/icons/trophy.png",
  created_at: "2026-10-09",
  status: "published",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
};
describe("public homepage demo profile", () => {
  it.each([user, null])(
    "shows the same fictional identity and stats for every viewer",
    (viewer) => {
      const html = renderToStaticMarkup(
        createElement(ProfileStory, {
          user: viewer,
          achievements: [featured],
        }),
      );
      expect(html).toContain("Procrastinator");
      expect(html).toContain("Fictional user and example stats");
      expect(html).toContain(">14</div>");
      expect(html).toContain(">42</div>");
      expect(html).toContain(">68</p>");
      expect(html).toContain("Featured but not earned");
      expect(html).not.toContain("ActualCollector</h3>");
      expect(html).not.toContain('aria-label="Share Profile"');
    },
  );

  it("routes guests to sign-in instead of exposing a direct leaderboard link", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileStory, {
        user: null,
        achievements: [featured],
      }),
    );
    expect(html).toContain('href="/login?next=/leaderboard"');
    expect(html).not.toContain('href="/leaderboard"');
    expect(html).toContain('href="/signup"');
  });

  it("provides account destinations for signed-in viewers without showing their data", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileStory, {
        user,
        achievements: [featured],
      }),
    );
    expect(html).toContain('href="/profile/ActualCollector"');
    expect(html).toContain('href="/leaderboard"');
    expect(html).toContain("Procrastinator");
  });
});
