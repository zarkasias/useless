// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";
import type { FriendListItem } from "@/lib/services/friend-service-server";

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

import { FriendsClient } from "@/app/friends/friends-client";

const user: UserProfile = {
  id: "user-1",
  username: "CurrentPlayer",
  role: "user",
  created_at: "2026-10-01T12:00:00.000Z",
  streak_count: 3,
};

function friend(
  username: string,
  avatarUrl: string | null = null,
): FriendListItem {
  return {
    friendshipId: `friendship-${username}`,
    friend: {
      id: `user-${username}`,
      username,
      avatar_url: avatarUrl,
    },
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
  };
}

function render(friends: FriendListItem[]) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(FriendsClient, { user, friends }),
  );
  return container;
}

describe("FriendsClient", () => {
  it("shows guidance when the user has no friends", () => {
    const container = render([]);

    expect(container.querySelector("h1")?.textContent).toBe("Friends");
    expect(container.textContent).toContain("No friends yet");
    expect(container.textContent).toContain(
      "Visit the leaderboard to find someone to add.",
    );
    expect(container.querySelectorAll('a[href^="/profile/"]')).toHaveLength(0);
  });

  it("renders a profile link for every friend", () => {
    const container = render([
      friend("alice"),
      friend("Bob", "https://example.com/bob.png"),
    ]);

    const links = container.querySelectorAll('a[href^="/profile/"]');

    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/profile/alice");
    expect(links[0].textContent).toContain("alice");
    expect(links[0].textContent).toContain("View profile");
    expect(links[1].getAttribute("href")).toBe("/profile/Bob");
    expect(links[1].textContent).toContain("Bob");
    expect(links[1].textContent).toContain("View profile");
    expect(container.textContent).not.toContain("No friends yet");
  });

  it("provides uppercase avatar initials for friends without images", () => {
    const container = render([friend("alice"), friend("b")]);

    const fallbacks = container.querySelectorAll(
      '[data-slot="avatar-fallback"]',
    );

    expect(Array.from(fallbacks, (element) => element.textContent)).toEqual([
      "AL",
      "B",
    ]);
  });
});
