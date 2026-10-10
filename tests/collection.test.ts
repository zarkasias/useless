import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement("article", null, achievement.title),
}));
import AchievementsClient from "@/app/collection/achievements-client";

function achievement(
  id: string,
  status: Achievement["status"] = "published",
): Achievement {
  return {
    id,
    title: id,
    description: id,
    type: "COMMON",
    emoji: "🏆",
    created_at: "2026-09-08",
    status,
    is_secret: false,
    trigger_type: null,
    trigger_config: null,
  };
}
function render(
  allAchievements: Achievement[],
  collectedAchievements: Achievement[],
) {
  return renderToStaticMarkup(
    createElement(AchievementsClient, {
      initialProfile: {
        id: "user-1",
        username: "tester",
        role: "user",
        created_at: "2026-09-08",
        streak_count: 0,
      },
      allAchievements,
      collectedAchievements,
      initialEntitlements: {
        achievementCount: collectedAchievements.length,
        freeAchievementLimit: 5,
        remainingFreeAchievements: 0,
        isSubscribed: false,
        subscriptionStatus: null,
        billingInterval: null,
        hasReachedFreeLimit: false,
        canClaimAchievement: true,
      },
    }),
  );
}
it("excludes inaccessible and archived collected achievements from cards and progress", () => {
  const core = achievement("Core reward");
  const remaining = achievement("Another core reward");
  const hidden = achievement("Unpurchased Halloween reward");
  const archived = achievement("Archived reward", "archived");
  const html = render([core, remaining, archived], [core, hidden, archived]);
  expect(html).toContain("1 of 2 collected");
  expect(html).toContain("50% of the collection complete");
  expect(html).toContain("1 remaining");
  expect(html).toContain("<article>Core reward</article>");
  expect(html).not.toContain(hidden.title);
  expect(html).not.toContain(archived.title);
});
it("includes purchased pack achievements supplied by the eligible catalog", () => {
  const core = achievement("Core reward");
  const pack = achievement("Purchased Halloween reward");
  const html = render([core, pack], [core, pack]);
  expect(html).toContain("2 of 2 collected");
  expect(html).toContain("100% of the collection complete");
  expect(html).toContain("<article>Purchased Halloween reward</article>");
});
it("renders an empty collection with zero progress", () => {
  const html = render([], []);
  expect(html).toContain("0 of 0 collected");
  expect(html).toContain("0% of the collection complete");
  expect(html).toContain("Nothing here yet.");
  expect(html).not.toContain("NaN");
});
