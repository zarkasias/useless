// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  claim: vi.fn(),
  streak: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/app/actions/achievement-actions", () => ({
  claimDailyAchievementAction: mocks.claim,
  getStreakDataAction: mocks.streak,
}));

vi.mock("sonner", () => ({
  toast: {
    info: mocks.info,
    success: mocks.success,
    error: mocks.error,
  },
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

vi.mock("@/components/timezone-sync", () => ({
  Timezonesync: () => null,
}));

vi.mock("@/components/dashboard/streak-calendar", () => ({
  StreakCalendar: () => null,
}));

vi.mock("@/components/dashboard/streak-share-button", () => ({
  StreakShareButton: () => null,
}));

vi.mock("@/components/dashboard/activity-feed", () => ({
  ActivityFeed: () => null,
}));

vi.mock("@/components/packs/featured-pack-promo", () => ({
  FeaturedPackPromo: () => null,
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement(
      "article",
      { "data-achievement-id": achievement.id },
      achievement.title,
    ),
}));

vi.mock("@/components/unlock-achievement", () => ({
  UnlockAchievement: ({
    achievement,
    onClose,
  }: {
    achievement: Achievement;
    onClose: () => void;
  }) =>
    createElement(
      "div",
      { "data-testid": "unlock" },
      achievement.title,
      createElement("button", { onClick: onClose }, "Close unlock"),
    ),
}));

import DashboardClient from "@/app/dashboard/dashboard-client";

type DashboardProps = Parameters<typeof DashboardClient>[0];

let container: HTMLDivElement;
let root: Root;

function achievement(id: string, title = id): Achievement {
  return {
    id,
    title,
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

const initialStreak = {
  currentStreak: 0,
  longestStreak: 0,
  achievementDates: [],
  claimedToday: false,
};

async function render(overrides: Partial<DashboardProps> = {}) {
  await act(async () => {
    root.render(
      createElement(DashboardClient, {
        initialProfile: {
          id: "user-1",
          username: "Player",
          role: "user",
          created_at: "2026-10-01T12:00:00.000Z",
          streak_count: 0,
        },
        initialAchievements: [],
        initialStreakData: initialStreak,
        initialEntitlements: {
          achievementCount: 0,
          freeAchievementLimit: 10,
          remainingFreeAchievements: 10,
          isSubscribed: false,
          subscriptionStatus: null,
          billingInterval: null,
          hasReachedFreeLimit: false,
          canClaimAchievement: true,
        },
        initialPacks: [],
        initialTriggeredAchievements: [],
        latestMetaAchievement: null,
        friendActivity: [],
        ...overrides,
      }),
    );
  });
}

function button(label: string) {
  const element = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!element) {
    throw new Error(`Missing button: ${label}`);
  }

  return element;
}

async function click(label = "Claim Today's Achievement") {
  await act(async () => {
    button(label).click();
  });
}

function recentIds() {
  return Array.from(container.querySelectorAll("article"), (element) =>
    element.getAttribute("data-achievement-id"),
  );
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.streak.mockResolvedValue({
    currentStreak: 1,
    longestStreak: 1,
    achievementDates: ["2026-10-07"],
    claimedToday: true,
  });

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

describe("DashboardClient", () => {
  it("shows the initial empty collection and claim action", async () => {
    await render();

    expect(container.querySelector("h1")?.textContent).toBe("Player");
    expect(container.textContent).toContain("No achievements yet");
    expect(button("Claim Today's Achievement").disabled).toBe(false);
  });

  it("shows completed daily status when already claimed", async () => {
    await render({
      initialStreakData: {
        ...initialStreak,
        claimedToday: true,
      },
    });

    expect(container.textContent).toContain("Achievement claimed");
    expect(container.textContent).not.toContain("Claim Today's Achievement");
  });

  it("displays only the three most recent achievements", async () => {
    await render({
      initialAchievements: [
        achievement("a"),
        achievement("b"),
        achievement("c"),
        achievement("d"),
      ],
    });

    expect(recentIds()).toEqual(["a", "b", "c"]);
  });

  it.each([
    {
      status: "already_claimed",
      message: "You've already claimed today's achievement.",
      redirects: false,
    },
    {
      status: "subscription_required",
      message:
        "You've reached the free limit of 10 achievements. Subscribe to continue collecting.",
      redirects: true,
    },
    {
      status: "unavailable",
      message: "Today's achievement is unavailable right now.",
      redirects: false,
    },
  ])(
    "handles the $status claim result",
    async ({ status, message, redirects }) => {
      mocks.claim.mockResolvedValue({ status, achievement: null });
      await render();

      await click();

      expect(mocks.info).toHaveBeenCalledWith(message);
      expect(mocks.streak).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="unlock"]')).toBeNull();
      expect(button("Claim Today's Achievement").disabled).toBe(false);

      if (redirects) {
        expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/pro");
      } else {
        expect(mocks.push).not.toHaveBeenCalled();
      }
    },
  );

  it("adds a claimed achievement, refreshes streaks, and opens the unlock dialog", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("daily", "Daily award"),
      triggeredAchievements: [],
    });
    await render();

    await click();

    expect(recentIds()).toEqual(["daily"]);
    expect(mocks.streak).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith("Today's achievement unlocked!");
    expect(container.textContent).toContain("Achievement claimed");
    expect(
      container.querySelector('[data-testid="unlock"]')?.textContent,
    ).toContain("Daily award");

    await click("Close unlock");

    expect(container.querySelector('[data-testid="unlock"]')).toBeNull();
  });

  it("adds triggered achievements and highlights the latest special achievement", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("daily"),
      triggeredAchievements: [achievement("special", "Special award")],
    });
    await render();

    await click();

    expect(recentIds()).toEqual(["daily", "special"]);
    expect(container.textContent).toContain("Special Achievement Unlocked");
    expect(container.querySelector("h3")?.textContent).toBe("Special award");
  });

  it("does not add achievements already in the collection", async () => {
    const existing = achievement("existing");
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: existing,
      triggeredAchievements: [],
    });
    await render({ initialAchievements: [existing] });

    await click();

    expect(recentIds()).toEqual(["existing"]);
  });

  it("accepts a successful claim without triggered achievements", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("daily"),
    });
    await render();

    await click();

    expect(recentIds()).toEqual(["daily"]);
    expect(mocks.success).toHaveBeenCalledOnce();
  });

  it("logs claim failures and allows another attempt", async () => {
    const error = new Error("Claim unavailable");
    mocks.claim.mockRejectedValue(error);
    await render();

    await click();

    expect(console.error).toHaveBeenCalledWith(
      "Error claiming daily achievement:",
      error,
    );
    expect(mocks.error).toHaveBeenCalledWith("Something went wrong");
    expect(button("Claim Today's Achievement").disabled).toBe(false);
    expect(mocks.streak).not.toHaveBeenCalled();
  });

  it("disables repeat clicks while a claim is pending", async () => {
    let finish!: (value: unknown) => void;
    mocks.claim.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();

    await click();

    expect(button("Claiming achievement...").disabled).toBe(true);

    await click("Claiming achievement...");

    expect(mocks.claim).toHaveBeenCalledOnce();

    await act(async () => {
      finish({ status: "already_claimed", achievement: null });
    });

    expect(button("Claim Today's Achievement").disabled).toBe(false);
  });
});
