// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({
    achievement,
    ingrid,
    isCollected,
    showShareButton,
    variant,
  }: {
    achievement: Achievement;
    ingrid: boolean;
    isCollected: boolean;
    showShareButton: boolean;
    variant: string;
  }) =>
    createElement(
      "article",
      {
        "data-id": achievement.id,
        "data-grid": String(ingrid),
        "data-collected": String(isCollected),
        "data-share": String(showShareButton),
        "data-variant": variant,
      },
      achievement.title,
    ),
}));

import GameAchievements from "@/components/games/system/game-achievements";

function achievement(id: string, title: string): Achievement {
  return {
    id,
    title,
    description: "You did the thing.",
    type: "COMMON",
    emoji: "🏆",
    created_at: "2026-10-07T12:00:00.000Z",
    is_daily: false,
    is_secret: false,
    trigger_type: null,
    trigger_config: null,
    status: "published",
  };
}

function render(achievements: Achievement[]) {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    createElement(GameAchievements, { achievements }),
  );

  return container;
}

describe("GameAchievements", () => {
  it("renders nothing when no achievements were unlocked", () => {
    const container = render([]);

    expect(container.innerHTML).toBe("");
  });

  it("uses the singular heading for one unlocked achievement", () => {
    const container = render([achievement("award-1", "First victory")]);

    expect(container.textContent).toContain("Achievement Unlocked");
    expect(container.textContent).not.toContain("Achievements Unlocked");
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.querySelector("article")?.textContent).toBe(
      "First victory",
    );
  });

  it("uses the plural heading and preserves achievement order", () => {
    const container = render([
      achievement("award-1", "First victory"),
      achievement("award-2", "Persistent player"),
    ]);

    expect(container.textContent).toContain("Achievements Unlocked");

    const cards = container.querySelectorAll("article");

    expect(Array.from(cards, (card) => card.getAttribute("data-id"))).toEqual([
      "award-1",
      "award-2",
    ]);
    expect(Array.from(cards, (card) => card.textContent)).toEqual([
      "First victory",
      "Persistent player",
    ]);
  });

  it("renders unlocked cards as collected, compact, and without sharing controls", () => {
    const container = render([
      achievement("award-1", "First victory"),
      achievement("award-2", "Persistent player"),
    ]);

    const cards = container.querySelectorAll("article");
    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(card.getAttribute("data-grid")).toBe("true");
      expect(card.getAttribute("data-collected")).toBe("true");
      expect(card.getAttribute("data-share")).toBe("false");
      expect(card.getAttribute("data-variant")).toBe("compact");
    }
  });
});
