import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({ card: vi.fn() }));
vi.mock("@/components/home/home.module.css", () => ({ default: {} }));
vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: (props: {
    achievement: Achievement;
    showShareButton: boolean;
  }) => {
    mocks.card(props);
    return createElement("article", null, props.achievement.title);
  },
}));

import { CollectionStory } from "@/components/home/collection-story";

const achievement: Achievement = {
  id: "featured",
  title: "A minor victory",
  description: "An unnecessary accomplishment",
  type: "COMMON",
  emoji: "🏆",
  icon_path: "/icons/trophy.png",
  created_at: "2026-10-09",
  status: "published",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
};

beforeEach(() => mocks.card.mockClear());

describe("combined collection and sharing story", () => {
  it.each([false, true])(
    "illustrates external sharing without a composer for signed-in=%s",
    (isLoggedIn) => {
      const html = renderToStaticMarkup(
        createElement(CollectionStory, {
          achievements: [achievement],
          selectedIndex: 0,
          onSelect: () => {},
          isLoggedIn,
        }),
      );
      expect(html).toContain('id="collection"');
      expect(html).not.toContain('id="sharing"');
      expect(html).not.toContain("<select");
      expect(html).not.toContain("Share preview");
      expect(html).not.toContain("Download preview");
      expect(html).not.toContain("group chat");
      expect(html).toContain("Instagram");
      expect(html).toContain("WhatsApp");
      expect(html).toContain("<strong>Share</strong>");
      expect(html).toContain("<strong>Send to a friend</strong>");
      expect(html).toContain("lucide-share2");
      expect(html).toContain(
        isLoggedIn ? 'href="/collection"' : 'href="/signup?next=/collection"',
      );
      expect(mocks.card).toHaveBeenCalled();
      for (const [props] of mocks.card.mock.calls) {
        expect(props.showShareButton).toBe(false);
      }
    },
  );
});
