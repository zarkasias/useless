// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  back: vi.fn(),
  send: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
  remove: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
    back: mocks.back,
  }),
}));

vi.mock("@/app/profile/[username]/actions", () => ({
  sendFriendRequestAction: mocks.send,
  acceptFriendRequestAction: mocks.accept,
  declineFriendRequestAction: mocks.decline,
  removeFriendAction: mocks.remove,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/dashboard/dashboard-stats", () => ({
  DashboardStats: () => null,
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({
    achievement,
    showShareButton,
    variant,
  }: {
    achievement: Achievement;
    showShareButton: boolean;
    variant: string;
  }) =>
    createElement(
      "article",
      {
        "data-achievement-id": achievement.id,
        "data-share": String(showShareButton),
        "data-variant": variant,
      },
      achievement.title,
    ),
}));

import { ProfileClient } from "@/app/profile/[username]/profile-client";

type Props = Parameters<typeof ProfileClient>[0];

const profile: Props["profile"] = {
  id: "profile-id",
  username: "Alice",
  avatar_url: null,
};

const viewer: NonNullable<Props["viewer"]> = {
  id: "viewer-id",
  username: "Bob",
  role: "user",
  created_at: "2026-10-07T12:00:00.000Z",
  streak_count: 0,
};

const defaults: Props = {
  profile,
  viewer,
  viewerEntitlements: null,
  achievements: [],
  streakData: {
    currentStreak: 3,
    longestStreak: 7,
    achievementDates: [],
    claimedToday: false,
  },
  friendshipState: {
    id: null,
    status: "none",
  },
};

let container: HTMLDivElement;
let root: Root;

function achievement(index: number): Achievement {
  return {
    id: `achievement-${index}`,
    title: `Achievement ${index}`,
    description: "An unnecessary accomplishment.",
    type: "COMMON",
    emoji: "🏆",
    created_at: "2026-10-07T12:00:00.000Z",
    is_secret: false,
    trigger_type: "daily_claim",
    trigger_config: {},
    status: "published",
  };
}

async function render(overrides: Partial<Props> = {}) {
  await act(async () => {
    root.render(
      createElement(ProfileClient, {
        ...defaults,
        ...overrides,
      }),
    );
  });
}

function findButton(label: string): HTMLButtonElement | undefined {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (element) =>
      element.getAttribute("aria-label") === label ||
      element.getAttribute("title") === label ||
      element.textContent?.trim() === label,
  );
}

