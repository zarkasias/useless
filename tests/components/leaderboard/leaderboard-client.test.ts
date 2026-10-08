// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navbar: vi.fn(),
  table: vi.fn(),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/leaderboard/leaderboard-table", () => ({
  LeaderboardTable: (props: unknown) => {
    mocks.table(props);
    return null;
  },
}));

import LeaderboardClient from "@/app/leaderboard/leaderboard-client";

type Props = Parameters<typeof LeaderboardClient>[0];

const profile: NonNullable<Props["initialProfile"]> = {
  id: "user-1",
  username: "Alice",
  role: "user",
  created_at: "2026-10-08T12:00:00.000Z",
  streak_count: 3,
};

const users: Props["initialUsers"] = [
  {
    ...profile,
    achievementCount: 12,
    currentStreak: 3,
  },
];

const entitlements: NonNullable<Props["initialEntitlements"]> = {
  achievementCount: 12,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 0,
  isSubscribed: true,
  subscriptionStatus: "active",
  billingInterval: "month",
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

function render(overrides: Partial<Props> = {}): HTMLDivElement {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    createElement(LeaderboardClient, {
      initialProfile: profile,
      initialUsers: users,
      initialEntitlements: entitlements,
      friendIds: ["friend-1"],
      ...overrides,
    }),
  );

  return container;
}

describe("LeaderboardClient", () => {
  it("renders the leaderboard heading and description", () => {
    const container = render();

    expect(container.querySelector("main")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent?.trim()).toBe(
      "Achievement Leaderboard",
    );
    expect(
      container.querySelector("header p")?.textContent?.replace(/\s+/g, " "),
    ).toBe(
      "See who has devoted the most effort to accomplishing absolutely nothing useful.",
    );
  });

  it("passes the profile and subscription to the navbar", () => {
    render();

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("passes users and friend IDs to the loaded table", () => {
    render();

    expect(mocks.table).toHaveBeenLastCalledWith({
      users,
      isLoading: false,
      friendIds: ["friend-1"],
    });
  });

  it("defaults subscription information when entitlements are absent", () => {
    render({ initialEntitlements: null });

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: profile,
      isSubscribed: false,
      subscriptionStatus: null,
    });
  });

  it("preserves an unsubscribed account's subscription status", () => {
    render({
      initialEntitlements: {
        ...entitlements,
        isSubscribed: false,
        subscriptionStatus: "canceled",
      },
    });

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: profile,
      isSubscribed: false,
      subscriptionStatus: "canceled",
    });
  });

  it("supports a missing profile and empty leaderboard", () => {
    render({
      initialProfile: null,
      initialEntitlements: null,
      initialUsers: [],
      friendIds: [],
    });

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: null,
      isSubscribed: false,
      subscriptionStatus: null,
    });
    expect(mocks.table).toHaveBeenLastCalledWith({
      users: [],
      isLoading: false,
      friendIds: [],
    });
  });
});
