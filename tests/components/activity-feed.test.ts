// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FriendActivityItem } from "@/lib/services/activity-service-server";

import { ActivityFeed } from "@/components/dashboard/activity-feed";

function activity(
  index: number,
  iconPath: string | null = null,
): FriendActivityItem {
  return {
    id: `activity-${index}`,
    created_at: "2026-10-07T12:00:00.000Z",
    user: {
      id: `user-${index}`,
      username: `Player${index}`,
      avatar_url: null,
    },
    achievement: {
      id: `achievement-${index}`,
      title: `Award ${index}`,
      type: "COMMON",
      emoji: "🏆",
      icon_path: iconPath,
    },
  };
}

function render(friendActivity: FriendActivityItem[]) {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    createElement(ActivityFeed, { friendActivity }),
  );

  return container;
}

describe("ActivityFeed", () => {
  it("shows the empty state when there is no activity", () => {
    const container = render([]);

    expect(container.querySelector("h2")?.textContent).toBe("Friend activity");
    expect(container.textContent).toContain("No friend activity yet.");
    expect(container.querySelector("a")).toBeNull();
  });

  it("shows who unlocked an achievement and links to their profile", () => {
    const container = render([activity(1)]);

    expect(container.textContent).toContain("Player1 unlocked Award 1");
    expect(container.textContent).not.toContain("No friend activity yet.");

    const links = container.querySelectorAll("a");

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/profile/Player1");
    }

    expect(
      container.querySelector('[data-slot="avatar-fallback"]')?.textContent,
    ).toBe("PL");
  });

  it("formats the activity date for display", () => {
    const record = activity(1);
    const container = render([record]);

    const expectedDate = new Date(record.created_at).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    );

    expect(container.textContent).toContain(expectedDate);
  });

  it("renders achievement artwork when supplied", () => {
    const container = render([activity(1, "/icons/award.png")]);

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Award 1");
  });

  it("omits achievement artwork when none exists", () => {
    const container = render([activity(1)]);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("Award 1");
  });

  it("displays only the first six activities in their supplied order", () => {
    const container = render(
      Array.from({ length: 8 }, (_, index) => activity(index + 1)),
    );

    const usernames = Array.from(
      container.querySelectorAll("p a"),
      (link) => link.textContent,
    );

    expect(usernames).toEqual([
      "Player1",
      "Player2",
      "Player3",
      "Player4",
      "Player5",
      "Player6",
    ]);
    expect(container.textContent).not.toContain("Award 7");
    expect(container.textContent).not.toContain("Award 8");
  });
});