function button(label: string): HTMLButtonElement {
  const element = findButton(label);
  if (!element) throw new Error(`Missing button: ${label}`);
  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

function displayedIds() {
  return Array.from(container.querySelectorAll("[data-achievement-id]")).map(
    (element) => element.getAttribute("data-achievement-id"),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  for (const action of [
    mocks.send,
    mocks.accept,
    mocks.decline,
    mocks.remove,
  ]) {
    action.mockReset();
    action.mockResolvedValue({ success: true });
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ProfileClient", () => {
  it("shows the profile and empty collection to signed-out visitors", async () => {
    await render({ viewer: null });

    expect(container.querySelector("h1")?.textContent).toBe("Alice");
    expect(container.textContent).toContain("Current streak");
    expect(container.textContent).toContain("Best streak");
    expect(container.textContent).toContain("0 collected");
    expect(container.textContent).toContain("No achievements yet");
    expect(findButton("Back")).toBeUndefined();
    expect(findButton("Add Friend")).toBeUndefined();
    expect(findButton("Share Profile")).toBeUndefined();

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: null,
      isSubscribed: false,
      subscriptionStatus: null,
    });
  });

  it("passes the viewer's subscription information to the navbar", async () => {
    await render({
      viewerEntitlements: {
        achievementCount: 12,
        freeAchievementLimit: 10,
        remainingFreeAchievements: 0,
        isSubscribed: true,
        subscriptionStatus: "active",
        billingInterval: "month",
        hasReachedFreeLimit: true,
        canClaimAchievement: true,
      },
    });

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: viewer,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("navigates back", async () => {
    await render();
    await click("Back");

    expect(mocks.back).toHaveBeenCalledOnce();
  });

  it("sends a friend request and refreshes the profile", async () => {
    await render();
    await click("Add Friend");

    expect(mocks.send).toHaveBeenCalledExactlyOnceWith("profile-id", "Alice");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("logs an unsuccessful friend request and still refreshes", async () => {
    mocks.send.mockResolvedValue({
      success: false,
      message: "Request could not be sent",
    });
    await render();
    await click("Add Friend");

    expect(console.error).toHaveBeenCalledWith("Request could not be sent");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows a disabled request-sent button", async () => {
    await render({
      friendshipState: {
        id: "friendship-id",
        status: "pending_sent",
      },
    });

    expect(button("Friend Request Sent").disabled).toBe(true);
    expect(findButton("Add Friend")).toBeUndefined();
    expect(findButton("Accept Friend Request")).toBeUndefined();
  });

  const friendshipActions = [
    {
      label: "Accept Friend Request",
      status: "pending_received",
      action: mocks.accept,
    },
    {
      label: "Decline Friend Request",
      status: "pending_received",
      action: mocks.decline,
    },
    {
      label: "Remove Friend",
      status: "friends",
      action: mocks.remove,
    },
  ] satisfies Array<{
    label: string;
    status: Props["friendshipState"]["status"];
    action: typeof mocks.accept;
  }>;

  it.each(friendshipActions)(
    "$label calls the action and refreshes on success",
    async ({ label, status, action }) => {
      await render({
        friendshipState: {
          id: "friendship-id",
          status,
        },
      });
      await click(label);

      expect(action).toHaveBeenCalledExactlyOnceWith("friendship-id", "Alice");
      expect(mocks.refresh).toHaveBeenCalledOnce();
    },
  );

  it.each(friendshipActions)(
    "$label logs unsuccessful results without refreshing",
    async ({ label, status, action }) => {
      action.mockResolvedValue({
        success: false,
        message: "Friendship update failed",
      });

      await render({
        friendshipState: {
          id: "friendship-id",
          status,
        },
      });
      await click(label);

      expect(console.error).toHaveBeenCalledWith("Friendship update failed");
      expect(mocks.refresh).not.toHaveBeenCalled();
    },
  );

  it.each(friendshipActions)(
    "$label does nothing without a friendship ID",
    async ({ label, status, action }) => {
      await render({
        friendshipState: { id: null, status },
      });
      await click(label);

      expect(action).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    },
  );

  it("shows the existing friendship indicator", async () => {
    await render({
      friendshipState: {
        id: "friendship-id",
        status: "friends",
      },
    });

    expect(button("Friends").disabled).toBe(true);
    expect(button("Remove Friend").disabled).toBe(false);
    expect(findButton("Add Friend")).toBeUndefined();
  });

  it("disables repeat requests while an action is pending", async () => {
    let finish!: (value: { success: boolean }) => void;
    mocks.send.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        finish = resolve;
      }),
    );

    await render();
    await click("Add Friend");

    expect(button("Add Friend").disabled).toBe(true);

    await click("Add Friend");
    expect(mocks.send).toHaveBeenCalledOnce();

    await act(async () => {
      finish({ success: true });
    });

    expect(button("Add Friend").disabled).toBe(false);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shares the viewer's own profile", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "share");
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });

    try {
      await render({
        viewer: { ...viewer, id: profile.id },
      });

      expect(findButton("Add Friend")).toBeUndefined();
      await click("Share Profile");

      expect(share).toHaveBeenCalledExactlyOnceWith({
        title: "Alice on Useless Achievements",
        url: window.location.href,
      });
    } finally {
      if (descriptor) {
        Object.defineProperty(navigator, "share", descriptor);
      } else {
        Reflect.deleteProperty(navigator, "share");
      }
    }
  });

  it("allows clicking share when native sharing is unavailable", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "share");
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    try {
      await render({
        viewer: { ...viewer, id: profile.id },
      });
      await click("Share Profile");

      expect(button("Share Profile").disabled).toBe(false);
    } finally {
      if (descriptor) {
        Object.defineProperty(navigator, "share", descriptor);
      } else {
        Reflect.deleteProperty(navigator, "share");
      }
    }
  });

  it("renders a small collection without pagination", async () => {
    await render({
      achievements: [achievement(1), achievement(2)],
    });

    expect(displayedIds()).toEqual(["achievement-1", "achievement-2"]);
    expect(container.textContent).toContain("2 collected");
    expect(findButton("Next")).toBeUndefined();
    expect(container.textContent).not.toContain("No achievements yet");

    for (const card of container.querySelectorAll("[data-achievement-id]")) {
      expect(card.getAttribute("data-share")).toBe("false");
      expect(card.getAttribute("data-variant")).toBe("compact");
    }
  });

  it("paginates achievements and disables navigation at the boundaries", async () => {
    await render({
      achievements: Array.from({ length: 21 }, (_, index) =>
        achievement(index + 1),
      ),
    });

    expect(displayedIds()).toEqual(
      Array.from({ length: 10 }, (_, index) => `achievement-${index + 1}`),
    );
    expect(container.textContent).toContain("Showing 1–10 of 21");
    expect(button("Previous").disabled).toBe(true);

    await click("Next");

    expect(displayedIds()).toEqual(
      Array.from({ length: 10 }, (_, index) => `achievement-${index + 11}`),
    );
    expect(container.textContent).toContain("Page 2 of 3");

    await click("Next");

    expect(displayedIds()).toEqual(["achievement-21"]);
    expect(container.textContent).toContain("Showing 21–21 of 21");
    expect(button("Next").disabled).toBe(true);

    await click("Previous");

    expect(container.textContent).toContain("Page 2 of 3");
    expect(displayedIds()).toHaveLength(10);
  });

  it("clamps the displayed page when the collection becomes smaller", async () => {
    await render({
      achievements: Array.from({ length: 21 }, (_, index) =>
        achievement(index + 1),
      ),
    });

    await click("Next");
    await click("Next");

    await render({
      achievements: Array.from({ length: 11 }, (_, index) =>
        achievement(index + 1),
      ),
    });

    expect(container.textContent).toContain("Page 2 of 2");
    expect(displayedIds()).toEqual(["achievement-11"]);
    expect(button("Next").disabled).toBe(true);
  });
});
